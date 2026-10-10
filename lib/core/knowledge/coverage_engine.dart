import '../models/coverage_state.dart';
import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import '../models/atomic_coverage_state.dart';

/// COVERAGE ENGINE (Document 34 Compliant)
/// Sovereign authority for syllabus completion measurement.
class CoverageEngine {
  
  // ===================================================
  // ATOMIC COVERAGE CALCULATION 
  // ===================================================

  /// Calculates the coverage score for a single knowledge atom.
  static AtomicCoverageState calculateAtomic({
    required String atomicTopicId,
    required double readingEvidence,    // Article 7: Replaces generic schedule completion
    required double assessmentEvidence, // Article 7: Replaces generic assessment evidence
    required double revisionEvidence,   // Article 7: Added for stability
    AtomicCoverageState? previousState,
  }) {
    // CONSTITUTIONAL MODEL (Redefined for Article 7)
    final double score = 
        (readingEvidence * 0.35) + 
        (assessmentEvidence * 0.45) + 
        (revisionEvidence * 0.20);

    final clampedScore = score.clamp(0.0, 1.0);

    return AtomicCoverageState(
      atomicTopicId: atomicTopicId,
      score: clampedScore * 100,
      status: _determineStatus(clampedScore),
      trend: _determineTrend(clampedScore, (previousState?.score ?? 0) / 100),
      verificationScore: readingEvidence, // Audit Fix: Using physical evidence for verification
      lastEvidenceAt: DateTime.now(),
    );
  }

  // ===================================================
  // MISSION COVERAGE CALCULATION 
  // ===================================================

  static CoverageState calculate({
    required String examId,
    String? variantId,
    required List<MicroTopicNode> nodes,
    required Map<String, NodeRuntimeState> states,
    required Map<String, AtomicCoverageState> atomicStates,
  }) {
    if (nodes.isEmpty) {
      return CoverageState(
        examId: examId,
        variantId: variantId,
        totalNodes: 0,
        completedNodes: 0,
        masteredNodes: 0,
        weakNodes: 0,
        coveragePercent: 0,
        uncoveredNodeIds: const [],
        weakNodeIds: const [],
      );
    }

    // 1. Aggregate Atomic Coverage (Section 35)
    // Mission Coverage derives from the average of all constituent atomic states.
    double totalAtomicScore = 0.0;
    int totalAtoms = 0;

    for (final node in nodes) {
      for (final atomicId in node.atomicTopicIds) {
        final atomicState = atomicStates[atomicId];
        totalAtomicScore += (atomicState?.score ?? 0.0);
        totalAtoms++;
      }
    }

    // Fallback to node-level mastery if no atomic topics defined (Transition Bridge)
    final double missionCoverage = totalAtoms > 0 
        ? (totalAtomicScore / totalAtoms) / 100 
        : _calculateLegacyNodeCoverage(nodes, states);

    // 2. Performance Metadata
    final completedCount = nodes.where((n) => states[n.id]?.completed ?? false).length;
    final masteredCount = nodes.where((n) => (states[n.id]?.mastery ?? 0.0) >= 0.80).length;
    
    final weakNodeIds = nodes
        .where((n) => (states[n.id]?.mastery ?? 0.0) < 0.50)
        .map((n) => n.id)
        .toList();

    final uncoveredNodeIds = nodes
        .where((n) => !(states[n.id]?.completed ?? false))
        .map((n) => n.id)
        .toList();

    return CoverageState(
      examId: examId,
      variantId: variantId,
      totalNodes: nodes.length,
      completedNodes: completedCount,
      masteredNodes: masteredCount,
      weakNodes: weakNodeIds.length,
      coveragePercent: missionCoverage.clamp(0.0, 1.0),
      uncoveredNodeIds: uncoveredNodeIds,
      weakNodeIds: weakNodeIds,
    );
  }

  // ===================================================
  // UTILITIES 
  // ===================================================

  static String _determineStatus(double score) {
    if (score >= 0.90) return 'Verified';
    if (score >= 0.60) return 'Covered';
    if (score > 0.0) return 'In Progress';
    return 'Not Started';
  }

  static String _determineTrend(double current, double previous) {
    final diff = current - previous;
    if (diff > 0.10) return 'Accelerating';
    if (diff > 0.02) return 'Steady';
    if (diff > 0.0) return 'Slow';
    return 'Stalled';
  }

  static double _calculateLegacyNodeCoverage(List<MicroTopicNode> nodes, Map<String, NodeRuntimeState> states) {
    double total = 0.0;
    for (final node in nodes) {
      total += states[node.id]?.mastery ?? 0.0;
    }
    return total / nodes.length;
  }
}
