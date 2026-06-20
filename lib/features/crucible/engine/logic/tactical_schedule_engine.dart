import '../../../../core/models/micro_topic_node.dart';
import '../../../../core/models/node_runtime_state.dart';

/// 🔱 TACTICAL SCHEDULE ENGINE
/// Builds localized preparation schedules based on node importance and runtime mastery.
class TacticalScheduleEngine {
  static List<MicroTopicNode> build({
    required List<MicroTopicNode> nodes,
    required Map<String, NodeRuntimeState> states,
    required int maxTopics,
  }) {
    final availableNodes = nodes.where((e) {
      final state = states[e.id];
      return state == null || !state.completed;
    }).toList();

    availableNodes.sort((a, b) {
      final aState = states[a.id] ?? NodeRuntimeState(nodeId: a.id);
      final bState = states[b.id] ?? NodeRuntimeState(nodeId: b.id);
      
      final aScore = _scheduleScore(a, aState);
      final bScore = _scheduleScore(b, bState);

      return bScore.compareTo(aScore);
    });

    return availableNodes.take(maxTopics).toList();
  }

  static double _scheduleScore(
    MicroTopicNode node,
    NodeRuntimeState state,
  ) {
    return ((1.0 - state.mastery) * 50.0) +
        (node.importance * 3.0) +
        (node.difficulty * 2.0) +
        (state.revisionLevel * 2.0);
  }
}
