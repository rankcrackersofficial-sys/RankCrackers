/// Deterministic run progress/completion evaluator for the
/// RankCrackers Autonomous Academic Factory.
///
/// CODE: AAF-003C
///
/// Pure domain only. No persistence and no side effects.
library;

import '../models/academic_factory_job.dart';
import '../models/academic_factory_run_progress.dart';
import '../models/academic_factory_types.dart';

final class AcademicFactoryRunProgressEvaluator {
  const AcademicFactoryRunProgressEvaluator();

  AcademicFactoryRunProgress evaluate({
    required String runId,
    required String missionId,
    required Iterable<AcademicFactoryJob> jobs,
  }) {
    final normalizedRunId = runId.trim();
    final normalizedMissionId = missionId.trim();

    if (normalizedRunId.isEmpty) {
      throw const FormatException(
        'runId must not be empty.',
      );
    }

    if (normalizedMissionId.isEmpty) {
      throw const FormatException(
        'missionId must not be empty.',
      );
    }

    var totalJobs = 0;

    var plannedJobs = 0;
    var waitingDependencyJobs = 0;
    var readyJobs = 0;
    var leasedJobs = 0;
    var runningJobs = 0;
    var reviewingJobs = 0;
    var repairRequiredJobs = 0;
    var retryWaitJobs = 0;
    var hardHoldJobs = 0;
    var approvedJobs = 0;
    var materializingJobs = 0;
    var publishedJobs = 0;
    var failedTerminalJobs = 0;

    final jobIds = <String>{};
    final idempotencyKeys = <String>{};

    for (final job in jobs) {
      job.validate();

      if (job.runId != normalizedRunId) {
        throw FormatException(
          'Cross-run AcademicFactoryJob detected: ${job.jobId}.',
        );
      }

      if (job.missionId != normalizedMissionId) {
        throw FormatException(
          'Cross-mission AcademicFactoryJob detected: ${job.jobId}.',
        );
      }

      if (!jobIds.add(job.jobId)) {
        throw FormatException(
          'Duplicate AcademicFactoryJob.jobId: ${job.jobId}.',
        );
      }

      if (!idempotencyKeys.add(job.idempotencyKey)) {
        throw FormatException(
          'Duplicate AcademicFactoryJob.idempotencyKey: '
          '${job.idempotencyKey}.',
        );
      }

      totalJobs++;

      switch (job.state) {
        case AcademicFactoryJobState.planned:
          plannedJobs++;

        case AcademicFactoryJobState.waitingDependency:
          waitingDependencyJobs++;

        case AcademicFactoryJobState.ready:
          readyJobs++;

        case AcademicFactoryJobState.leased:
          leasedJobs++;

        case AcademicFactoryJobState.running:
          runningJobs++;

        case AcademicFactoryJobState.reviewing:
          reviewingJobs++;

        case AcademicFactoryJobState.repairRequired:
          repairRequiredJobs++;

        case AcademicFactoryJobState.retryWait:
          retryWaitJobs++;

        case AcademicFactoryJobState.hardHold:
          hardHoldJobs++;

        case AcademicFactoryJobState.approved:
          approvedJobs++;

        case AcademicFactoryJobState.materializing:
          materializingJobs++;

        case AcademicFactoryJobState.published:
          publishedJobs++;

        case AcademicFactoryJobState.failedTerminal:
          failedTerminalJobs++;
      }
    }

    final completedJobs = publishedJobs + failedTerminalJobs;

    final completionRatio = totalJobs == 0 ? 0.0 : completedJobs / totalJobs;

    final activeWorkCount = plannedJobs +
        waitingDependencyJobs +
        readyJobs +
        leasedJobs +
        runningJobs +
        reviewingJobs +
        repairRequiredJobs +
        retryWaitJobs +
        approvedJobs +
        materializingJobs;

    final allJobsTerminalForRunEvaluation = totalJobs > 0 &&
        activeWorkCount == 0 &&
        publishedJobs + failedTerminalJobs + hardHoldJobs == totalJobs;

    late final AcademicFactoryRunStatus status;

    if (totalJobs == 0) {
      status = AcademicFactoryRunStatus.planned;
    } else if (activeWorkCount > 0) {
      status = AcademicFactoryRunStatus.running;
    } else if (failedTerminalJobs > 0) {
      status = AcademicFactoryRunStatus.failed;
    } else if (hardHoldJobs > 0) {
      status = AcademicFactoryRunStatus.completedWithHolds;
    } else if (publishedJobs == totalJobs) {
      status = AcademicFactoryRunStatus.completed;
    } else {
      throw StateError(
        'AcademicFactoryRunProgressEvaluator reached an '
        'unrepresentable run state.',
      );
    }

    return AcademicFactoryRunProgress(
      runId: normalizedRunId,
      missionId: normalizedMissionId,
      totalJobs: totalJobs,
      plannedJobs: plannedJobs,
      waitingDependencyJobs: waitingDependencyJobs,
      readyJobs: readyJobs,
      leasedJobs: leasedJobs,
      runningJobs: runningJobs,
      reviewingJobs: reviewingJobs,
      repairRequiredJobs: repairRequiredJobs,
      retryWaitJobs: retryWaitJobs,
      hardHoldJobs: hardHoldJobs,
      approvedJobs: approvedJobs,
      materializingJobs: materializingJobs,
      publishedJobs: publishedJobs,
      failedTerminalJobs: failedTerminalJobs,
      completedJobs: completedJobs,
      completionRatio: completionRatio,
      allJobsTerminalForRunEvaluation: allJobsTerminalForRunEvaluation,
      recommendedRunStatus: status,
    );
  }
}
