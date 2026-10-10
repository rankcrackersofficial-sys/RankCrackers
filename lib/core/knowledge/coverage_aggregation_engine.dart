import '../models/atomic_coverage_state.dart';

/// COVERAGE AGGREGATION ENGINE
/// Implements the Aggregation Law (Section 35, Document 34).
/// Derives higher-level scope completion metrics from Atomic Coverage.
class CoverageAggregationEngine {
  /// Aggregates a list of atomic coverage states into a single score.
  static double aggregate({
    required List<String> atomicTopicIds,
    required Map<String, AtomicCoverageState> atomicStates,
  }) {
    if (atomicTopicIds.isEmpty) return 0.0;

    double totalScore = 0.0;
    int count = 0;

    for (final id in atomicTopicIds) {
      final state = atomicStates[id];
      if (state != null) {
        totalScore += state.score;
        count++;
      }
    }

    if (count == 0) return 0.0;
    return (totalScore / count) / 100.0; // Normalize back to 0.0 - 1.0
  }

  /// Calculates the percentage of unique topics that are verified.
  static double calculateVerifiedPercentage({
    required List<String> atomicTopicIds,
    required Map<String, AtomicCoverageState> atomicStates,
  }) {
    if (atomicTopicIds.isEmpty) return 0.0;

    int verifiedCount = 0;
    for (final id in atomicTopicIds) {
      if (atomicStates[id]?.status == 'Verified') {
        verifiedCount++;
      }
    }

    return verifiedCount / atomicTopicIds.length;
  }
}
