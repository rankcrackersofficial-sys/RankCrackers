import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/node_runtime_state.dart';

/// PRIORITY ENGINE
/// Ranks nodes based on strategic importance and preparation gaps.
class PriorityEngine {
  static List<MicroTopicNode> sort({
    required List<MicroTopicNode> nodes,
    required Map<String, NodeRuntimeState> states,
  }) {
    final list = nodes.toList();
    list.sort((a, b) {
      final stateA = states[a.id];
      final stateB = states[b.id];
      
      // Priority = Importance / (Mastery + epsilon)
      double pA = a.importance / ((stateA?.mastery ?? 0.0) + 0.1);
      double pB = b.importance / ((stateB?.mastery ?? 0.0) + 0.1);

      return pB.compareTo(pA);
    });
    return list;
  }
}
