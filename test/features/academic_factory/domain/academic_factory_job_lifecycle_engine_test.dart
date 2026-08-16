import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_failure_policy.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_retry_backoff_policy.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_transition_policy.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_job_lifecycle_engine.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_job.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_types.dart';

void main() {
  const transitionPolicy = AcademicFactoryTransitionPolicy();
  const failurePolicy = AcademicFactoryFailurePolicy();
  const backoffPolicy = AcademicFactoryRetryBackoffPolicy();
  const lifecycleEngine = AcademicFactoryJobLifecycleEngine();

  final created = DateTime.utc(2026, 8, 16, 10);
  final updated = DateTime.utc(2026, 8, 16, 10, 1);

  AcademicFactoryJob makeJob({
    AcademicFactoryJobType type = AcademicFactoryJobType.digibookDraft,
    AcademicFactoryJobState state = AcademicFactoryJobState.ready,
    int attemptCount = 0,
    int maxAttempts = 3,
    String? leaseOwner,
    DateTime? leaseExpiresAtUtc,
    DateTime? nextRetryAtUtc,
  }) {
    return AcademicFactoryJob(
      jobId: 'job-1',
      runId: 'run-1',
      missionId: 'jee_main_2026',
      canonicalTargetId: 'AMTN-001',
      type: type,
      state: state,
      dependencyJobIds: const [],
      attemptCount: attemptCount,
      maxAttempts: maxAttempts,
      idempotencyKey: 'key-1',
      outputHash: (state == AcademicFactoryJobState.approved ||
              state == AcademicFactoryJobState.materializing ||
              state == AcademicFactoryJobState.published)
          ? 'output-hash'
          : null,
      leaseOwner: leaseOwner ?? (state.requiresLease ? 'worker-1' : null),
      leaseExpiresAtUtc: leaseExpiresAtUtc ??
          (state.requiresLease ? DateTime.utc(2026, 8, 16, 11) : null),
      nextRetryAtUtc: nextRetryAtUtc ??
          (state == AcademicFactoryJobState.retryWait
              ? DateTime.utc(2026, 8, 16, 12)
              : null),
      failureClass: state == AcademicFactoryJobState.retryWait
          ? AcademicFactoryFailureClass.timeout
          : null,
      createdAtUtc: created,
      updatedAtUtc: updated,
    );
  }

  group('AcademicFactoryJobLifecycleEngine - Core', () {
    test('claimReadyJob increments attemptCount exactly once', () {
      final job = makeJob(attemptCount: 0);
      final leased = lifecycleEngine.claimReadyJob(
        job: job,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 30),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 2),
      );

      expect(leased.state, AcademicFactoryJobState.leased);
      expect(leased.attemptCount, 1);
      expect(leased.leaseOwner, 'worker-1');
      expect(leased.leaseExpiresAtUtc, DateTime.utc(2026, 8, 16, 10, 32));
      expect(leased.updatedAtUtc, DateTime.utc(2026, 8, 16, 10, 2));
    });

    test('attempt exhaustion prevents another claim', () {
      final job = makeJob(attemptCount: 3, maxAttempts: 3);
      expect(
        () => lifecycleEngine.claimReadyJob(
          job: job,
          leaseOwner: 'worker-1',
          leaseDuration: const Duration(minutes: 30),
          eventAtUtc: DateTime.utc(2026, 8, 16, 10, 2),
        ),
        throwsStateError,
      );
    });

    test('lease owner and expiry are explicit UTC', () {
      final job = makeJob();
      expect(
        () => lifecycleEngine.claimReadyJob(
          job: job,
          leaseOwner: 'worker-1',
          leaseDuration: const Duration(minutes: 30),
          eventAtUtc: DateTime.utc(2026, 8, 16, 10, 2).toLocal(), // Local time
        ),
        throwsFormatException,
      );
    });

    test('expired lease cannot enter RUNNING', () {
      final job = makeJob(
        state: AcademicFactoryJobState.leased,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 5),
      );

      expect(
        () => lifecycleEngine.startLeasedJob(
          job: job,
          leaseOwner: 'worker-1',
          eventAtUtc: DateTime.utc(2026, 8, 16, 10, 10), // Expired
        ),
        throwsStateError,
      );
    });

    test('active running lease can enter REVIEWING', () {
      final job = makeJob(
        state: AcademicFactoryJobState.running,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
      );

      final reviewed = lifecycleEngine.beginReview(
        job: job,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(reviewed.state, AcademicFactoryJobState.reviewing);
      expect(reviewed.leaseOwner, 'worker-1');
    });

    test('approved output requires outputHash, approval clears execution lease',
        () {
      final job = makeJob(
        state: AcademicFactoryJobState.reviewing,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
      );

      final approved = lifecycleEngine.approve(
        job: job,
        leaseOwner: 'worker-1',
        outputHash: 'approved-hash',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(approved.state, AcademicFactoryJobState.approved);
      expect(approved.outputHash, 'approved-hash');
      expect(approved.leaseOwner, null);
      expect(approved.leaseExpiresAtUtc, null);
    });

    test('materializing state preserves active lease', () {
      final job = makeJob(
        state: AcademicFactoryJobState.approved,
      );

      final materializing = lifecycleEngine.beginMaterialization(
        job: job,
        leaseOwner: 'worker-2',
        leaseDuration: const Duration(minutes: 20),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(materializing.state, AcademicFactoryJobState.materializing);
      expect(materializing.leaseOwner, 'worker-2');
      expect(
          materializing.leaseExpiresAtUtc, DateTime.utc(2026, 8, 16, 10, 40));
    });

    test('publishing clears lease and produces terminal PUBLISHED', () {
      final job = makeJob(
        state: AcademicFactoryJobState.materializing,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
      );

      final published = lifecycleEngine.publish(
        job: job,
        leaseOwner: 'worker-1',
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(published.state, AcademicFactoryJobState.published);
      expect(published.leaseOwner, null);
      expect(published.leaseExpiresAtUtc, null);
    });

    test('retry failure computes deterministic nextRetryAtUtc, clears lease',
        () {
      final job = makeJob(
        state: AcademicFactoryJobState.running,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
        attemptCount: 1,
      );

      final failed = lifecycleEngine.classifyAndApplyFailure(
        job: job,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.timeout,
        failurePolicy: failurePolicy,
        backoffPolicy: backoffPolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(failed.state, AcademicFactoryJobState.retryWait);
      expect(failed.nextRetryAtUtc,
          DateTime.utc(2026, 8, 16, 10, 20, 30)); // 30s backoff
      expect(failed.leaseOwner, null);
      expect(failed.leaseExpiresAtUtc, null);
    });

    test('repair failure produces repairRequired', () {
      final job = makeJob(
        state: AcademicFactoryJobState.running,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
      );

      final failed = lifecycleEngine.classifyAndApplyFailure(
        job: job,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.validationFailed,
        failurePolicy: failurePolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(failed.state, AcademicFactoryJobState.repairRequired);
      expect(failed.leaseOwner, null);
    });

    test('governance failure produces hardHold', () {
      final job = makeJob(
        state: AcademicFactoryJobState.running,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
      );

      final failed = lifecycleEngine.classifyAndApplyFailure(
        job: job,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.governanceBlocked,
        failurePolicy: failurePolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(failed.state, AcademicFactoryJobState.hardHold);
    });

    test('duplicate failure produces failedTerminal', () {
      final job = makeJob(
        state: AcademicFactoryJobState.running,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
      );

      final failed = lifecycleEngine.classifyAndApplyFailure(
        job: job,
        leaseOwner: 'worker-1',
        failureClass: AcademicFactoryFailureClass.duplicate,
        failurePolicy: failurePolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(failed.state, AcademicFactoryJobState.failedTerminal);
    });

    test('due retry wakes to READY, premature retry wake fails closed', () {
      final job = makeJob(
        state: AcademicFactoryJobState.retryWait,
        nextRetryAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      // Premature wake fails closed
      expect(
        () => lifecycleEngine.wakeRetry(
          job: job,
          eventAtUtc: DateTime.utc(2026, 8, 16, 10, 19),
        ),
        throwsStateError,
      );

      // Due retry wakes successfully, clears retry metadata
      final ready = lifecycleEngine.wakeRetry(
        job: job,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(ready.state, AcademicFactoryJobState.ready);
      expect(ready.nextRetryAtUtc, null);
      expect(ready.failureClass, null);
    });

    test('same owner can renew active lease, wrong worker renewal is blocked',
        () {
      final job = makeJob(
        state: AcademicFactoryJobState.running,
        leaseOwner: 'worker-1',
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
      );

      // Wrong worker blocked
      expect(
        () => lifecycleEngine.renewLease(
          job: job,
          leaseOwner: 'worker-2',
          leaseDuration: const Duration(minutes: 30),
          eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
        ),
        throwsStateError,
      );

      // Same owner renewal is valid
      final renewed = lifecycleEngine.renewLease(
        job: job,
        leaseOwner: 'worker-1',
        leaseDuration: const Duration(minutes: 30),
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20),
      );

      expect(renewed.leaseExpiresAtUtc, DateTime.utc(2026, 8, 16, 10, 50));
    });

    test('active lease cannot be falsely recovered', () {
      final job = makeJob(
        state: AcademicFactoryJobState.running,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
      );

      expect(
        () => lifecycleEngine.recoverExpiredLease(
          job: job,
          failurePolicy: failurePolicy,
          eventAtUtc: DateTime.utc(2026, 8, 16, 10, 20), // Active
        ),
        throwsStateError,
      );
    });

    test('expired lease becomes timeout failure and retries/hard-holds', () {
      // 1. Attempts remaining -> retryWait
      final job1 = makeJob(
        state: AcademicFactoryJobState.running,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
        attemptCount: 1,
        maxAttempts: 3,
      );

      final recovered1 = lifecycleEngine.recoverExpiredLease(
        job: job1,
        failurePolicy: failurePolicy,
        backoffPolicy: backoffPolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 31), // Expired
      );

      expect(recovered1.state, AcademicFactoryJobState.retryWait);
      expect(recovered1.failureClass, AcademicFactoryFailureClass.timeout);

      // 2. Attempts exhausted -> hardHold
      final job2 = makeJob(
        state: AcademicFactoryJobState.running,
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 30),
        attemptCount: 3,
        maxAttempts: 3,
      );

      final recovered2 = lifecycleEngine.recoverExpiredLease(
        job: job2,
        failurePolicy: failurePolicy,
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 31),
      );

      expect(recovered2.state, AcademicFactoryJobState.hardHold);
    });
  });

  group('cross-policy compatibility', () {
    test('every representative failure decision is legal from its state', () {
      final cases = <({
        AcademicFactoryJob job,
        AcademicFactoryFailureClass failure,
      })>[
        (
          job: makeJob(
            state: AcademicFactoryJobState.leased,
          ),
          failure: AcademicFactoryFailureClass.timeout,
        ),
        (
          job: makeJob(
            state: AcademicFactoryJobState.leased,
          ),
          failure: AcademicFactoryFailureClass.governanceBlocked,
        ),
        (
          job: makeJob(
            state: AcademicFactoryJobState.running,
          ),
          failure: AcademicFactoryFailureClass.academicError,
        ),
        (
          job: makeJob(
            type: AcademicFactoryJobType.digibookProReview,
            state: AcademicFactoryJobState.reviewing,
          ),
          failure: AcademicFactoryFailureClass.reviewDispute,
        ),
        (
          job: makeJob(
            type: AcademicFactoryJobType.digibookMaterialization,
            state: AcademicFactoryJobState.materializing,
          ),
          failure: AcademicFactoryFailureClass.materializationFailed,
        ),
        (
          job: makeJob(
            type: AcademicFactoryJobType.digibookMaterialization,
            state: AcademicFactoryJobState.materializing,
          ),
          failure: AcademicFactoryFailureClass.governanceBlocked,
        ),
      ];

      for (final item in cases) {
        final decision = failurePolicy.decide(
          job: item.job,
          failureClass: item.failure,
        );

        expect(
          transitionPolicy.canTransition(
            from: item.job.state,
            to: decision.nextState,
          ),
          isTrue,
          reason: '${item.job.state.wireName} -> '
              '${decision.nextState.wireName}',
        );
      }
    });
  });
}
