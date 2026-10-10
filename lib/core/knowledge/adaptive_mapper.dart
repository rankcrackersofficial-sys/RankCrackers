import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import 'knowledge_graph.dart';
import 'weak_node_detector.dart';

/// ADAPTIVE MAPPER
/// Generates personalized study paths and recommendations based on runtime states.
class AdaptiveMapper {
  final KnowledgeGraph graph;
  final Map<String, NodeRuntimeState> states;
  late final WeakNodeDetector detector;

  AdaptiveMapper(this.graph, this.states) {
    detector = WeakNodeDetector(graph, states);
  }

  /// Recommends topics for the user to study next using weighted fusion.
  /// FORMULA: (CascadeRisk * 40%) + (MasteryGap * 35%) + (Importance * 25%)
  List<MicroTopicNode> getStudyRecommendations({int limit = 5}) {
    final allNodes = graph.allNodes;
    if (allNodes.isEmpty) return [];

    final List<MapEntry<MicroTopicNode, double>> scoredNodes = [];

    for (final node in allNodes) {
      final state = states[node.id] ?? NodeRuntimeState(nodeId: node.id);
      
      // 1. Cascade Risk (Sovereign Danger)
      final double cascadeRisk = graph.getCascadeRisk(node.id, states);
      
      // 2. Mastery Gap (Internal Weakness)
      final double masteryGap = 1.0 - state.mastery;

      // 3. Selection Impact (Article 11)
      final double selectionImpact = node.importance / 10.0;

      final double score = 
          (cascadeRisk * 0.40) + 
          (masteryGap * 0.35) + 
          (selectionImpact * 0.25);

      scoredNodes.add(MapEntry(node, score));
    }

    // Sort by descending score (Highest Risk/Impact first)
    scoredNodes.sort((a, b) => b.value.compareTo(a.value));

    return scoredNodes.map((e) => e.key).take(limit).toList();
  }

  /// Finds a "Revision Chain" for a specific node to reinforce learning.
  List<MicroTopicNode> getRevisionChain(String nodeId) {
    final node = graph.getNode(nodeId);
    if (node == null) return [];

    final List<MicroTopicNode> chain = [];
    
    // Include prerequisites if they are not mastered according to runtime state.
    for (var preId in node.prerequisiteIds) {
      final preNode = graph.getNode(preId);
      final preState = states[preId];
      if (preNode != null && (preState?.mastery ?? 0.0) < 0.8) {
        chain.add(preNode);
      }
    }
    
    chain.add(node);
    return chain;
  }
}
