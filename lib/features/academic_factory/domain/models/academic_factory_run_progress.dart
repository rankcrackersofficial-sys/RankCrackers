/// Pure-domain representation of run progress and status.
///
/// CODE: AAF-003C
library;

import 'academic_factory_types.dart';

final class AcademicFactoryRunProgress {
  final String runId;
  final String missionId;
  final int totalJobs;
  final int plannedJobs;
  final int waitingDependencyJobs;
  final int readyJobs;
  final int leasedJobs;
  final int runningJobs;
  final int reviewingJobs;
  final int repairRequiredJobs;
  final int retryWaitJobs;
  final int hardHoldJobs;
  final int approvedJobs;
  final int materializingJobs;
  final int publishedJobs;
  final int failedTerminalJobs;
  final int completedJobs;
  final double completionRatio;
  final bool allJobsTerminalForRunEvaluation;
  final AcademicFactoryRunStatus recommendedRunStatus;

  const AcademicFactoryRunProgress({
    required this.runId,
    required this.missionId,
    required this.totalJobs,
    required this.plannedJobs,
    required this.waitingDependencyJobs,
    required this.readyJobs,
    required this.leasedJobs,
    required this.runningJobs,
    required this.reviewingJobs,
    required this.repairRequiredJobs,
    required this.retryWaitJobs,
    required this.hardHoldJobs,
    required this.approvedJobs,
    required this.materializingJobs,
    required this.publishedJobs,
    required this.failedTerminalJobs,
    required this.completedJobs,
    required this.completionRatio,
    required this.allJobsTerminalForRunEvaluation,
    required this.recommendedRunStatus,
  });
}
