import '../models/atomic_mastery_state.dart';
import '../models/atomic_coverage_state.dart';
import '../models/atomic_risk_state.dart';
import '../models/micro_topic_node.dart';

/// 🔱 HIERARCHICAL AGGREGATION ENGINE
/// Implements the "Atomic -> Micro -> Macro -> Subject -> Mission" Aggregation Chain.
/// Compliant with Document 30, 33, 34, and 35.
class HierarchicalAggregationEngine {
  
  // ===================================================
  // MASTERY AGGREGATION 🔱
  // ===================================================

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
  // COVERAGE AGGREGATION 🔱
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
  // RISK AGGREGATION 🔱
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
  // INTERNAL UTILITIES 🔱
  // ===================================================

  static String _getMacroId(MicroTopicNode node) {
    // Currently deriving Macro ID from Chapter ID if not explicitly present
    return node.chapterId;
  }
}
