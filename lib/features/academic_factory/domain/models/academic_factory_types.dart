/// Canonical wire-level types for the RankCrackers Autonomous Academic Factory.
///
/// CODE: AAF-001
///
/// This layer is intentionally pure Dart.
/// It contains no Firebase, Vertex AI, Gemini, UI, or repository dependency.
library;

enum AcademicFactoryJobType {
  sourceAcquisition,
  sourceValidation,
  digibookDraft,
  digibookValidation,
  digibookProReview,
  digibookRepair,
  digibookAssembly,
  digibookMaterialization,
  crucibleDraft,
  crucibleValidation,
  crucibleProReview,
  crucibleRepair,
  crucibleMaterialization,
}

enum AcademicFactoryJobState {
  planned,
  waitingDependency,
  ready,
  leased,
  running,
  reviewing,
  repairRequired,
  retryWait,
  hardHold,
  approved,
  materializing,
  published,
  failedTerminal,
}

enum AcademicFactoryFailureClass {
  transientProvider,
  rateLimited,
  timeout,
  sourceMissing,
  sourceInsufficient,
  sourceMismatch,
  validationFailed,
  reviewDispute,
  academicError,
  formatError,
  duplicate,
  materializationFailed,
  governanceBlocked,
  unknown,
}

enum AcademicFactoryRunStatus {
  planned,
  running,
  paused,
  completed,
  completedWithHolds,
  failed,
  cancelled,
}

extension AcademicFactoryJobTypeWire on AcademicFactoryJobType {
  String get wireName {
    switch (this) {
      case AcademicFactoryJobType.sourceAcquisition:
        return 'source_acquisition';
      case AcademicFactoryJobType.sourceValidation:
        return 'source_validation';
      case AcademicFactoryJobType.digibookDraft:
        return 'digibook_draft';
      case AcademicFactoryJobType.digibookValidation:
        return 'digibook_validation';
      case AcademicFactoryJobType.digibookProReview:
        return 'digibook_pro_review';
      case AcademicFactoryJobType.digibookRepair:
        return 'digibook_repair';
      case AcademicFactoryJobType.digibookAssembly:
        return 'digibook_assembly';
      case AcademicFactoryJobType.digibookMaterialization:
        return 'digibook_materialization';
      case AcademicFactoryJobType.crucibleDraft:
        return 'crucible_draft';
      case AcademicFactoryJobType.crucibleValidation:
        return 'crucible_validation';
      case AcademicFactoryJobType.crucibleProReview:
        return 'crucible_pro_review';
      case AcademicFactoryJobType.crucibleRepair:
        return 'crucible_repair';
      case AcademicFactoryJobType.crucibleMaterialization:
        return 'crucible_materialization';
    }
  }
}

extension AcademicFactoryJobStateWire on AcademicFactoryJobState {
  String get wireName {
    switch (this) {
      case AcademicFactoryJobState.planned:
        return 'planned';
      case AcademicFactoryJobState.waitingDependency:
        return 'waiting_dependency';
      case AcademicFactoryJobState.ready:
        return 'ready';
      case AcademicFactoryJobState.leased:
        return 'leased';
      case AcademicFactoryJobState.running:
        return 'running';
      case AcademicFactoryJobState.reviewing:
        return 'reviewing';
      case AcademicFactoryJobState.repairRequired:
        return 'repair_required';
      case AcademicFactoryJobState.retryWait:
        return 'retry_wait';
      case AcademicFactoryJobState.hardHold:
        return 'hard_hold';
      case AcademicFactoryJobState.approved:
        return 'approved';
      case AcademicFactoryJobState.materializing:
        return 'materializing';
      case AcademicFactoryJobState.published:
        return 'published';
      case AcademicFactoryJobState.failedTerminal:
        return 'failed_terminal';
    }
  }

  bool get isTerminal =>
      this == AcademicFactoryJobState.published ||
      this == AcademicFactoryJobState.failedTerminal;

  bool get requiresLease =>
      this == AcademicFactoryJobState.leased ||
      this == AcademicFactoryJobState.running ||
      this == AcademicFactoryJobState.reviewing ||
      this == AcademicFactoryJobState.materializing;

  bool get requiresFailure =>
      this == AcademicFactoryJobState.repairRequired ||
      this == AcademicFactoryJobState.retryWait ||
      this == AcademicFactoryJobState.hardHold ||
      this == AcademicFactoryJobState.failedTerminal;
}

extension AcademicFactoryFailureClassWire on AcademicFactoryFailureClass {
  String get wireName {
    switch (this) {
      case AcademicFactoryFailureClass.transientProvider:
        return 'transient_provider';
      case AcademicFactoryFailureClass.rateLimited:
        return 'rate_limited';
      case AcademicFactoryFailureClass.timeout:
        return 'timeout';
      case AcademicFactoryFailureClass.sourceMissing:
        return 'source_missing';
      case AcademicFactoryFailureClass.sourceInsufficient:
        return 'source_insufficient';
      case AcademicFactoryFailureClass.sourceMismatch:
        return 'source_mismatch';
      case AcademicFactoryFailureClass.validationFailed:
        return 'validation_failed';
      case AcademicFactoryFailureClass.reviewDispute:
        return 'review_dispute';
      case AcademicFactoryFailureClass.academicError:
        return 'academic_error';
      case AcademicFactoryFailureClass.formatError:
        return 'format_error';
      case AcademicFactoryFailureClass.duplicate:
        return 'duplicate';
      case AcademicFactoryFailureClass.materializationFailed:
        return 'materialization_failed';
      case AcademicFactoryFailureClass.governanceBlocked:
        return 'governance_blocked';
      case AcademicFactoryFailureClass.unknown:
        return 'unknown';
    }
  }
}

extension AcademicFactoryRunStatusWire on AcademicFactoryRunStatus {
  String get wireName {
    switch (this) {
      case AcademicFactoryRunStatus.planned:
        return 'planned';
      case AcademicFactoryRunStatus.running:
        return 'running';
      case AcademicFactoryRunStatus.paused:
        return 'paused';
      case AcademicFactoryRunStatus.completed:
        return 'completed';
      case AcademicFactoryRunStatus.completedWithHolds:
        return 'completed_with_holds';
      case AcademicFactoryRunStatus.failed:
        return 'failed';
      case AcademicFactoryRunStatus.cancelled:
        return 'cancelled';
    }
  }

  bool get isTerminal =>
      this == AcademicFactoryRunStatus.completed ||
      this == AcademicFactoryRunStatus.completedWithHolds ||
      this == AcademicFactoryRunStatus.failed ||
      this == AcademicFactoryRunStatus.cancelled;
}

AcademicFactoryJobType academicFactoryJobTypeFromWire(String value) {
  return AcademicFactoryJobType.values.firstWhere(
    (candidate) => candidate.wireName == value,
    orElse: () => throw FormatException(
      'Unknown AcademicFactoryJobType: $value',
    ),
  );
}

AcademicFactoryJobState academicFactoryJobStateFromWire(String value) {
  return AcademicFactoryJobState.values.firstWhere(
    (candidate) => candidate.wireName == value,
    orElse: () => throw FormatException(
      'Unknown AcademicFactoryJobState: $value',
    ),
  );
}

AcademicFactoryFailureClass academicFactoryFailureClassFromWire(String value) {
  return AcademicFactoryFailureClass.values.firstWhere(
    (candidate) => candidate.wireName == value,
    orElse: () => throw FormatException(
      'Unknown AcademicFactoryFailureClass: $value',
    ),
  );
}

AcademicFactoryRunStatus academicFactoryRunStatusFromWire(String value) {
  return AcademicFactoryRunStatus.values.firstWhere(
    (candidate) => candidate.wireName == value,
    orElse: () => throw FormatException(
      'Unknown AcademicFactoryRunStatus: $value',
    ),
  );
}
