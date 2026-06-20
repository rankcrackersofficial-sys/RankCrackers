import '../models/atomic_mastery_state.dart';

/// 🔱 MASTERY AGGREGATION ENGINE
/// Implements the Aggregation Law (Section 35, Document 33).
/// Derives higher-level competency metrics from Atomic Mastery.
class MasteryAggregationEngine {
  /// Aggregates a list of atomic mastery states into a single score.
  static double aggregate({
    required List<String> atomicTopicIds,
    required Map<String, AtomicMasteryState> atomicStates,
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

  /// Calculates aggregate confidence for a topic cluster.
  static double aggregateConfidence({
    required List<String> atomicTopicIds,
    required Map<String, AtomicMasteryState> atomicStates,
  }) {
    if (atomicTopicIds.isEmpty) return 0.0;

    double totalConfidence = 0.0;
    for (final id in atomicTopicIds) {
      totalConfidence += atomicStates[id]?.confidence ?? 0.0;
    }

    return totalConfidence / atomicTopicIds.length;
  }
}
