/// Deterministic state-transition authority for an AcademicFactoryJob.
///
/// CODE: AAF-001 / AAF-003B
///
/// This engine performs no persistence and no side effects.
library;

import '../models/academic_factory_types.dart';

final class AcademicFactoryTransitionPolicy {
  const AcademicFactoryTransitionPolicy();

  bool canTransition({
    required AcademicFactoryJobState from,
    required AcademicFactoryJobState to,
  }) {
    if (from == to) {
      return false;
    }

    return allowedNextStates(from).contains(to);
  }

  Set<AcademicFactoryJobState> allowedNextStates(
    AcademicFactoryJobState from,
  ) {
    switch (from) {
      case AcademicFactoryJobState.planned:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.waitingDependency,
          AcademicFactoryJobState.ready,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.waitingDependency:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.ready,
          AcademicFactoryJobState.hardHold,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.ready:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.leased,
          AcademicFactoryJobState.hardHold,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.leased:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.running,
          AcademicFactoryJobState.retryWait,
          AcademicFactoryJobState.hardHold,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.running:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.reviewing,
          AcademicFactoryJobState.repairRequired,
          AcademicFactoryJobState.retryWait,
          AcademicFactoryJobState.hardHold,
          AcademicFactoryJobState.approved,
          AcademicFactoryJobState.materializing,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.reviewing:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.repairRequired,
          AcademicFactoryJobState.retryWait,
          AcademicFactoryJobState.hardHold,
          AcademicFactoryJobState.approved,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.repairRequired:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.ready,
          AcademicFactoryJobState.retryWait,
          AcademicFactoryJobState.hardHold,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.retryWait:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.ready,
          AcademicFactoryJobState.hardHold,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.hardHold:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.ready,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.approved:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.materializing,
          AcademicFactoryJobState.published,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.materializing:
        return const <AcademicFactoryJobState>{
          AcademicFactoryJobState.published,
          AcademicFactoryJobState.retryWait,
          AcademicFactoryJobState.hardHold,
          AcademicFactoryJobState.failedTerminal,
        };

      case AcademicFactoryJobState.published:
      case AcademicFactoryJobState.failedTerminal:
        return const <AcademicFactoryJobState>{};
    }
  }

  void assertTransition({
    required AcademicFactoryJobState from,
    required AcademicFactoryJobState to,
  }) {
    if (!canTransition(from: from, to: to)) {
      throw StateError(
        'Illegal AcademicFactoryJob transition: '
        '${from.wireName} -> ${to.wireName}',
      );
    }
  }
}
