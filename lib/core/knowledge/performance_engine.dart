import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';

/// 🔱 PERFORMANCE ENGINE
/// Sovereign authority for preparation metrics. Decoupled from Content.
class PerformanceEngine {
  // ===================================================
  // OVERALL MASTERY 🔱
  // ===================================================
  static double calculateMastery(
    List<MicroTopicNode> nodes,
    Map<String, NodeRuntimeState> states,
  ) {
    if (nodes.isEmpty) return 0.0;

    double total = 0.0;
    for (final node in nodes) {
      final state = states[node.id];
      total += state?.mastery ?? 0.0;
    }

    return total / nodes.length;
  }

  // ===================================================
  // WEAK TOPICS 🔱
  // ===================================================
  static List<MicroTopicNode> getWeakTopics(
    List<MicroTopicNode> nodes,
    Map<String, NodeRuntimeState> states,
  ) {
    return nodes.where((node) {
      final state = states[node.id];
      return (state?.mastery ?? 0.0) < 0.60;
    }).toList();
  }

  // ===================================================
  // STRONG TOPICS 🔱
  // ===================================================
  static List<MicroTopicNode> getStrongTopics(
    List<MicroTopicNode> nodes,
    Map<String, NodeRuntimeState> states,
  ) {
    return nodes.where((node) {
      final state = states[node.id];
      return (state?.mastery ?? 0.0) > 0.85;
    }).toList();
  }
}
