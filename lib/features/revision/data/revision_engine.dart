import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/node_runtime_state.dart';

/// 🔱 REVISION ENGINE
/// Identifies nodes that require immediate or standard revision.
class RevisionEngine {
  static List<MicroTopicNode> getRevisionNodes(
    List<MicroTopicNode> nodes,
    Map<String, NodeRuntimeState> states,
  ) {
    return nodes.where((n) {
      final state = states[n.id];
      return (state?.mastery ?? 0.0) < 0.8;
    }).toList();
  }

  static bool shouldRebuild(String nodeId, Map<String, NodeRuntimeState> states) {
    final state = states[nodeId];
    return (state?.mastery ?? 0.0) < 0.6;
  }
}
