/// Deterministic failure-disposition authority for the
/// RankCrackers Autonomous Academic Factory.
///
/// CODE: AAF-003B
library;

import '../models/academic_factory_failure_decision.dart';
import '../models/academic_factory_job.dart';
import '../models/academic_factory_types.dart';

final class AcademicFactoryFailurePolicy {
  const AcademicFactoryFailurePolicy();

  AcademicFactoryFailureDecision decide({
    required AcademicFactoryJob job,
    required AcademicFactoryFailureClass failureClass,
  }) {
    if (!_isFailureProcessingState(job.state)) {
      throw StateError(
        'Cannot evaluate failure policy for job in non-processing state: '
        '${job.state.wireName}',
      );
    }

    final exhausted = job.attemptsExhausted;

    final action = switch (failureClass) {
      AcademicFactoryFailureClass.transientProvider ||
      AcademicFactoryFailureClass.rateLimited ||
      AcademicFactoryFailureClass.timeout =>
        exhausted
            ? AcademicFactoryFailureAction.hardHold
            : AcademicFactoryFailureAction.retry,
      AcademicFactoryFailureClass.sourceMissing =>
        _sourceMissingDisposition(job: job, exhausted: exhausted),
      AcademicFactoryFailureClass.sourceInsufficient ||
      AcademicFactoryFailureClass.sourceMismatch =>
        AcademicFactoryFailureAction.hardHold,
      AcademicFactoryFailureClass.validationFailed ||
      AcademicFactoryFailureClass.reviewDispute ||
      AcademicFactoryFailureClass.academicError ||
      AcademicFactoryFailureClass.formatError =>
        _repairableContentDisposition(job: job, exhausted: exhausted),
      AcademicFactoryFailureClass.duplicate =>
        AcademicFactoryFailureAction.failTerminal,
      AcademicFactoryFailureClass.materializationFailed =>
        _materializationDisposition(job: job, exhausted: exhausted),
      AcademicFactoryFailureClass.governanceBlocked ||
      AcademicFactoryFailureClass.unknown =>
        AcademicFactoryFailureAction.hardHold,
    };

    return AcademicFactoryFailureDecision(
      action: action,
      failureClass: failureClass,
      jobType: job.type,
      attemptsExhausted: exhausted,
    );
  }

  bool _isFailureProcessingState(
    AcademicFactoryJobState state,
  ) {
    return state == AcademicFactoryJobState.leased ||
        state == AcademicFactoryJobState.running ||
        state == AcademicFactoryJobState.reviewing ||
        state == AcademicFactoryJobState.materializing;
  }

  AcademicFactoryFailureAction _sourceMissingDisposition({
    required AcademicFactoryJob job,
    required bool exhausted,
  }) {
    final sourceJob = job.type == AcademicFactoryJobType.sourceAcquisition ||
        job.type == AcademicFactoryJobType.sourceValidation;

    if (!sourceJob) {
      return AcademicFactoryFailureAction.hardHold;
    }

    return exhausted
        ? AcademicFactoryFailureAction.hardHold
        : AcademicFactoryFailureAction.retry;
  }

  AcademicFactoryFailureAction _repairableContentDisposition({
    required AcademicFactoryJob job,
    required bool exhausted,
  }) {
    if (!_isRepairableContentJob(job.type)) {
      return AcademicFactoryFailureAction.hardHold;
    }

    // Leased or materializing states cannot produce repairRequired; they must fail closed to hardHold
    if (job.state == AcademicFactoryJobState.leased ||
        job.state == AcademicFactoryJobState.materializing) {
      return AcademicFactoryFailureAction.hardHold;
    }

    if (exhausted) {
      return AcademicFactoryFailureAction.hardHold;
    }

    return AcademicFactoryFailureAction.repair;
  }

  AcademicFactoryFailureAction _materializationDisposition({
    required AcademicFactoryJob job,
    required bool exhausted,
  }) {
    final materializationJob =
        job.type == AcademicFactoryJobType.digibookMaterialization ||
            job.type == AcademicFactoryJobType.crucibleMaterialization;

    if (!materializationJob) {
      return AcademicFactoryFailureAction.hardHold;
    }

    return exhausted
        ? AcademicFactoryFailureAction.hardHold
        : AcademicFactoryFailureAction.retry;
  }

  bool _isRepairableContentJob(
    AcademicFactoryJobType type,
  ) {
    return type == AcademicFactoryJobType.digibookDraft ||
        type == AcademicFactoryJobType.digibookValidation ||
        type == AcademicFactoryJobType.digibookProReview ||
        type == AcademicFactoryJobType.crucibleDraft ||
        type == AcademicFactoryJobType.crucibleValidation ||
        type == AcademicFactoryJobType.crucibleProReview;
  }
}
