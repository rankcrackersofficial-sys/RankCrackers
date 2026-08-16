/// Pure-domain lifecycle authority for one AcademicFactoryJob.
///
/// CODE: AAF-003B
library;

import '../models/academic_factory_types.dart';
import '../models/academic_factory_job.dart';
import '../models/academic_factory_failure_decision.dart';
import 'academic_factory_transition_policy.dart';
import 'academic_factory_failure_policy.dart';
import 'academic_factory_retry_backoff_policy.dart';

final class AcademicFactoryJobLifecycleEngine {
  const AcademicFactoryJobLifecycleEngine();

  static const _transitionPolicy = AcademicFactoryTransitionPolicy();

  AcademicFactoryJob claimReadyJob({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required Duration leaseDuration,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _requirePositiveDuration(leaseDuration, 'leaseDuration');
    _transitionPolicy.assertTransition(
        from: job.state, to: AcademicFactoryJobState.leased);

    if (job.attemptCount >= job.maxAttempts) {
      throw StateError(
          'Job ${job.jobId} attempt count has reached max attempts.');
    }

    if (leaseOwner.trim().isEmpty) {
      throw ArgumentError('leaseOwner must not be empty.');
    }

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: AcademicFactoryJobState.leased,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount + 1,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      leaseOwner: leaseOwner,
      leaseExpiresAtUtc: eventAtUtc.add(leaseDuration),
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob renewLease({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required Duration leaseDuration,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _requirePositiveDuration(leaseDuration, 'leaseDuration');
    _requireActiveLease(
        job: job, leaseOwner: leaseOwner, eventAtUtc: eventAtUtc);

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: job.state,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      leaseOwner: leaseOwner,
      leaseExpiresAtUtc: eventAtUtc.add(leaseDuration),
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob startLeasedJob({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _requireActiveLease(
        job: job, leaseOwner: leaseOwner, eventAtUtc: eventAtUtc);
    _transitionPolicy.assertTransition(
        from: job.state, to: AcademicFactoryJobState.running);

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: AcademicFactoryJobState.running,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      leaseOwner: job.leaseOwner,
      leaseExpiresAtUtc: job.leaseExpiresAtUtc,
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob beginReview({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _requireActiveLease(
        job: job, leaseOwner: leaseOwner, eventAtUtc: eventAtUtc);
    _transitionPolicy.assertTransition(
        from: job.state, to: AcademicFactoryJobState.reviewing);

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: AcademicFactoryJobState.reviewing,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      leaseOwner: job.leaseOwner,
      leaseExpiresAtUtc: job.leaseExpiresAtUtc,
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob approve({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required String outputHash,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _requireActiveLease(
        job: job, leaseOwner: leaseOwner, eventAtUtc: eventAtUtc);
    _transitionPolicy.assertTransition(
        from: job.state, to: AcademicFactoryJobState.approved);

    if (outputHash.trim().isEmpty) {
      throw ArgumentError('outputHash must not be empty.');
    }

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: AcademicFactoryJobState.approved,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: outputHash,
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob beginMaterialization({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required Duration leaseDuration,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _requirePositiveDuration(leaseDuration, 'leaseDuration');
    _transitionPolicy.assertTransition(
        from: job.state, to: AcademicFactoryJobState.materializing);

    if (leaseOwner.trim().isEmpty) {
      throw ArgumentError('leaseOwner must not be empty.');
    }

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: AcademicFactoryJobState.materializing,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      leaseOwner: leaseOwner,
      leaseExpiresAtUtc: eventAtUtc.add(leaseDuration),
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob publish({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _requireActiveLease(
        job: job, leaseOwner: leaseOwner, eventAtUtc: eventAtUtc);
    _transitionPolicy.assertTransition(
        from: job.state, to: AcademicFactoryJobState.published);

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: AcademicFactoryJobState.published,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob applyFailure({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required AcademicFactoryFailureDecision decision,
    AcademicFactoryRetryBackoffPolicy? backoffPolicy,
    required DateTime eventAtUtc,
    String? failureMessage,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _requireActiveLease(
        job: job, leaseOwner: leaseOwner, eventAtUtc: eventAtUtc);
    _transitionPolicy.assertTransition(from: job.state, to: decision.nextState);

    DateTime? nextRetryAtUtc;
    if (decision.action == AcademicFactoryFailureAction.retry) {
      if (backoffPolicy == null) {
        throw ArgumentError('backoffPolicy is required for retry actions.');
      }
      nextRetryAtUtc = backoffPolicy.nextRetryAtUtc(
        failureClass: decision.failureClass,
        attemptCount: job.attemptCount,
        failedAtUtc: eventAtUtc,
      );
    }

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: decision.nextState,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      failureClass: decision.failureClass,
      failureMessage: failureMessage,
      nextRetryAtUtc: nextRetryAtUtc,
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob classifyAndApplyFailure({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required AcademicFactoryFailureClass failureClass,
    required AcademicFactoryFailurePolicy failurePolicy,
    AcademicFactoryRetryBackoffPolicy? backoffPolicy,
    required DateTime eventAtUtc,
    String? failureMessage,
  }) {
    final decision = failurePolicy.decide(job: job, failureClass: failureClass);
    return applyFailure(
      job: job,
      leaseOwner: leaseOwner,
      decision: decision,
      backoffPolicy: backoffPolicy,
      eventAtUtc: eventAtUtc,
      failureMessage: failureMessage,
    );
  }

  AcademicFactoryJob wakeRetry({
    required AcademicFactoryJob job,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');
    _transitionPolicy.assertTransition(
        from: job.state, to: AcademicFactoryJobState.ready);

    final retryTime = job.nextRetryAtUtc;
    if (retryTime == null) {
      throw StateError('Job ${job.jobId} is not in a retry wait state.');
    }
    if (eventAtUtc.isBefore(retryTime)) {
      throw StateError('Cannot wake job before nextRetryAtUtc.');
    }

    return AcademicFactoryJob(
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
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  AcademicFactoryJob recoverExpiredLease({
    required AcademicFactoryJob job,
    required AcademicFactoryFailurePolicy failurePolicy,
    AcademicFactoryRetryBackoffPolicy? backoffPolicy,
    required DateTime eventAtUtc,
  }) {
    _requireUtcAndMonotonic(
        job: job, eventAtUtc: eventAtUtc, field: 'eventAtUtc');

    if (!job.state.requiresLease) {
      throw StateError(
          'Job ${job.jobId} state ${job.state.wireName} is not leased.');
    }

    final expiry = job.leaseExpiresAtUtc;
    if (expiry == null || !eventAtUtc.isAfter(expiry)) {
      throw StateError('Lease for job ${job.jobId} is not expired.');
    }

    final decision = failurePolicy.decide(
        job: job, failureClass: AcademicFactoryFailureClass.timeout);
    _transitionPolicy.assertTransition(from: job.state, to: decision.nextState);

    DateTime? nextRetryAtUtc;
    if (decision.action == AcademicFactoryFailureAction.retry) {
      if (backoffPolicy == null) {
        throw ArgumentError('backoffPolicy is required for retry actions.');
      }
      nextRetryAtUtc = backoffPolicy.nextRetryAtUtc(
        failureClass: AcademicFactoryFailureClass.timeout,
        attemptCount: job.attemptCount,
        failedAtUtc: eventAtUtc,
      );
    }

    return AcademicFactoryJob(
      jobId: job.jobId,
      runId: job.runId,
      missionId: job.missionId,
      canonicalTargetId: job.canonicalTargetId,
      type: job.type,
      state: decision.nextState,
      dependencyJobIds: job.dependencyJobIds,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      inputHash: job.inputHash,
      outputHash: job.outputHash,
      failureClass: AcademicFactoryFailureClass.timeout,
      failureMessage: 'Lease expired.',
      nextRetryAtUtc: nextRetryAtUtc,
      createdAtUtc: job.createdAtUtc,
      updatedAtUtc: eventAtUtc,
      schemaVersion: job.schemaVersion,
    );
  }

  void _requireActiveLease({
    required AcademicFactoryJob job,
    required String leaseOwner,
    required DateTime eventAtUtc,
  }) {
    if (job.leaseOwner != leaseOwner) {
      throw StateError(
        'Job ${job.jobId} is leased by ${job.leaseOwner}, not $leaseOwner.',
      );
    }
    final expiry = job.leaseExpiresAtUtc;
    if (expiry == null || !eventAtUtc.isBefore(expiry)) {
      throw StateError(
        'Job ${job.jobId} does not have an active lease.',
      );
    }
  }

  void _requireUtcAndMonotonic({
    required AcademicFactoryJob job,
    required DateTime eventAtUtc,
    required String field,
  }) {
    if (!eventAtUtc.isUtc) {
      throw FormatException(
        '$field must be UTC.',
      );
    }

    if (eventAtUtc.isBefore(job.updatedAtUtc)) {
      throw FormatException(
        '$field cannot precede the job updatedAtUtc.',
      );
    }
  }

  void _requirePositiveDuration(
    Duration duration,
    String field,
  ) {
    if (duration <= Duration.zero) {
      throw ArgumentError.value(
        duration,
        field,
        '$field must be positive.',
      );
    }
  }
}
