import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import 'knowledge_graph.dart';

/// WEAK NODE DETECTOR
/// Identifies knowledge gaps based on runtime mastery data.
class WeakNodeDetector {
  final KnowledgeGraph graph;
  final Map<String, NodeRuntimeState> states;

  WeakNodeDetector(this.graph, this.states);

  /// Returns all nodes currently marked as weak (Mastery < 50%).
  List<MicroTopicNode> getWeakNodes() {
    return graph.allNodes.where((node) {
      final state = states[node.id];
      return (state?.mastery ?? 0.0) < 0.50;
    }).toList();
  }

  /// Returns nodes that are dependents of the weak node.
  List<MicroTopicNode> getAffectedNodes(String nodeId) {
    final state = states[nodeId];
    if (state == null || state.mastery >= 0.50) return [];

    final node = graph.getNode(nodeId);
    if (node == null) return [];

    return node.dependentIds
        .map((id) => graph.getNode(id))
        .whereType<MicroTopicNode>()
        .toList();
  }

  /// Calculates a priority score for a node based on its weakness and importance.
  double getRebuildPriority(MicroTopicNode node) {
    final state = states[node.id];
    if (state == null || state.mastery >= 0.50) return 0.0;
    
    // Higher importance and lower mastery increases priority.
    return node.importance / (state.mastery + 0.1);
  }
}
