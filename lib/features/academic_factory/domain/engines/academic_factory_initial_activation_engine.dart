/// Deterministic initial activation engine for the RankCrackers Autonomous Academic Factory.
///
/// CODE: AAF-003D
library;

import '../models/academic_factory_job.dart';
import '../models/academic_factory_types.dart';

final class AcademicFactoryInitialActivationEngine {
  const AcademicFactoryInitialActivationEngine();

  /// Activates planned jobs that have no dependencies (root jobs) to the ready state.
  ///
  /// Returns a new list of jobs with root jobs activated.
  /// Throws FormatException if invalid job objects are detected.
  List<AcademicFactoryJob> activate({
    required Iterable<AcademicFactoryJob> jobs,
    required DateTime eventAtUtc,
  }) {
    if (!eventAtUtc.isUtc) {
      throw const FormatException('eventAtUtc must be UTC.');
    }

    final activated = <AcademicFactoryJob>[];
    for (final job in jobs) {
      job.validate();

      if (job.state == AcademicFactoryJobState.planned &&
          job.dependencyJobIds.isEmpty) {
        activated.add(
          AcademicFactoryJob(
            jobId: job.jobId,
            runId: job.runId,
            missionId: job.missionId,
            canonicalTargetId: job.canonicalTargetId,
            type: job.type,
            state: AcademicFactoryJobState.ready,
            dependencyJobIds: job.dependencyJobIds,
            attemptCount: job.attemptCount,
            maxAttempts: job.maxAttempts,
            idempotencyKey: job.idempotencyKey,
            inputHash: job.inputHash,
            outputHash: job.outputHash,
            leaseOwner: job.leaseOwner,
            leaseExpiresAtUtc: job.leaseExpiresAtUtc,
            nextRetryAtUtc: job.nextRetryAtUtc,
            failureClass: job.failureClass,
            failureMessage: job.failureMessage,
            createdAtUtc: job.createdAtUtc,
            updatedAtUtc: eventAtUtc,
            schemaVersion: job.schemaVersion,
          ),
        );
      } else {
        activated.add(job);
      }
    }

    return List<AcademicFactoryJob>.unmodifiable(activated);
  }
}
