/// Deterministic dependency graph model for AAF-002.
///
/// Pure Dart only. No Firebase, no AI, no repositories, no workers.
library;

import 'academic_factory_job.dart';
import 'academic_factory_types.dart';

final class AcademicFactoryDependencyGraph {
  AcademicFactoryDependencyGraph({
    required List<AcademicFactoryJob> jobs,
  }) : jobs = List<AcademicFactoryJob>.unmodifiable(jobs) {
    validateShapeOnly();
  }

  final List<AcademicFactoryJob> jobs;

  int get jobCount => jobs.length;

  Map<String, AcademicFactoryJob> get jobsById {
    final result = <String, AcademicFactoryJob>{};
    for (final job in jobs) {
      if (result.containsKey(job.jobId)) {
        throw FormatException('Duplicate jobId in graph: ${job.jobId}');
      }
      result[job.jobId] = job;
    }
    return Map<String, AcademicFactoryJob>.unmodifiable(result);
  }

  Set<String> get jobIds => Set<String>.unmodifiable(
        jobs.map((job) => job.jobId),
      );

  Set<String> get idempotencyKeys => Set<String>.unmodifiable(
        jobs.map((job) => job.idempotencyKey),
      );

  List<AcademicFactoryJob> jobsForTarget(String canonicalTargetId) {
    return jobs
        .where((job) => job.canonicalTargetId == canonicalTargetId)
        .toList(growable: false);
  }

  List<AcademicFactoryJob> jobsOfType(AcademicFactoryJobType type) {
    return jobs.where((job) => job.type == type).toList(growable: false);
  }

  bool containsJob(String jobId) => jobsById.containsKey(jobId);

  void validateShapeOnly() {
    if (jobs.isEmpty) {
      throw const FormatException(
        'AcademicFactoryDependencyGraph cannot be empty.',
      );
    }

    final ids = <String>{};
    final keys = <String>{};
    for (final job in jobs) {
      if (!ids.add(job.jobId)) {
        throw FormatException('Duplicate jobId in graph: ${job.jobId}');
      }
      if (!keys.add(job.idempotencyKey)) {
        throw FormatException(
          'Duplicate idempotencyKey in graph: ${job.idempotencyKey}',
        );
      }
    }
  }

  Map<String, Object?> toJson() {
    validateShapeOnly();
    return <String, Object?>{
      'jobs': jobs.map((job) => job.toJson()).toList(growable: false),
    };
  }

  factory AcademicFactoryDependencyGraph.fromJson(Map<String, Object?> json) {
    final rawJobs = json['jobs'];
    if (rawJobs is! List) {
      throw const FormatException(
        'AcademicFactoryDependencyGraph.jobs must be a List.',
      );
    }

    return AcademicFactoryDependencyGraph(
      jobs: rawJobs.map((value) {
        if (value is! Map) {
          throw const FormatException(
            'AcademicFactoryDependencyGraph job values must be maps.',
          );
        }
        return AcademicFactoryJob.fromJson(value.cast<String, Object?>());
      }).toList(growable: false),
    );
  }
}
