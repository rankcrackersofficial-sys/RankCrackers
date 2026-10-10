import '../models/atomic_mastery_state.dart';
import '../models/atomic_coverage_state.dart';
import '../models/atomic_risk_state.dart';
import '../models/micro_topic_node.dart';

/// Typed Domain Evidence Contract for Hierarchical Mastery Aggregation (A1)
/// Contains zero presentation or UI model dependencies.
class MasteryCoverageEvidence {
  final double demonstratedMastery;
  final bool hasEvidence;

  const MasteryCoverageEvidence({
    required this.demonstratedMastery,
    required this.hasEvidence,
  });
}

/// HIERARCHICAL AGGREGATION ENGINE
/// Implements the "Atomic -> Micro -> Macro -> Subject -> Mission" Aggregation Chain.
/// Compliant with Document 30, 33, 34, and 35.
class HierarchicalAggregationEngine {
  
  // ===================================================
  // MASTERY AGGREGATION 
  // ===================================================

  // ===================================================
  // TOPIC LEVEL MASTERY & COVERAGE (P0-A & P0-B)
  // ===================================================

  /// Checks if a node runtime state contains physical student evidence.
  static bool hasPhysicalEvidence(dynamic state) {
    if (state == null) return false;
    // Checks battlesWon/Lost, assessmentEvidence, readingEvidence, etc.
    final dynamic battlesWon = (state as dynamic).battlesWon ?? 0;
    final dynamic battlesLost = (state as dynamic).battlesLost ?? 0;
    final dynamic assessmentEvidence = (state as dynamic).assessmentEvidence ?? 0.0;
    final dynamic readingEvidence = (state as dynamic).readingEvidence ?? 0.0;
    final dynamic revisionEvidence = (state as dynamic).revisionEvidence ?? 0.0;
    final dynamic evidenceScore = (state as dynamic).evidenceScore ?? 0.0;
    final dynamic lastReviewed = (state as dynamic).lastReviewed;
    final dynamic lastStudiedAt = (state as dynamic).lastStudiedAt;

    return battlesWon > 0 ||
        battlesLost > 0 ||
        assessmentEvidence > 0 ||
        readingEvidence > 0 ||
        revisionEvidence > 0 ||
        evidenceScore > 0 ||
        lastReviewed != null ||
        lastStudiedAt != null;
  }

  /// Calculates demonstrated topic mastery from descendant Knowledge Nodes.
  /// Governed Law: Averages ONLY evidence-bearing descendant nodes.
  /// Unassessed descendant nodes do NOT artificially lower demonstrated mastery.
  static double calculateTopicMastery(
    List<MicroTopicNode> descendantAtoms,
    Map<String, dynamic> nodeStates,
  ) {
    if (descendantAtoms.isEmpty) return 0.0;

    double totalMastery = 0.0;
    int evidenceCount = 0;

    for (final atom in descendantAtoms) {
      final state = nodeStates[atom.id];
      if (state != null && hasPhysicalEvidence(state)) {
        totalMastery += (state.mastery as double);
        evidenceCount++;
      }
    }

    return evidenceCount == 0 ? 0.0 : totalMastery / evidenceCount;
  }

  /// Calculates topic coverage (proportion of descendant nodes with physical evidence).
  static double calculateTopicCoverage(
    List<MicroTopicNode> descendantAtoms,
    Map<String, dynamic> nodeStates,
  ) {
    if (descendantAtoms.isEmpty) return 0.0;

    int evidenceCount = 0;
    for (final atom in descendantAtoms) {
      final state = nodeStates[atom.id];
      if (state != null && hasPhysicalEvidence(state)) {
        evidenceCount++;
      }
    }

    return evidenceCount / descendantAtoms.length;
  }

  // ===================================================
  // UNIT & SUBJECT LEVEL EVIDENCE-AWARE AGGREGATION (R1-A, R1-B, R1-C & RESIDUAL A)
  // ===================================================

  /// Calculates demonstrated Unit mastery from typed domain topic evidence (A1 & A2).
  /// Governed Law: Averages ONLY topics that have physical evidence.
  /// Not Assessed Topics contribute to coverage denominator, NOT demonstrated mastery denominator.
  static double calculateUnitMastery(List<MasteryCoverageEvidence> topicEvidences) {
    if (topicEvidences.isEmpty) return 0.0;

    double totalMastery = 0.0;
    int assessedTopicCount = 0;

    for (final topic in topicEvidences) {
      if (topic.hasEvidence) {
        totalMastery += topic.demonstratedMastery;
        assessedTopicCount++;
      }
    }

    return assessedTopicCount == 0 ? 0.0 : totalMastery / assessedTopicCount;
  }

  /// Calculates Unit coverage (proportion of assessed topics in unit).
  static double calculateUnitCoverage(List<MasteryCoverageEvidence> topicEvidences) {
    if (topicEvidences.isEmpty) return 0.0;

    int assessedTopicCount = 0;
    for (final topic in topicEvidences) {
      if (topic.hasEvidence) {
        assessedTopicCount++;
      }
    }

    return assessedTopicCount / topicEvidences.length;
  }

  /// Calculates demonstrated Subject mastery directly from ALL descendant topic evidences across units (R1-C).
  /// Governed Law: Prevents unit-grouping weighting distortion.
  static double calculateSubjectMastery(List<MasteryCoverageEvidence> allTopicEvidencesInSubject) {
    return calculateUnitMastery(allTopicEvidencesInSubject);
  }

  /// Calculates Subject coverage (proportion of assessed topics across entire subject).
  static double calculateSubjectCoverage(List<MasteryCoverageEvidence> allTopicEvidencesInSubject) {
    return calculateUnitCoverage(allTopicEvidencesInSubject);
  }

  static double calculateMicroMastery(List<String> atomicIds, Map<String, AtomicMasteryState> states) {
    if (atomicIds.isEmpty) return 0.0;
    double total = 0.0;
    int count = 0;
    for (var id in atomicIds) {
      if (states.containsKey(id)) {
        total += states[id]!.score;
        count++;
      }
    }
    return count == 0 ? 0.0 : (total / count) / 100.0;
  }

  static Map<String, double> aggregateToMacroMastery(List<MicroTopicNode> nodes, Map<String, double> microMastery) {
    final Map<String, List<double>> macroGroups = {};
    for (var node in nodes) {
      final macroId = _getMacroId(node);
      macroGroups.putIfAbsent(macroId, () => []).add(microMastery[node.id] ?? 0.0);
    }
    return macroGroups.map((id, list) => MapEntry(id, list.reduce((a, b) => a + b) / list.length));
  }

  static Map<String, double> aggregateToSubjectMastery(List<MicroTopicNode> nodes, Map<String, double> microMastery) {
    final Map<String, List<double>> subjectGroups = {};
    for (var node in nodes) {
      subjectGroups.putIfAbsent(node.subjectId, () => []).add(microMastery[node.id] ?? 0.0);
    }
    return subjectGroups.map((id, list) => MapEntry(id, list.reduce((a, b) => a + b) / list.length));
  }

  static double aggregateToMissionMastery(Map<String, double> subjectMastery) {
    if (subjectMastery.isEmpty) return 0.0;
    return subjectMastery.values.reduce((a, b) => a + b) / subjectMastery.length;
  }

  // ===================================================
  // COVERAGE AGGREGATION 
  // ===================================================

  static double calculateMicroCoverage(List<String> atomicIds, Map<String, AtomicCoverageState> states) {
    if (atomicIds.isEmpty) return 0.0;
    double total = 0.0;
    int count = 0;
    for (var id in atomicIds) {
      if (states.containsKey(id)) {
        total += states[id]!.score;
        count++;
      }
    }
    return count == 0 ? 0.0 : (total / count) / 100.0;
  }

  static Map<String, double> aggregateToSubjectCoverage(List<MicroTopicNode> nodes, Map<String, double> microCoverage) {
    final Map<String, List<double>> subjectGroups = {};
    for (var node in nodes) {
      subjectGroups.putIfAbsent(node.subjectId, () => []).add(microCoverage[node.id] ?? 0.0);
    }
    return subjectGroups.map((id, list) => MapEntry(id, list.reduce((a, b) => a + b) / list.length));
  }

  static double aggregateToMissionCoverage(Map<String, double> subjectCoverage) {
    if (subjectCoverage.isEmpty) return 0.0;
    return subjectCoverage.values.reduce((a, b) => a + b) / subjectCoverage.length;
  }

  // ===================================================
  // RISK AGGREGATION 
  // ===================================================

  static double calculateMicroRisk(List<String> atomicIds, Map<String, AtomicRiskState> states) {
    if (atomicIds.isEmpty) return 0.0;
    double total = 0.0;
    int count = 0;
    for (var id in atomicIds) {
      if (states.containsKey(id)) {
        total += states[id]!.score;
        count++;
      }
    }
    return count == 0 ? 0.0 : (total / count) / 100.0;
  }

  // ===================================================
  // INTERNAL UTILITIES 
  // ===================================================

  static String _getMacroId(MicroTopicNode node) {
    // Currently deriving Macro ID from Chapter ID if not explicitly present
    return node.chapterId;
  }
}
