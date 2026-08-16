/// Unlock decision contracts for AAF-002.
///
/// These objects are read-only decisions. They do not mutate jobs.
library;

final class AcademicFactoryUnlockDecision {
  const AcademicFactoryUnlockDecision({
    required this.jobId,
    required this.canUnlock,
    required this.reasonCode,
    required this.dependencyJobIds,
  });

  final String jobId;
  final bool canUnlock;
  final String reasonCode;
  final List<String> dependencyJobIds;

  Map<String, Object?> toJson() => <String, Object?>{
        'jobId': jobId,
        'canUnlock': canUnlock,
        'reasonCode': reasonCode,
        'dependencyJobIds': dependencyJobIds,
      };
}

final class AcademicFactoryUnlockPlan {
  AcademicFactoryUnlockPlan({
    required List<AcademicFactoryUnlockDecision> decisions,
    required this.maxParallelUnlocks,
  }) : decisions = List<AcademicFactoryUnlockDecision>.unmodifiable(
          decisions,
        ) {
    if (maxParallelUnlocks <= 0) {
      throw const FormatException('maxParallelUnlocks must be positive.');
    }
  }

  final List<AcademicFactoryUnlockDecision> decisions;
  final int maxParallelUnlocks;

  List<String> get unlockableJobIds => decisions
      .where((decision) => decision.canUnlock)
      .take(maxParallelUnlocks)
      .map((decision) => decision.jobId)
      .toList(growable: false);

  bool get hasUnlockableJobs => unlockableJobIds.isNotEmpty;

  Map<String, Object?> toJson() => <String, Object?>{
        'maxParallelUnlocks': maxParallelUnlocks,
        'unlockableJobIds': unlockableJobIds,
        'decisions': decisions
            .map((decision) => decision.toJson())
            .toList(growable: false),
      };
}
