/// Validates AAF-002 dependency graphs without side effects.
library;

import '../models/academic_factory_dependency_graph.dart';
import '../models/academic_factory_types.dart';

final class AcademicFactoryDependencyGraphValidator {
  const AcademicFactoryDependencyGraphValidator();

  AcademicFactoryGraphValidationResult validate(
    AcademicFactoryDependencyGraph graph,
  ) {
    final issues = <String>[];
    final jobsById = graph.jobsById;

    for (final job in graph.jobs) {
      for (final dependencyId in job.dependencyJobIds) {
        final dependency = jobsById[dependencyId];
        if (dependency == null) {
          issues.add('MISSING_DEPENDENCY:${job.jobId}:$dependencyId');
          continue;
        }
        if (dependency.canonicalTargetId != job.canonicalTargetId) {
          issues.add(
            'CROSS_AMTN_DEPENDENCY:${job.jobId}:$dependencyId',
          );
        }
      }
    }

    final visiting = <String>{};
    final visited = <String>{};

    void visit(String jobId, List<String> stack) {
      if (visited.contains(jobId)) return;
      if (!visiting.add(jobId)) {
        issues.add('DEPENDENCY_CYCLE:${[...stack, jobId].join('>')}');
        return;
      }

      final job = jobsById[jobId];
      if (job != null) {
        for (final dependencyId in job.dependencyJobIds) {
          if (jobsById.containsKey(dependencyId)) {
            visit(dependencyId, <String>[...stack, jobId]);
          }
        }
      }

      visiting.remove(jobId);
      visited.add(jobId);
    }

    for (final jobId in jobsById.keys) {
      visit(jobId, const <String>[]);
    }

    for (final job in graph.jobs) {
      if (job.state == AcademicFactoryJobState.ready &&
          job.dependencyJobIds.isNotEmpty) {
        final unresolved = job.dependencyJobIds.where((dependencyId) {
          final dependency = jobsById[dependencyId];
          return dependency == null ||
              dependency.state != AcademicFactoryJobState.approved;
        }).toList(growable: false);

        if (unresolved.isNotEmpty) {
          issues.add(
            'READY_WITH_UNRESOLVED_DEPENDENCIES:${job.jobId}:'
            '${unresolved.join(',')}',
          );
        }
      }
    }

    return AcademicFactoryGraphValidationResult(
      isValid: issues.isEmpty,
      issues: issues,
    );
  }
}

final class AcademicFactoryGraphValidationResult {
  AcademicFactoryGraphValidationResult({
    required this.isValid,
    required List<String> issues,
  }) : issues = List<String>.unmodifiable(issues);

  final bool isValid;
  final List<String> issues;

  int get missingDependencyCount => _countPrefix('MISSING_DEPENDENCY:');
  int get cycleCount => _countPrefix('DEPENDENCY_CYCLE:');
  int get crossAmtnDependencyCount => _countPrefix('CROSS_AMTN_DEPENDENCY:');

  Map<String, Object?> toJson() => <String, Object?>{
        'isValid': isValid,
        'issues': issues,
        'missingDependencyCount': missingDependencyCount,
        'cycleCount': cycleCount,
        'crossAmtnDependencyCount': crossAmtnDependencyCount,
      };

  int _countPrefix(String prefix) {
    return issues.where((issue) => issue.startsWith(prefix)).length;
  }
}
