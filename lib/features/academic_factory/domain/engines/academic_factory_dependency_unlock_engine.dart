/// Computes dependency unlock decisions for AAF-002 without side effects.
library;

import '../models/academic_factory_dependency_graph.dart';
import '../models/academic_factory_types.dart';
import '../models/academic_factory_unlock_decision.dart';
import 'academic_factory_dependency_graph_validator.dart';

final class AcademicFactoryDependencyUnlockEngine {
  const AcademicFactoryDependencyUnlockEngine({
    this.validator = const AcademicFactoryDependencyGraphValidator(),
  });

  final AcademicFactoryDependencyGraphValidator validator;

  AcademicFactoryUnlockPlan buildUnlockPlan({
    required AcademicFactoryDependencyGraph graph,
    required int maxParallelUnlocks,
  }) {
    final validation = validator.validate(graph);
    if (!validation.isValid) {
      return AcademicFactoryUnlockPlan(
        maxParallelUnlocks: maxParallelUnlocks,
        decisions: graph.jobs
            .map(
              (job) => AcademicFactoryUnlockDecision(
                jobId: job.jobId,
                canUnlock: false,
                reasonCode: 'GRAPH_INVALID',
                dependencyJobIds: job.dependencyJobIds,
              ),
            )
            .toList(growable: false),
      );
    }

    final jobsById = graph.jobsById;
    final decisions = <AcademicFactoryUnlockDecision>[];

    for (final job in graph.jobs) {
      if (job.state != AcademicFactoryJobState.planned &&
          job.state != AcademicFactoryJobState.waitingDependency) {
        decisions.add(
          AcademicFactoryUnlockDecision(
            jobId: job.jobId,
            canUnlock: false,
            reasonCode: 'STATE_NOT_UNLOCKABLE:${job.state.wireName}',
            dependencyJobIds: job.dependencyJobIds,
          ),
        );
        continue;
      }

      final dependencies = job.dependencyJobIds.map((dependencyId) {
        return jobsById[dependencyId];
      }).toList(growable: false);

      final missing = job.dependencyJobIds
          .where((dependencyId) => !jobsById.containsKey(dependencyId))
          .toList(growable: false);
      if (missing.isNotEmpty) {
        decisions.add(
          AcademicFactoryUnlockDecision(
            jobId: job.jobId,
            canUnlock: false,
            reasonCode: 'MISSING_DEPENDENCY:${missing.join(',')}',
            dependencyJobIds: job.dependencyJobIds,
          ),
        );
        continue;
      }

      final failed = dependencies
          .where(
            (dependency) =>
                dependency!.state == AcademicFactoryJobState.failedTerminal,
          )
          .map((dependency) => dependency!.jobId)
          .toList(growable: false);
      if (failed.isNotEmpty) {
        decisions.add(
          AcademicFactoryUnlockDecision(
            jobId: job.jobId,
            canUnlock: false,
            reasonCode: 'DEPENDENCY_FAILED:${failed.join(',')}',
            dependencyJobIds: job.dependencyJobIds,
          ),
        );
        continue;
      }

      final held = dependencies
          .where(
            (dependency) =>
                dependency!.state == AcademicFactoryJobState.hardHold,
          )
          .map((dependency) => dependency!.jobId)
          .toList(growable: false);
      if (held.isNotEmpty) {
        decisions.add(
          AcademicFactoryUnlockDecision(
            jobId: job.jobId,
            canUnlock: false,
            reasonCode: 'DEPENDENCY_ON_HOLD:${held.join(',')}',
            dependencyJobIds: job.dependencyJobIds,
          ),
        );
        continue;
      }

      final unresolved = dependencies
          .where(
            (dependency) =>
                dependency!.state != AcademicFactoryJobState.approved,
          )
          .map((dependency) => dependency!.jobId)
          .toList(growable: false);
      if (unresolved.isNotEmpty) {
        decisions.add(
          AcademicFactoryUnlockDecision(
            jobId: job.jobId,
            canUnlock: false,
            reasonCode: 'WAITING_FOR_DEPENDENCIES:${unresolved.join(',')}',
            dependencyJobIds: job.dependencyJobIds,
          ),
        );
        continue;
      }

      decisions.add(
        AcademicFactoryUnlockDecision(
          jobId: job.jobId,
          canUnlock: true,
          reasonCode: 'DEPENDENCIES_APPROVED',
          dependencyJobIds: job.dependencyJobIds,
        ),
      );
    }

    return AcademicFactoryUnlockPlan(
      decisions: decisions,
      maxParallelUnlocks: maxParallelUnlocks,
    );
  }
}
