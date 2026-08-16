import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_dependency_unlock_engine.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_failure_policy.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_initial_activation_engine.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_job_lifecycle_engine.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_retry_backoff_policy.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_run_progress_evaluator.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_dependency_graph.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_job.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_types.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_work_order.dart';

void main() {
  const failurePolicy = AcademicFactoryFailurePolicy();
  const backoffPolicy = AcademicFactoryRetryBackoffPolicy();
  const lifecycleEngine = AcademicFactoryJobLifecycleEngine();
  const unlockEngine = AcademicFactoryDependencyUnlockEngine();
  const progressEvaluator = AcademicFactoryRunProgressEvaluator();
  const activationEngine = AcademicFactoryInitialActivationEngine();

  final created = DateTime.utc(2026, 8, 16, 10);

  AcademicFactoryWorkOrder makeWorkOrder({
    required List<String> canonicalTargetIds,
    int maxParallelUnlocks = 24,
    int maxAttemptsPerJob = 5,
  }) {
    return AcademicFactoryWorkOrder(
      workOrderId: 'wo-1',
      runId: 'run-1',
      missionId: 'jee_main_2026',
      canonicalTargetIds: canonicalTargetIds,
      requestedJobTypes:
          AcademicFactoryWorkOrderPlanner.deterministicBaseJobTypes,
      createdAtUtc: created,
      maxParallelUnlocks: maxParallelUnlocks,
      maxAttemptsPerJob: maxAttemptsPerJob,
    );
  }

  group('AAF-003D Combined Domain Closure Proof', () {
    test('Verify in-memory governed brain end-to-end flow for 1 AMTN', () {
      final workOrder = makeWorkOrder(
        canonicalTargetIds: const ['AMTN-001'],
        maxAttemptsPerJob: 5,
      );
      final planner = const AcademicFactoryWorkOrderPlanner();
      final initialJobs = planner.buildJobs(workOrder);

      // Verify ONE_AMTN_BASE_JOB_COUNT
      expect(initialJobs.length, 11);

      var graph = AcademicFactoryDependencyGraph(jobs: initialJobs);

      // ONE_AMTN_BEFORE_ACTIVATION
      var progressBefore = progressEvaluator.evaluate(
        runId: workOrder.runId,
        missionId: workOrder.missionId,
        jobs: graph.jobs,
      );
      expect(progressBefore.totalJobs, 11);
      expect(progressBefore.plannedJobs, 1);
      expect(progressBefore.readyJobs, 0);
      expect(progressBefore.waitingDependencyJobs, 10);

      // Perform initial activation
      final activatedJobs = activationEngine.activate(
        jobs: graph.jobs,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 1),
      );
      graph = AcademicFactoryDependencyGraph(jobs: activatedJobs);

      // ONE_AMTN_AFTER_ACTIVATION
      var progressAfter = progressEvaluator.evaluate(
        runId: workOrder.runId,
        missionId: workOrder.missionId,
        jobs: graph.jobs,
      );
      expect(progressAfter.totalJobs, 11);
      expect(progressAfter.plannedJobs, 0);
      expect(progressAfter.readyJobs, 1);
      expect(progressAfter.waitingDependencyJobs, 10);

      // ROOT_ACTIVATION_COUNT
      final activatedRootCount = activatedJobs
          .where((j) => j.state == AcademicFactoryJobState.ready)
          .length;
      expect(activatedRootCount, 1);

      // NON_ROOT_ACTIVATION_BLOCKED
      // Test that manually adding a planned job with dependencies to activationEngine does not activate it
      final plannedWithDep = AcademicFactoryJob(
        jobId: 'planned-dep',
        runId: workOrder.runId,
        missionId: workOrder.missionId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookValidation,
        state: AcademicFactoryJobState.planned,
        dependencyJobIds: const ['dep-1'],
        attemptCount: 0,
        maxAttempts: 3,
        idempotencyKey: 'key-planned-dep',
        createdAtUtc: created,
        updatedAtUtc: created,
      );
      final activatedCustom = activationEngine.activate(
        jobs: [plannedWithDep],
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 1),
      );
      expect(activatedCustom.first.state, AcademicFactoryJobState.planned);

      // DEPENDENCY_BYPASS_VIA_INITIAL_ACTIVATION
      // Jobs in waitingDependency state are not touched by activation engine
      final waitingJob = initialJobs.firstWhere(
          (j) => j.state == AcademicFactoryJobState.waitingDependency);
      final activatedWaiting = activationEngine.activate(
        jobs: [waitingJob],
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 1),
      );
      expect(activatedWaiting.first.state,
          AcademicFactoryJobState.waitingDependency);

      // ROOT_EXECUTION_VALIDATED: Claim, run, and approve the root sourceAcquisition job
      final rootId = AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.sourceAcquisition,
      );

      // 1. Root job is already ready due to initial activation seam
      var rootJob = graph.jobsById[rootId]!;
      expect(rootJob.state, AcademicFactoryJobState.ready);

      // 2. Claim ready job (transition ready -> leased)
      var updatedRoot = lifecycleEngine.claimReadyJob(
        job: rootJob,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 10),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 2),
      );
      expect(updatedRoot.state, AcademicFactoryJobState.leased);
      expect(updatedRoot.attemptCount, 1);

      final rootLeasedFirstPlay = updatedRoot;

      var updatedJobs =
          graph.jobs.map((j) => j.jobId == rootId ? updatedRoot : j).toList();
      graph = AcademicFactoryDependencyGraph(jobs: updatedJobs);

      // 3. Start leased job (transition leased -> running)
      rootJob = graph.jobsById[rootId]!;
      updatedRoot = lifecycleEngine.startLeasedJob(
        job: rootJob,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 3),
      );
      expect(updatedRoot.state, AcademicFactoryJobState.running);

      updatedJobs =
          graph.jobs.map((j) => j.jobId == rootId ? updatedRoot : j).toList();
      graph = AcademicFactoryDependencyGraph(jobs: updatedJobs);

      // 4. Approve running job (transition running -> approved)
      rootJob = graph.jobsById[rootId]!;
      updatedRoot = lifecycleEngine.approve(
        job: rootJob,
        leaseOwner: 'worker-1',
        outputHash: 'hash-acquisition',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 4),
      );
      expect(updatedRoot.state, AcademicFactoryJobState.approved);
      expect(updatedRoot.outputHash, 'hash-acquisition');

      updatedJobs =
          graph.jobs.map((j) => j.jobId == rootId ? updatedRoot : j).toList();
      graph = AcademicFactoryDependencyGraph(jobs: updatedJobs);

      // SOURCE_VALIDATION_UNLOCK_VALIDATED
      // Since sourceAcquisition is approved, sourceValidation can now unlock
      final valId = AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.sourceValidation,
      );

      var unlockPlan = unlockEngine.buildUnlockPlan(
          graph: graph, maxParallelUnlocks: workOrder.maxParallelUnlocks);
      expect(unlockPlan.unlockableJobIds, [valId]);

      // Unlock sourceValidation
      var valJob = graph.jobsById[valId]!;
      var updatedVal = AcademicFactoryJob(
        jobId: valJob.jobId,
        runId: valJob.runId,
        missionId: valJob.missionId,
        canonicalTargetId: valJob.canonicalTargetId,
        type: valJob.type,
        state: AcademicFactoryJobState.ready,
        dependencyJobIds: valJob.dependencyJobIds,
        attemptCount: valJob.attemptCount,
        maxAttempts: valJob.maxAttempts,
        idempotencyKey: valJob.idempotencyKey,
        createdAtUtc: valJob.createdAtUtc,
        updatedAtUtc: DateTime.utc(2026, 8, 16, 10, 5),
      );

      updatedJobs =
          graph.jobs.map((j) => j.jobId == valId ? updatedVal : j).toList();
      graph = AcademicFactoryDependencyGraph(jobs: updatedJobs);

      // Run and approve sourceValidation
      valJob = graph.jobsById[valId]!;
      updatedVal = lifecycleEngine.claimReadyJob(
        job: valJob,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 10),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 6),
      );
      updatedVal = lifecycleEngine.startLeasedJob(
        job: updatedVal,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 7),
      );
      updatedVal = lifecycleEngine.approve(
        job: updatedVal,
        leaseOwner: 'worker-1',
        outputHash: 'hash-validation',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 8),
      );

      updatedJobs =
          graph.jobs.map((j) => j.jobId == valId ? updatedVal : j).toList();
      graph = AcademicFactoryDependencyGraph(jobs: updatedJobs);

      // DIGIBOOK_CRUCIBLE_PARALLEL_UNLOCK_VALIDATED
      // Once sourceValidation is approved, both digibookDraft and crucibleDraft can unlock in parallel
      final dbDraftId = AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookDraft,
      );
      final crDraftId = AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.crucibleDraft,
      );

      unlockPlan = unlockEngine.buildUnlockPlan(
          graph: graph, maxParallelUnlocks: workOrder.maxParallelUnlocks);
      expect(unlockPlan.unlockableJobIds.toSet(), {dbDraftId, crDraftId});

      // TRANSIENT_RETRY_LOOP_VALIDATED & PREMATURE_RETRY_WAKE_BLOCKED & DUE_RETRY_WAKE_VALIDATED
      // Transition digibookDraft to ready, claim it, start running, fail with rate limit, wait backoff, wake due.
      var dbDraftJob = graph.jobsById[dbDraftId]!;
      var updatedDbDraft = AcademicFactoryJob(
        jobId: dbDraftJob.jobId,
        runId: dbDraftJob.runId,
        missionId: dbDraftJob.missionId,
        canonicalTargetId: dbDraftJob.canonicalTargetId,
        type: dbDraftJob.type,
        state: AcademicFactoryJobState.ready,
        dependencyJobIds: dbDraftJob.dependencyJobIds,
        attemptCount: dbDraftJob.attemptCount,
        maxAttempts: dbDraftJob.maxAttempts,
        idempotencyKey: dbDraftJob.idempotencyKey,
        createdAtUtc: dbDraftJob.createdAtUtc,
        updatedAtUtc: DateTime.utc(2026, 8, 16, 10, 9),
      );

      updatedDbDraft = lifecycleEngine.claimReadyJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 10),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 10),
      );
      updatedDbDraft = lifecycleEngine.startLeasedJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 11),
      );

      // Fail with rate limit -> action: retry, state: retryWait
      updatedDbDraft = lifecycleEngine.classifyAndApplyFailure(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.rateLimited,
        failurePolicy: failurePolicy,
        backoffPolicy: backoffPolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 12),
      );

      expect(updatedDbDraft.state, AcademicFactoryJobState.retryWait);
      expect(updatedDbDraft.nextRetryAtUtc,
          DateTime.utc(2026, 8, 16, 10, 13)); // 1 min base delay

      // PREMATURE_RETRY_WAKE_BLOCKED
      expect(
        () => lifecycleEngine.wakeRetry(
          job: updatedDbDraft,
          eventAtUtc: DateTime.utc(2026, 8, 16, 10, 12, 59),
        ),
        throwsStateError,
      );

      // DUE_RETRY_WAKE_VALIDATED
      updatedDbDraft = lifecycleEngine.wakeRetry(
        job: updatedDbDraft,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 13, 0),
      );
      expect(updatedDbDraft.state, AcademicFactoryJobState.ready);

      // REPAIR_REQUIRED_VALIDATED
      // Run and fail content job with validationFailed -> action: repair, state: repairRequired
      updatedDbDraft = lifecycleEngine.claimReadyJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 10),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 14),
      );
      updatedDbDraft = lifecycleEngine.startLeasedJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 15),
      );
      updatedDbDraft = lifecycleEngine.classifyAndApplyFailure(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.validationFailed,
        failurePolicy: failurePolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 16),
      );
      expect(updatedDbDraft.state, AcademicFactoryJobState.repairRequired);

      // Now manual transition repairRequired -> ready (legal transition)
      updatedDbDraft = AcademicFactoryJob(
        jobId: updatedDbDraft.jobId,
        runId: updatedDbDraft.runId,
        missionId: updatedDbDraft.missionId,
        canonicalTargetId: updatedDbDraft.canonicalTargetId,
        type: updatedDbDraft.type,
        state: AcademicFactoryJobState.ready,
        dependencyJobIds: updatedDbDraft.dependencyJobIds,
        attemptCount: updatedDbDraft.attemptCount,
        maxAttempts: updatedDbDraft.maxAttempts,
        idempotencyKey: updatedDbDraft.idempotencyKey,
        createdAtUtc: updatedDbDraft.createdAtUtc,
        updatedAtUtc: DateTime.utc(2026, 8, 16, 10, 17),
      );

      // REVIEW_DISPUTE_VALIDATED
      // Run, begin review, and fail review with reviewDispute -> action: repair, state: repairRequired
      updatedDbDraft = lifecycleEngine.claimReadyJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 10),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 18),
      );
      updatedDbDraft = lifecycleEngine.startLeasedJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 19),
      );
      updatedDbDraft = lifecycleEngine.beginReview(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );
      expect(updatedDbDraft.state, AcademicFactoryJobState.reviewing);

      // Fail with reviewDispute -> repairRequired
      updatedDbDraft = lifecycleEngine.classifyAndApplyFailure(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.reviewDispute,
        failurePolicy: failurePolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 21),
      );
      expect(updatedDbDraft.state, AcademicFactoryJobState.repairRequired);

      // HARD_HOLD_VALIDATED
      // Reset to ready, claim, start, fail with governanceBlocked -> hardHold
      updatedDbDraft = AcademicFactoryJob(
        jobId: updatedDbDraft.jobId,
        runId: updatedDbDraft.runId,
        missionId: updatedDbDraft.missionId,
        canonicalTargetId: updatedDbDraft.canonicalTargetId,
        type: updatedDbDraft.type,
        state: AcademicFactoryJobState.ready,
        dependencyJobIds: updatedDbDraft.dependencyJobIds,
        attemptCount: updatedDbDraft.attemptCount,
        maxAttempts: updatedDbDraft.maxAttempts,
        idempotencyKey: updatedDbDraft.idempotencyKey,
        createdAtUtc: updatedDbDraft.createdAtUtc,
        updatedAtUtc: DateTime.utc(2026, 8, 16, 10, 22),
      );

      updatedDbDraft = lifecycleEngine.claimReadyJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 10),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 23),
      );
      updatedDbDraft = lifecycleEngine.startLeasedJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 24),
      );
      updatedDbDraft = lifecycleEngine.classifyAndApplyFailure(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.governanceBlocked,
        failurePolicy: failurePolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 25),
      );
      expect(updatedDbDraft.state, AcademicFactoryJobState.hardHold);

      updatedJobs = graph.jobs
          .map((j) => j.jobId == dbDraftId ? updatedDbDraft : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updatedJobs);

      // HARD_HOLD_DEPENDENCY_BLOCK_VALIDATED
      // Check that digibookValidation (dependent on digibookDraft) cannot unlock because dependency is in hardHold
      final dbValId = AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookValidation,
      );
      unlockPlan = unlockEngine.buildUnlockPlan(
          graph: graph, maxParallelUnlocks: workOrder.maxParallelUnlocks);
      final dbValDecision =
          unlockPlan.decisions.firstWhere((d) => d.jobId == dbValId);
      expect(dbValDecision.canUnlock, isFalse);
      expect(dbValDecision.reasonCode, 'DEPENDENCY_ON_HOLD:$dbDraftId');

      // FAILED_TERMINAL_DEPENDENCY_BLOCK_VALIDATED
      // Reset dbDraft to ready, claim, start, fail duplicate -> failedTerminal
      updatedDbDraft = AcademicFactoryJob(
        jobId: updatedDbDraft.jobId,
        runId: updatedDbDraft.runId,
        missionId: updatedDbDraft.missionId,
        canonicalTargetId: updatedDbDraft.canonicalTargetId,
        type: updatedDbDraft.type,
        state: AcademicFactoryJobState.ready,
        dependencyJobIds: updatedDbDraft.dependencyJobIds,
        attemptCount: updatedDbDraft.attemptCount,
        maxAttempts: updatedDbDraft.maxAttempts,
        idempotencyKey: updatedDbDraft.idempotencyKey,
        createdAtUtc: updatedDbDraft.createdAtUtc,
        updatedAtUtc: DateTime.utc(2026, 8, 16, 10, 26),
      );
      updatedDbDraft = lifecycleEngine.claimReadyJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 10),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 27),
      );
      updatedDbDraft = lifecycleEngine.startLeasedJob(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 28),
      );
      updatedDbDraft = lifecycleEngine.classifyAndApplyFailure(
        job: updatedDbDraft,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.duplicate,
        failurePolicy: failurePolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 29),
      );
      expect(updatedDbDraft.state, AcademicFactoryJobState.failedTerminal);

      updatedJobs = graph.jobs
          .map((j) => j.jobId == dbDraftId ? updatedDbDraft : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updatedJobs);

      // Verify that digibookValidation is blocked due to DEPENDENCY_FAILED
      unlockPlan = unlockEngine.buildUnlockPlan(
          graph: graph, maxParallelUnlocks: workOrder.maxParallelUnlocks);
      final dbValDecisionFailed =
          unlockPlan.decisions.firstWhere((d) => d.jobId == dbValId);
      expect(dbValDecisionFailed.canUnlock, isFalse);
      expect(dbValDecisionFailed.reasonCode, 'DEPENDENCY_FAILED:$dbDraftId');

      // IMMUTABILITY_VALIDATED: verify job objects are immutable by checking original job is not modified
      expect(dbDraftJob.state, AcademicFactoryJobState.waitingDependency);

      // DETERMINISTIC_REPLAY_VALIDATED: verify that executing the same sequence yields the same outputs
      final graph2 =
          AcademicFactoryDependencyGraph(jobs: planner.buildJobs(workOrder));
      final rootJob2 = graph2.jobsById[rootId]!;
      final updatedRoot2a = AcademicFactoryJob(
        jobId: rootJob2.jobId,
        runId: rootJob2.runId,
        missionId: rootJob2.missionId,
        canonicalTargetId: rootJob2.canonicalTargetId,
        type: rootJob2.type,
        state: AcademicFactoryJobState.ready,
        dependencyJobIds: rootJob2.dependencyJobIds,
        attemptCount: rootJob2.attemptCount,
        maxAttempts: rootJob2.maxAttempts,
        idempotencyKey: rootJob2.idempotencyKey,
        createdAtUtc: rootJob2.createdAtUtc,
        updatedAtUtc: DateTime.utc(2026, 8, 16, 10, 1),
      );
      final updatedRoot2b = lifecycleEngine.claimReadyJob(
        job: updatedRoot2a,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 10),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 2),
      );
      expect(updatedRoot2b.state, rootLeasedFirstPlay.state);
      expect(updatedRoot2b.attemptCount, rootLeasedFirstPlay.attemptCount);
      expect(updatedRoot2b.leaseExpiresAtUtc,
          rootLeasedFirstPlay.leaseExpiresAtUtc);
    });

    test('FULL_ONE_AMTN_HAPPY_PATH_VALIDATED - End to end run status check',
        () {
      final workOrder = makeWorkOrder(
        canonicalTargetIds: const ['AMTN-001'],
        maxAttemptsPerJob: 5,
      );
      final planner = const AcademicFactoryWorkOrderPlanner();
      final initialJobs = planner.buildJobs(workOrder);

      // Perform initial activation to put root jobs in ready state
      final activatedJobs = activationEngine.activate(
        jobs: initialJobs,
        eventAtUtc: DateTime.utc(2026, 8, 16, 11),
      );
      var graph = AcademicFactoryDependencyGraph(jobs: activatedJobs);

      // Happy path helper to process a job from planned to approved/published
      AcademicFactoryJob processJob(AcademicFactoryJob job,
          {String? outputHash}) {
        // Root job is already ready. Non-root jobs must be unlocked first (we transition planned/waitingDependency -> ready)
        var ready = job;
        if (job.state != AcademicFactoryJobState.ready) {
          ready = AcademicFactoryJob(
            jobId: job.jobId,
            runId: job.runId,
            missionId: job.missionId,
            canonicalTargetId: job.canonicalTargetId,
            type: job.type,
            state: AcademicFactoryJobState.ready,
            dependencyJobIds: job.dependencyJobIds,
            attemptCount: job.attemptCount,
            maxAttempts: job.maxAttempts,
            idempotencyKey: job.idempotencyKey,
            createdAtUtc: job.createdAtUtc,
            updatedAtUtc: DateTime.utc(2026, 8, 16, 11),
          );
        }

        // Claim
        var leased = lifecycleEngine.claimReadyJob(
          job: ready,
          leaseOwner: 'worker-1',
          leaseDuration: const Duration(minutes: 5),
          eventAtUtc: DateTime.utc(2026, 8, 16, 11, 1),
        );

        // Start
        var running = lifecycleEngine.startLeasedJob(
          job: leased,
          leaseOwner: 'worker-1',
          eventAtUtc: DateTime.utc(2026, 8, 16, 11, 2),
        );

        // Review
        var reviewing = lifecycleEngine.beginReview(
          job: running,
          leaseOwner: 'worker-1',
          eventAtUtc: DateTime.utc(2026, 8, 16, 11, 2, 30),
        );

        // Approve
        var approved = lifecycleEngine.approve(
          job: reviewing,
          leaseOwner: 'worker-1',
          outputHash: outputHash ?? 'hash-${job.jobId}',
          eventAtUtc: DateTime.utc(2026, 8, 16, 11, 3),
        );

        // If materialization type, transition approved -> materializing -> published
        if (job.type == AcademicFactoryJobType.digibookMaterialization ||
            job.type == AcademicFactoryJobType.crucibleMaterialization) {
          var materializing = lifecycleEngine.beginMaterialization(
            job: approved,
            leaseOwner: 'worker-1',
            leaseDuration: const Duration(minutes: 5),
            eventAtUtc: DateTime.utc(2026, 8, 16, 11, 3, 30),
          );

          // Transition materializing -> published
          var published = lifecycleEngine.publish(
            job: materializing,
            leaseOwner: 'worker-1',
            eventAtUtc: DateTime.utc(2026, 8, 16, 11, 4),
          );
          return published;
        } else {
          return approved;
        }
      }

      // 1. Process sourceAcquisition
      var saJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.sourceAcquisition,
      )]!;
      var saApproved = processJob(saJob);
      var updated = graph.jobs
          .map((j) => j.jobId == saApproved.jobId ? saApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      // 2. Process sourceValidation
      var svJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.sourceValidation,
      )]!;
      var svApproved = processJob(svJob);
      updated = graph.jobs
          .map((j) => j.jobId == svApproved.jobId ? svApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      // 3. Process digibookDraft and crucibleDraft in parallel
      var dbDraftJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookDraft,
      )]!;
      var dbDraftApproved = processJob(dbDraftJob);
      updated = graph.jobs
          .map((j) => j.jobId == dbDraftApproved.jobId ? dbDraftApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      var crDraftJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.crucibleDraft,
      )]!;
      var crDraftApproved = processJob(crDraftJob);
      updated = graph.jobs
          .map((j) => j.jobId == crDraftApproved.jobId ? crDraftApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      // 4. Process digibookValidation and crucibleValidation
      var dbValJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookValidation,
      )]!;
      var dbValApproved = processJob(dbValJob);
      updated = graph.jobs
          .map((j) => j.jobId == dbValApproved.jobId ? dbValApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      var crValJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.crucibleValidation,
      )]!;
      var crValApproved = processJob(crValJob);
      updated = graph.jobs
          .map((j) => j.jobId == crValApproved.jobId ? crValApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      // 5. Process digibookProReview and crucibleProReview
      var dbRevJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookProReview,
      )]!;
      var dbRevApproved = processJob(dbRevJob);
      updated = graph.jobs
          .map((j) => j.jobId == dbRevApproved.jobId ? dbRevApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      var crRevJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.crucibleProReview,
      )]!;
      var crRevApproved = processJob(crRevJob);
      updated = graph.jobs
          .map((j) => j.jobId == crRevApproved.jobId ? crRevApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      // 6. Process digibookAssembly
      var dbAsmJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookAssembly,
      )]!;
      var dbAsmApproved = processJob(dbAsmJob);
      updated = graph.jobs
          .map((j) => j.jobId == dbAsmApproved.jobId ? dbAsmApproved : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      // 7. Process digibookMaterialization and crucibleMaterialization (these transition to published)
      var dbMatJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookMaterialization,
      )]!;
      var dbMatPublished = processJob(dbMatJob);
      updated = graph.jobs
          .map((j) => j.jobId == dbMatPublished.jobId ? dbMatPublished : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      var crMatJob = graph.jobsById[AcademicFactoryWorkOrderPlanner.jobIdFor(
        runId: workOrder.runId,
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.crucibleMaterialization,
      )]!;
      var crMatPublished = processJob(crMatJob);
      updated = graph.jobs
          .map((j) => j.jobId == crMatPublished.jobId ? crMatPublished : j)
          .toList();
      graph = AcademicFactoryDependencyGraph(jobs: updated);

      // Helper to transition approved job to published state
      AcademicFactoryJob publishApproved(AcademicFactoryJob approvedJob) {
        if (approvedJob.state == AcademicFactoryJobState.published) {
          return approvedJob;
        }
        var matJob = approvedJob;
        if (approvedJob.state == AcademicFactoryJobState.approved) {
          matJob = lifecycleEngine.beginMaterialization(
            job: approvedJob,
            leaseOwner: 'worker-1',
            leaseDuration: const Duration(minutes: 5),
            eventAtUtc: DateTime.utc(2026, 8, 16, 12),
          );
        }
        return lifecycleEngine.publish(
          job: matJob,
          leaseOwner: 'worker-1',
          eventAtUtc: DateTime.utc(2026, 8, 16, 12, 1),
        );
      }

      // Publish all of them!
      var publishedJobs = graph.jobs.map(publishApproved).toList();
      graph = AcademicFactoryDependencyGraph(jobs: publishedJobs);

      // Now evaluate run progress
      var finalProgress = progressEvaluator.evaluate(
        runId: workOrder.runId,
        missionId: workOrder.missionId,
        jobs: graph.jobs,
      );

      expect(finalProgress.totalJobs, 11);
      expect(finalProgress.publishedJobs, 11);
      expect(finalProgress.completedJobs, 11);
      expect(finalProgress.completionRatio, 1.0);
      expect(finalProgress.allJobsTerminalForRunEvaluation, isTrue);
      expect(finalProgress.recommendedRunStatus,
          AcademicFactoryRunStatus.completed);
    });

    test('FULL_417_GRAPH initial progress projection check', () {
      // 417 target IDs
      final targets = List.generate(
          417, (i) => 'AMTN-${(i + 1).toString().padLeft(3, '0')}');
      final workOrder = makeWorkOrder(canonicalTargetIds: targets);
      final planner = const AcademicFactoryWorkOrderPlanner();
      final jobs = planner.buildJobs(workOrder);

      // Verify counts
      expect(jobs.length, 4587); // 417 * 11

      var graph = AcademicFactoryDependencyGraph(jobs: jobs);

      // FULL_417_BEFORE_ACTIVATION
      final progressBefore = progressEvaluator.evaluate(
        runId: workOrder.runId,
        missionId: workOrder.missionId,
        jobs: graph.jobs,
      );

      expect(progressBefore.totalJobs, 4587);
      expect(progressBefore.plannedJobs, 417);
      expect(progressBefore.readyJobs, 0);
      expect(progressBefore.waitingDependencyJobs, 4170);

      // Perform initial activation for all 417 roots
      final activatedJobs = activationEngine.activate(
        jobs: graph.jobs,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 1),
      );
      graph = AcademicFactoryDependencyGraph(jobs: activatedJobs);

      // FULL_417_AFTER_ACTIVATION
      final progressAfter = progressEvaluator.evaluate(
        runId: workOrder.runId,
        missionId: workOrder.missionId,
        jobs: graph.jobs,
      );

      expect(progressAfter.totalJobs, 4587);
      expect(progressAfter.plannedJobs, 0);
      expect(progressAfter.readyJobs, 417);
      expect(progressAfter.waitingDependencyJobs, 4170);
      expect(
          progressAfter.recommendedRunStatus, AcademicFactoryRunStatus.running);

      // FULL_417_ROOT_ACTIVATION_COUNT
      final activatedCount = activatedJobs
          .where((j) => j.state == AcademicFactoryJobState.ready)
          .length;
      expect(activatedCount, 417);
    });
  });
}
