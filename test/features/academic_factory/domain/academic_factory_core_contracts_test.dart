import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_transition_policy.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_job.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_run.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_types.dart';

void main() {
  final created = DateTime.utc(2026, 8, 16, 10);
  final updated = DateTime.utc(2026, 8, 16, 10, 1);

  group('AcademicFactory wire contracts', () {
    test('all enum wire names round-trip', () {
      for (final value in AcademicFactoryJobType.values) {
        expect(
          academicFactoryJobTypeFromWire(value.wireName),
          value,
        );
      }

      for (final value in AcademicFactoryJobState.values) {
        expect(
          academicFactoryJobStateFromWire(value.wireName),
          value,
        );
      }

      for (final value in AcademicFactoryFailureClass.values) {
        expect(
          academicFactoryFailureClassFromWire(value.wireName),
          value,
        );
      }

      for (final value in AcademicFactoryRunStatus.values) {
        expect(
          academicFactoryRunStatusFromWire(value.wireName),
          value,
        );
      }
    });

    test('unknown wire value fails closed', () {
      expect(
        () => academicFactoryJobStateFromWire('invented_state'),
        throwsFormatException,
      );
    });
  });

  group('AcademicFactoryJob', () {
    test('ready job round-trips deterministically', () {
      final job = AcademicFactoryJob(
        jobId: 'job-1',
        runId: 'run-1',
        missionId: 'jee_main_2026',
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.ready,
        dependencyJobIds: const <String>['source-job-1'],
        attemptCount: 0,
        maxAttempts: 3,
        idempotencyKey: 'run-1:digibook_draft:AMTN-001:v1',
        inputHash: 'input-hash',
        createdAtUtc: created,
        updatedAtUtc: updated,
      );

      final json = job.toJson();
      final restored = AcademicFactoryJob.fromJson(json);

      expect(restored.toJson(), json);
      expect(restored.isTerminal, isFalse);
      expect(restored.attemptsExhausted, isFalse);
    });

    test('duplicate dependency fails closed', () {
      expect(
        () => AcademicFactoryJob(
          jobId: 'job-1',
          runId: 'run-1',
          missionId: 'jee_main_2026',
          canonicalTargetId: 'AMTN-001',
          type: AcademicFactoryJobType.digibookDraft,
          state: AcademicFactoryJobState.ready,
          dependencyJobIds: const <String>[
            'source-job-1',
            'source-job-1',
          ],
          attemptCount: 0,
          maxAttempts: 3,
          idempotencyKey: 'idempotency',
          createdAtUtc: created,
          updatedAtUtc: updated,
        ),
        throwsFormatException,
      );
    });

    test('self dependency fails closed', () {
      expect(
        () => AcademicFactoryJob(
          jobId: 'job-1',
          runId: 'run-1',
          missionId: 'jee_main_2026',
          canonicalTargetId: 'AMTN-001',
          type: AcademicFactoryJobType.digibookDraft,
          state: AcademicFactoryJobState.ready,
          dependencyJobIds: const <String>['job-1'],
          attemptCount: 0,
          maxAttempts: 3,
          idempotencyKey: 'idempotency',
          createdAtUtc: created,
          updatedAtUtc: updated,
        ),
        throwsFormatException,
      );
    });

    test('leased job requires lease metadata', () {
      expect(
        () => AcademicFactoryJob(
          jobId: 'job-1',
          runId: 'run-1',
          missionId: 'jee_main_2026',
          canonicalTargetId: 'AMTN-001',
          type: AcademicFactoryJobType.digibookDraft,
          state: AcademicFactoryJobState.leased,
          dependencyJobIds: const <String>[],
          attemptCount: 1,
          maxAttempts: 3,
          idempotencyKey: 'idempotency',
          createdAtUtc: created,
          updatedAtUtc: updated,
        ),
        throwsFormatException,
      );
    });

    test('valid leased job is accepted', () {
      final job = AcademicFactoryJob(
        jobId: 'job-1',
        runId: 'run-1',
        missionId: 'jee_main_2026',
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.leased,
        dependencyJobIds: const <String>[],
        attemptCount: 1,
        maxAttempts: 3,
        idempotencyKey: 'idempotency',
        leaseOwner: 'worker-1',
        leaseExpiresAtUtc: DateTime.utc(2026, 8, 16, 10, 6),
        createdAtUtc: created,
        updatedAtUtc: updated,
      );

      expect(job.state, AcademicFactoryJobState.leased);
    });

    test('retry_wait requires retry timestamp and failure', () {
      expect(
        () => AcademicFactoryJob(
          jobId: 'job-1',
          runId: 'run-1',
          missionId: 'jee_main_2026',
          canonicalTargetId: 'AMTN-001',
          type: AcademicFactoryJobType.digibookDraft,
          state: AcademicFactoryJobState.retryWait,
          dependencyJobIds: const <String>[],
          attemptCount: 1,
          maxAttempts: 3,
          idempotencyKey: 'idempotency',
          failureClass: AcademicFactoryFailureClass.transientProvider,
          createdAtUtc: created,
          updatedAtUtc: updated,
        ),
        throwsFormatException,
      );
    });

    test('valid retry_wait job is accepted', () {
      final job = AcademicFactoryJob(
        jobId: 'job-1',
        runId: 'run-1',
        missionId: 'jee_main_2026',
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.retryWait,
        dependencyJobIds: const <String>[],
        attemptCount: 1,
        maxAttempts: 3,
        idempotencyKey: 'idempotency',
        nextRetryAtUtc: DateTime.utc(2026, 8, 16, 10, 5),
        failureClass: AcademicFactoryFailureClass.transientProvider,
        failureMessage: 'temporary provider failure',
        createdAtUtc: created,
        updatedAtUtc: updated,
      );

      expect(
        job.failureClass,
        AcademicFactoryFailureClass.transientProvider,
      );
    });

    test('approved job requires output hash', () {
      expect(
        () => AcademicFactoryJob(
          jobId: 'job-1',
          runId: 'run-1',
          missionId: 'jee_main_2026',
          canonicalTargetId: 'AMTN-001',
          type: AcademicFactoryJobType.digibookProReview,
          state: AcademicFactoryJobState.approved,
          dependencyJobIds: const <String>[],
          attemptCount: 1,
          maxAttempts: 3,
          idempotencyKey: 'idempotency',
          createdAtUtc: created,
          updatedAtUtc: updated,
        ),
        throwsFormatException,
      );
    });

    test('published job is terminal', () {
      final job = AcademicFactoryJob(
        jobId: 'job-1',
        runId: 'run-1',
        missionId: 'jee_main_2026',
        canonicalTargetId: 'AMTN-001',
        type: AcademicFactoryJobType.digibookMaterialization,
        state: AcademicFactoryJobState.published,
        dependencyJobIds: const <String>[],
        attemptCount: 1,
        maxAttempts: 3,
        idempotencyKey: 'idempotency',
        outputHash: 'published-hash',
        createdAtUtc: created,
        updatedAtUtc: updated,
      );

      expect(job.isTerminal, isTrue);
    });
    group('AcademicFactoryRun', () {
      test('running run round-trips', () {
        final run = AcademicFactoryRun(
          runId: 'run-1',
          missionId: 'jee_main_2026',
          status: AcademicFactoryRunStatus.running,
          createdAtUtc: created,
          updatedAtUtc: updated,
          startedAtUtc: created,
        );

        final json = run.toJson();
        final restored = AcademicFactoryRun.fromJson(json);

        expect(restored.toJson(), json);
        expect(restored.isTerminal, isFalse);
      });

      test('paused run requires pauseReason', () {
        expect(
          () => AcademicFactoryRun(
            runId: 'run-1',
            missionId: 'jee_main_2026',
            status: AcademicFactoryRunStatus.paused,
            createdAtUtc: created,
            updatedAtUtc: updated,
            startedAtUtc: created,
          ),
          throwsFormatException,
        );
      });

      test('completed run is terminal', () {
        final run = AcademicFactoryRun(
          runId: 'run-1',
          missionId: 'jee_main_2026',
          status: AcademicFactoryRunStatus.completed,
          createdAtUtc: created,
          updatedAtUtc: updated,
          startedAtUtc: created,
          completedAtUtc: updated,
        );

        expect(run.isTerminal, isTrue);
      });
    });

    group('AcademicFactoryTransitionPolicy', () {
      const policy = AcademicFactoryTransitionPolicy();

      test('normal production path is legal', () {
        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.planned,
            to: AcademicFactoryJobState.waitingDependency,
          ),
          isTrue,
        );

        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.waitingDependency,
            to: AcademicFactoryJobState.ready,
          ),
          isTrue,
        );

        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.ready,
            to: AcademicFactoryJobState.leased,
          ),
          isTrue,
        );

        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.leased,
            to: AcademicFactoryJobState.running,
          ),
          isTrue,
        );

        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.running,
            to: AcademicFactoryJobState.reviewing,
          ),
          isTrue,
        );

        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.reviewing,
            to: AcademicFactoryJobState.approved,
          ),
          isTrue,
        );

        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.approved,
            to: AcademicFactoryJobState.materializing,
          ),
          isTrue,
        );

        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.materializing,
            to: AcademicFactoryJobState.published,
          ),
          isTrue,
        );
      });

      test('repair path is legal', () {
        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.reviewing,
            to: AcademicFactoryJobState.repairRequired,
          ),
          isTrue,
        );

        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.repairRequired,
            to: AcademicFactoryJobState.ready,
          ),
          isTrue,
        );
      });

      test('terminal states cannot transition', () {
        expect(
          policy.allowedNextStates(
            AcademicFactoryJobState.published,
          ),
          isEmpty,
        );

        expect(
          policy.allowedNextStates(
            AcademicFactoryJobState.failedTerminal,
          ),
          isEmpty,
        );
      });

      test('illegal transition fails closed', () {
        expect(
          () => policy.assertTransition(
            from: AcademicFactoryJobState.ready,
            to: AcademicFactoryJobState.published,
          ),
          throwsStateError,
        );
      });

      test('same-state transition is rejected', () {
        expect(
          policy.canTransition(
            from: AcademicFactoryJobState.running,
            to: AcademicFactoryJobState.running,
          ),
          isFalse,
        );
      });
    });
  });
}
