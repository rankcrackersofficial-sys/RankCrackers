import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_run_progress_evaluator.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_job.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_types.dart';

void main() {
  const evaluator = AcademicFactoryRunProgressEvaluator();

  final createdAt = DateTime.utc(2026, 8, 16, 10);
  final updatedAt = DateTime.utc(2026, 8, 16, 10, 1);

  AcademicFactoryJob job({
    required String id,
    required AcademicFactoryJobState state,
    String runId = 'run-1',
    String missionId = 'jee_main_2026',
    String? idempotencyKey,
  }) {
    final leaseBearing = state.requiresLease;

    final failureState = state.requiresFailure;

    return AcademicFactoryJob(
      jobId: id,
      runId: runId,
      missionId: missionId,
      canonicalTargetId: 'AMTN-$id',
      type: AcademicFactoryJobType.digibookDraft,
      state: state,
      dependencyJobIds: const <String>[],
      attemptCount: leaseBearing ? 1 : 0,
      maxAttempts: 3,
      idempotencyKey: idempotencyKey ?? 'run-1:digibook_draft:$id:v1',
      outputHash: state == AcademicFactoryJobState.approved ||
              state == AcademicFactoryJobState.materializing ||
              state == AcademicFactoryJobState.published
          ? 'output-$id'
          : null,
      leaseOwner: leaseBearing ? 'worker-$id' : null,
      leaseExpiresAtUtc:
          leaseBearing ? DateTime.utc(2026, 8, 16, 10, 20) : null,
      nextRetryAtUtc: state == AcademicFactoryJobState.retryWait
          ? DateTime.utc(2026, 8, 16, 10, 5)
          : null,
      failureClass: failureState
          ? state == AcademicFactoryJobState.failedTerminal
              ? AcademicFactoryFailureClass.duplicate
              : state == AcademicFactoryJobState.repairRequired
                  ? AcademicFactoryFailureClass.validationFailed
                  : state == AcademicFactoryJobState.retryWait
                      ? AcademicFactoryFailureClass.timeout
                      : AcademicFactoryFailureClass.governanceBlocked
          : null,
      failureMessage: failureState ? 'failure-$id' : null,
      createdAtUtc: createdAt,
      updatedAtUtc: updatedAt,
    );
  }

  AcademicFactoryRunStatus statusFor(
    List<AcademicFactoryJob> jobs,
  ) {
    return evaluator
        .evaluate(
          runId: 'run-1',
          missionId: 'jee_main_2026',
          jobs: jobs,
        )
        .recommendedRunStatus;
  }

  group('run status recommendation', () {
    test('empty job set is planned', () {
      final progress = evaluator.evaluate(
        runId: 'run-1',
        missionId: 'jee_main_2026',
        jobs: const <AcademicFactoryJob>[],
      );

      expect(
        progress.recommendedRunStatus,
        AcademicFactoryRunStatus.planned,
      );
      expect(progress.totalJobs, 0);
      expect(progress.completionRatio, 0.0);
      expect(
        progress.allJobsTerminalForRunEvaluation,
        isFalse,
      );
    });

    test('ready is running', () {
      expect(
        statusFor([
          job(id: '1', state: AcademicFactoryJobState.ready),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });

    test('leased is running', () {
      expect(
        statusFor([
          job(id: '1', state: AcademicFactoryJobState.leased),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });

    test('running is running', () {
      expect(
        statusFor([
          job(id: '1', state: AcademicFactoryJobState.running),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });

    test('reviewing is running', () {
      expect(
        statusFor([
          job(id: '1', state: AcademicFactoryJobState.reviewing),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });

    test('retryWait is running', () {
      expect(
        statusFor([
          job(id: '1', state: AcademicFactoryJobState.retryWait),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });

    test('repairRequired is running', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.repairRequired,
          ),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });

    test('approved is running', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.approved,
          ),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });

    test('materializing is running', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.materializing,
          ),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });

    test('one published job is completed', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.published,
          ),
        ]),
        AcademicFactoryRunStatus.completed,
      );
    });

    test('all published is completed', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.published,
          ),
          job(
            id: '2',
            state: AcademicFactoryJobState.published,
          ),
        ]),
        AcademicFactoryRunStatus.completed,
      );
    });

    test('published plus hardHold is completedWithHolds', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.published,
          ),
          job(
            id: '2',
            state: AcademicFactoryJobState.hardHold,
          ),
        ]),
        AcademicFactoryRunStatus.completedWithHolds,
      );
    });

    test('only hardHold is completedWithHolds', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.hardHold,
          ),
        ]),
        AcademicFactoryRunStatus.completedWithHolds,
      );
    });

    test('failedTerminal is failed', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.failedTerminal,
          ),
        ]),
        AcademicFactoryRunStatus.failed,
      );
    });

    test('published plus failedTerminal is failed', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.published,
          ),
          job(
            id: '2',
            state: AcademicFactoryJobState.failedTerminal,
          ),
        ]),
        AcademicFactoryRunStatus.failed,
      );
    });

    test('hardHold plus failedTerminal is failed', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.hardHold,
          ),
          job(
            id: '2',
            state: AcademicFactoryJobState.failedTerminal,
          ),
        ]),
        AcademicFactoryRunStatus.failed,
      );
    });

    test('hardHold plus active work remains running', () {
      expect(
        statusFor([
          job(
            id: '1',
            state: AcademicFactoryJobState.hardHold,
          ),
          job(
            id: '2',
            state: AcademicFactoryJobState.ready,
          ),
        ]),
        AcademicFactoryRunStatus.running,
      );
    });
  });

  group('counting and completion', () {
    test('completedJobs counts only published and failedTerminal', () {
      final progress = evaluator.evaluate(
        runId: 'run-1',
        missionId: 'jee_main_2026',
        jobs: [
          job(id: '1', state: AcademicFactoryJobState.published),
          job(
            id: '2',
            state: AcademicFactoryJobState.failedTerminal,
          ),
          job(id: '3', state: AcademicFactoryJobState.hardHold),
          job(id: '4', state: AcademicFactoryJobState.approved),
        ],
      );

      expect(progress.totalJobs, 4);
      expect(progress.completedJobs, 2);
      expect(progress.hardHoldJobs, 1);
      expect(progress.approvedJobs, 1);
      expect(progress.completionRatio, 0.5);
    });

    test('hardHold is excluded from completedJobs', () {
      final progress = evaluator.evaluate(
        runId: 'run-1',
        missionId: 'jee_main_2026',
        jobs: [
          job(id: '1', state: AcademicFactoryJobState.hardHold),
        ],
      );

      expect(progress.completedJobs, 0);
      expect(progress.completionRatio, 0.0);
    });

    test('terminal-for-run evaluation accepts publish hold failure set', () {
      final progress = evaluator.evaluate(
        runId: 'run-1',
        missionId: 'jee_main_2026',
        jobs: [
          job(id: '1', state: AcademicFactoryJobState.published),
          job(id: '2', state: AcademicFactoryJobState.hardHold),
          job(
            id: '3',
            state: AcademicFactoryJobState.failedTerminal,
          ),
        ],
      );

      expect(
        progress.allJobsTerminalForRunEvaluation,
        isTrue,
      );
    });

    test('active job prevents terminal-for-run evaluation', () {
      final progress = evaluator.evaluate(
        runId: 'run-1',
        missionId: 'jee_main_2026',
        jobs: [
          job(id: '1', state: AcademicFactoryJobState.published),
          job(id: '2', state: AcademicFactoryJobState.ready),
        ],
      );

      expect(
        progress.allJobsTerminalForRunEvaluation,
        isFalse,
      );
    });
  });

  group('state counters', () {
    test('every state increments exactly its own counter', () {
      final jobs = <AcademicFactoryJob>[
        job(id: '1', state: AcademicFactoryJobState.planned),
        job(
          id: '2',
          state: AcademicFactoryJobState.waitingDependency,
        ),
        job(id: '3', state: AcademicFactoryJobState.ready),
        job(id: '4', state: AcademicFactoryJobState.leased),
        job(id: '5', state: AcademicFactoryJobState.running),
        job(id: '6', state: AcademicFactoryJobState.reviewing),
        job(
          id: '7',
          state: AcademicFactoryJobState.repairRequired,
        ),
        job(id: '8', state: AcademicFactoryJobState.retryWait),
        job(id: '9', state: AcademicFactoryJobState.hardHold),
        job(id: '10', state: AcademicFactoryJobState.approved),
        job(
          id: '11',
          state: AcademicFactoryJobState.materializing,
        ),
        job(id: '12', state: AcademicFactoryJobState.published),
        job(
          id: '13',
          state: AcademicFactoryJobState.failedTerminal,
        ),
      ];

      final progress = evaluator.evaluate(
        runId: 'run-1',
        missionId: 'jee_main_2026',
        jobs: jobs,
      );

      expect(progress.totalJobs, 13);
      expect(progress.plannedJobs, 1);
      expect(progress.waitingDependencyJobs, 1);
      expect(progress.readyJobs, 1);
      expect(progress.leasedJobs, 1);
      expect(progress.runningJobs, 1);
      expect(progress.reviewingJobs, 1);
      expect(progress.repairRequiredJobs, 1);
      expect(progress.retryWaitJobs, 1);
      expect(progress.hardHoldJobs, 1);
      expect(progress.approvedJobs, 1);
      expect(progress.materializingJobs, 1);
      expect(progress.publishedJobs, 1);
      expect(progress.failedTerminalJobs, 1);
      expect(progress.completedJobs, 2);
    });
  });

  group('fail-closed identity safety', () {
    test('cross-run job rejected', () {
      expect(
        () => evaluator.evaluate(
          runId: 'run-1',
          missionId: 'jee_main_2026',
          jobs: [
            job(
              id: '1',
              state: AcademicFactoryJobState.ready,
              runId: 'run-2',
            ),
          ],
        ),
        throwsFormatException,
      );
    });

    test('cross-mission job rejected', () {
      expect(
        () => evaluator.evaluate(
          runId: 'run-1',
          missionId: 'jee_main_2026',
          jobs: [
            job(
              id: '1',
              state: AcademicFactoryJobState.ready,
              missionId: 'other_mission',
            ),
          ],
        ),
        throwsFormatException,
      );
    });

    test('duplicate jobId rejected', () {
      expect(
        () => evaluator.evaluate(
          runId: 'run-1',
          missionId: 'jee_main_2026',
          jobs: [
            job(
              id: 'same',
              state: AcademicFactoryJobState.ready,
              idempotencyKey: 'key-1',
            ),
            job(
              id: 'same',
              state: AcademicFactoryJobState.ready,
              idempotencyKey: 'key-2',
            ),
          ],
        ),
        throwsFormatException,
      );
    });

    test('duplicate idempotencyKey rejected', () {
      expect(
        () => evaluator.evaluate(
          runId: 'run-1',
          missionId: 'jee_main_2026',
          jobs: [
            job(
              id: '1',
              state: AcademicFactoryJobState.ready,
              idempotencyKey: 'duplicate-key',
            ),
            job(
              id: '2',
              state: AcademicFactoryJobState.ready,
              idempotencyKey: 'duplicate-key',
            ),
          ],
        ),
        throwsFormatException,
      );
    });

    test('blank runId rejected', () {
      expect(
        () => evaluator.evaluate(
          runId: ' ',
          missionId: 'jee_main_2026',
          jobs: const <AcademicFactoryJob>[],
        ),
        throwsFormatException,
      );
    });

    test('blank missionId rejected', () {
      expect(
        () => evaluator.evaluate(
          runId: 'run-1',
          missionId: ' ',
          jobs: const <AcademicFactoryJob>[],
        ),
        throwsFormatException,
      );
    });
  });

  group('determinism', () {
    test('iteration order does not change evaluation', () {
      final forward = <AcademicFactoryJob>[
        job(id: '1', state: AcademicFactoryJobState.published),
        job(id: '2', state: AcademicFactoryJobState.hardHold),
        job(id: '3', state: AcademicFactoryJobState.ready),
        job(
          id: '4',
          state: AcademicFactoryJobState.failedTerminal,
        ),
      ];

      final reverse = forward.reversed.toList();

      final a = evaluator.evaluate(
        runId: 'run-1',
        missionId: 'jee_main_2026',
        jobs: forward,
      );

      final b = evaluator.evaluate(
        runId: 'run-1',
        missionId: 'jee_main_2026',
        jobs: reverse,
      );

      expect(a.totalJobs, b.totalJobs);
      expect(a.plannedJobs, b.plannedJobs);
      expect(
        a.waitingDependencyJobs,
        b.waitingDependencyJobs,
      );
      expect(a.readyJobs, b.readyJobs);
      expect(a.leasedJobs, b.leasedJobs);
      expect(a.runningJobs, b.runningJobs);
      expect(a.reviewingJobs, b.reviewingJobs);
      expect(
        a.repairRequiredJobs,
        b.repairRequiredJobs,
      );
      expect(a.retryWaitJobs, b.retryWaitJobs);
      expect(a.hardHoldJobs, b.hardHoldJobs);
      expect(a.approvedJobs, b.approvedJobs);
      expect(
        a.materializingJobs,
        b.materializingJobs,
      );
      expect(a.publishedJobs, b.publishedJobs);
      expect(
        a.failedTerminalJobs,
        b.failedTerminalJobs,
      );
      expect(a.completedJobs, b.completedJobs);
      expect(a.completionRatio, b.completionRatio);
      expect(
        a.allJobsTerminalForRunEvaluation,
        b.allJobsTerminalForRunEvaluation,
      );
      expect(
        a.recommendedRunStatus,
        b.recommendedRunStatus,
      );
    });
  });
}
