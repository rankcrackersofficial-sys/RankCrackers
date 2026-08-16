import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_failure_policy.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_retry_backoff_policy.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_failure_decision.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_job.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_types.dart';

void main() {
  final created = DateTime.utc(2026, 8, 16, 10);
  final updated = DateTime.utc(2026, 8, 16, 10, 1);
  const failurePolicy = AcademicFactoryFailurePolicy();
  const backoffPolicy = AcademicFactoryRetryBackoffPolicy();

  AcademicFactoryJob createTestJob({
    required AcademicFactoryJobType type,
    required AcademicFactoryJobState state,
    int attemptCount = 0,
    int maxAttempts = 3,
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
      leaseOwner: state.requiresLease ? 'worker-1' : null,
      leaseExpiresAtUtc:
          state.requiresLease ? DateTime.utc(2026, 8, 16, 11) : null,
      createdAtUtc: created,
      updatedAtUtc: updated,
    );
  }

  group('AcademicFactoryFailurePolicy', () {
    test('non-processing state fails closed', () {
      final job = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.ready,
      );
      expect(
        () => failurePolicy.decide(
          job: job,
          failureClass: AcademicFactoryFailureClass.timeout,
        ),
        throwsStateError,
      );
    });

    test('transient provider behavior', () {
      // Attempts remain
      final job1 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec1 = failurePolicy.decide(
        job: job1,
        failureClass: AcademicFactoryFailureClass.transientProvider,
      );
      expect(dec1.action, AcademicFactoryFailureAction.retry);
      expect(dec1.nextState, AcademicFactoryJobState.retryWait);

      // Attempts exhausted
      final job2 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 3,
        maxAttempts: 3,
      );
      final dec2 = failurePolicy.decide(
        job: job2,
        failureClass: AcademicFactoryFailureClass.transientProvider,
      );
      expect(dec2.action, AcademicFactoryFailureAction.hardHold);
      expect(dec2.nextState, AcademicFactoryJobState.hardHold);
    });

    test('rate limited behavior', () {
      final job1 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec1 = failurePolicy.decide(
        job: job1,
        failureClass: AcademicFactoryFailureClass.rateLimited,
      );
      expect(dec1.action, AcademicFactoryFailureAction.retry);

      final job2 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 3,
        maxAttempts: 3,
      );
      final dec2 = failurePolicy.decide(
        job: job2,
        failureClass: AcademicFactoryFailureClass.rateLimited,
      );
      expect(dec2.action, AcademicFactoryFailureAction.hardHold);
    });

    test('timeout behavior', () {
      final job1 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec1 = failurePolicy.decide(
        job: job1,
        failureClass: AcademicFactoryFailureClass.timeout,
      );
      expect(dec1.action, AcademicFactoryFailureAction.retry);

      final job2 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 3,
        maxAttempts: 3,
      );
      final dec2 = failurePolicy.decide(
        job: job2,
        failureClass: AcademicFactoryFailureClass.timeout,
      );
      expect(dec2.action, AcademicFactoryFailureAction.hardHold);
    });

    test('source missing behavior', () {
      // Source job, attempts remain
      final job1 = createTestJob(
        type: AcademicFactoryJobType.sourceValidation,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec1 = failurePolicy.decide(
        job: job1,
        failureClass: AcademicFactoryFailureClass.sourceMissing,
      );
      expect(dec1.action, AcademicFactoryFailureAction.retry);

      // Source job, attempts exhausted
      final job2 = createTestJob(
        type: AcademicFactoryJobType.sourceValidation,
        state: AcademicFactoryJobState.running,
        attemptCount: 3,
        maxAttempts: 3,
      );
      final dec2 = failurePolicy.decide(
        job: job2,
        failureClass: AcademicFactoryFailureClass.sourceMissing,
      );
      expect(dec2.action, AcademicFactoryFailureAction.hardHold);

      // Non-source job, attempts remain
      final job3 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec3 = failurePolicy.decide(
        job: job3,
        failureClass: AcademicFactoryFailureClass.sourceMissing,
      );
      expect(dec3.action, AcademicFactoryFailureAction.hardHold);
    });

    test('source insufficient and mismatch behavior', () {
      final job = createTestJob(
        type: AcademicFactoryJobType.sourceValidation,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec1 = failurePolicy.decide(
        job: job,
        failureClass: AcademicFactoryFailureClass.sourceInsufficient,
      );
      expect(dec1.action, AcademicFactoryFailureAction.hardHold);

      final dec2 = failurePolicy.decide(
        job: job,
        failureClass: AcademicFactoryFailureClass.sourceMismatch,
      );
      expect(dec2.action, AcademicFactoryFailureAction.hardHold);
    });

    test('validation failed, dispute, academic error, format error behavior',
        () {
      // Content job, attempts remain -> repair
      final job1 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec1 = failurePolicy.decide(
        job: job1,
        failureClass: AcademicFactoryFailureClass.validationFailed,
      );
      expect(dec1.action, AcademicFactoryFailureAction.repair);
      expect(dec1.nextState, AcademicFactoryJobState.repairRequired);

      // Content job, attempts exhausted -> hardHold
      final job2 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 3,
        maxAttempts: 3,
      );
      final dec2 = failurePolicy.decide(
        job: job2,
        failureClass: AcademicFactoryFailureClass.validationFailed,
      );
      expect(dec2.action, AcademicFactoryFailureAction.hardHold);

      // Non-content job -> hardHold immediately
      final job3 = createTestJob(
        type: AcademicFactoryJobType.digibookMaterialization,
        state: AcademicFactoryJobState.materializing,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec3 = failurePolicy.decide(
        job: job3,
        failureClass: AcademicFactoryFailureClass.validationFailed,
      );
      expect(dec3.action, AcademicFactoryFailureAction.hardHold);

      // Content job in leased state -> hardHold immediately (repaired transition gap)
      final job4 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.leased,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec4 = failurePolicy.decide(
        job: job4,
        failureClass: AcademicFactoryFailureClass.validationFailed,
      );
      expect(dec4.action, AcademicFactoryFailureAction.hardHold);

      // Content job in materializing state -> hardHold immediately (repaired transition gap)
      final job5 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.materializing,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec5 = failurePolicy.decide(
        job: job5,
        failureClass: AcademicFactoryFailureClass.validationFailed,
      );
      expect(dec5.action, AcademicFactoryFailureAction.hardHold);
    });

    test('duplicate behavior', () {
      final job = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec = failurePolicy.decide(
        job: job,
        failureClass: AcademicFactoryFailureClass.duplicate,
      );
      expect(dec.action, AcademicFactoryFailureAction.failTerminal);
      expect(dec.nextState, AcademicFactoryJobState.failedTerminal);
    });

    test('materialization failed behavior', () {
      // Materialization job, attempts remain -> retry
      final job1 = createTestJob(
        type: AcademicFactoryJobType.digibookMaterialization,
        state: AcademicFactoryJobState.materializing,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec1 = failurePolicy.decide(
        job: job1,
        failureClass: AcademicFactoryFailureClass.materializationFailed,
      );
      expect(dec1.action, AcademicFactoryFailureAction.retry);

      // Materialization job, attempts exhausted -> hardHold
      final job2 = createTestJob(
        type: AcademicFactoryJobType.digibookMaterialization,
        state: AcademicFactoryJobState.materializing,
        attemptCount: 3,
        maxAttempts: 3,
      );
      final dec2 = failurePolicy.decide(
        job: job2,
        failureClass: AcademicFactoryFailureClass.materializationFailed,
      );
      expect(dec2.action, AcademicFactoryFailureAction.hardHold);

      // Non-materialization job -> hardHold immediately
      final job3 = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec3 = failurePolicy.decide(
        job: job3,
        failureClass: AcademicFactoryFailureClass.materializationFailed,
      );
      expect(dec3.action, AcademicFactoryFailureAction.hardHold);
    });

    test('governance blocked and unknown behavior', () {
      final job = createTestJob(
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.running,
        attemptCount: 1,
        maxAttempts: 3,
      );
      final dec1 = failurePolicy.decide(
        job: job,
        failureClass: AcademicFactoryFailureClass.governanceBlocked,
      );
      expect(dec1.action, AcademicFactoryFailureAction.hardHold);

      final dec2 = failurePolicy.decide(
        job: job,
        failureClass: AcademicFactoryFailureClass.unknown,
      );
      expect(dec2.action, AcademicFactoryFailureAction.hardHold);
    });
  });

  group('AcademicFactoryRetryBackoffPolicy', () {
    test('supports correct failure classes', () {
      expect(
          backoffPolicy.supports(AcademicFactoryFailureClass.transientProvider),
          isTrue);
      expect(backoffPolicy.supports(AcademicFactoryFailureClass.rateLimited),
          isTrue);
      expect(
          backoffPolicy.supports(AcademicFactoryFailureClass.timeout), isTrue);
      expect(backoffPolicy.supports(AcademicFactoryFailureClass.sourceMissing),
          isTrue);
      expect(
          backoffPolicy
              .supports(AcademicFactoryFailureClass.materializationFailed),
          isTrue);
      expect(backoffPolicy.supports(AcademicFactoryFailureClass.academicError),
          isFalse);
    });

    test('transient provider has 30s base and caps at 15m', () {
      expect(
        backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.transientProvider,
          attemptCount: 1,
        ),
        const Duration(seconds: 30),
      );

      expect(
        backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.transientProvider,
          attemptCount: 2,
        ),
        const Duration(minutes: 1),
      );

      expect(
        backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.transientProvider,
          attemptCount: 3,
        ),
        const Duration(minutes: 2),
      );
    });

    test('rate limit has one-minute base', () {
      expect(
        backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.rateLimited,
          attemptCount: 1,
        ),
        const Duration(minutes: 1),
      );
    });

    test('source missing has two-minute base', () {
      expect(
        backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.sourceMissing,
          attemptCount: 1,
        ),
        const Duration(minutes: 2),
      );
    });

    test('backoff is capped', () {
      expect(
        backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.timeout,
          attemptCount: 20,
        ),
        const Duration(minutes: 10),
      );

      expect(
        backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.sourceMissing,
          attemptCount: 20,
        ),
        const Duration(hours: 1),
      );
    });

    test('unsupported failure class rejects retry calculation', () {
      expect(
        () => backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.reviewDispute,
          attemptCount: 1,
        ),
        throwsArgumentError,
      );
    });

    test('attemptCount must be positive', () {
      expect(
        () => backoffPolicy.delayFor(
          failureClass: AcademicFactoryFailureClass.timeout,
          attemptCount: 0,
        ),
        throwsArgumentError,
      );
    });

    test('nextRetryAtUtc is deterministic', () {
      final failedAt = DateTime.utc(2026, 8, 16, 12);

      expect(
        backoffPolicy.nextRetryAtUtc(
          failureClass: AcademicFactoryFailureClass.rateLimited,
          attemptCount: 2,
          failedAtUtc: failedAt,
        ),
        failedAt.add(const Duration(minutes: 2)),
      );
    });

    test('non-UTC failedAtUtc fails closed', () {
      final failedAt = DateTime(2026, 8, 16, 12); // local time
      expect(
        () => backoffPolicy.nextRetryAtUtc(
          failureClass: AcademicFactoryFailureClass.rateLimited,
          attemptCount: 2,
          failedAtUtc: failedAt,
        ),
        throwsFormatException,
      );
    });
  });
}
