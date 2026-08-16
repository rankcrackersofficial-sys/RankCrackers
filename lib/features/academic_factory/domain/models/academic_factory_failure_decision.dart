/// Deterministic failure disposition returned by the
/// RankCrackers Autonomous Academic Factory failure policy.
///
/// CODE: AAF-003A
library;

import 'academic_factory_types.dart';

enum AcademicFactoryFailureAction {
  retry,
  repair,
  hardHold,
  failTerminal,
}

extension AcademicFactoryFailureActionContract on AcademicFactoryFailureAction {
  String get wireName {
    switch (this) {
      case AcademicFactoryFailureAction.retry:
        return 'retry';
      case AcademicFactoryFailureAction.repair:
        return 'repair';
      case AcademicFactoryFailureAction.hardHold:
        return 'hard_hold';
      case AcademicFactoryFailureAction.failTerminal:
        return 'fail_terminal';
    }
  }

  AcademicFactoryJobState get nextState {
    switch (this) {
      case AcademicFactoryFailureAction.retry:
        return AcademicFactoryJobState.retryWait;
      case AcademicFactoryFailureAction.repair:
        return AcademicFactoryJobState.repairRequired;
      case AcademicFactoryFailureAction.hardHold:
        return AcademicFactoryJobState.hardHold;
      case AcademicFactoryFailureAction.failTerminal:
        return AcademicFactoryJobState.failedTerminal;
    }
  }

  bool get createsRepairWork => this == AcademicFactoryFailureAction.repair;

  bool get requiresHumanResolution =>
      this == AcademicFactoryFailureAction.hardHold;
}

final class AcademicFactoryFailureDecision {
  const AcademicFactoryFailureDecision({
    required this.action,
    required this.failureClass,
    required this.jobType,
    required this.attemptsExhausted,
  });

  final AcademicFactoryFailureAction action;
  final AcademicFactoryFailureClass failureClass;
  final AcademicFactoryJobType jobType;
  final bool attemptsExhausted;

  AcademicFactoryJobState get nextState => action.nextState;

  bool get createsRepairWork => action.createsRepairWork;

  bool get requiresHumanResolution => action.requiresHumanResolution;
}
