import 'package:flutter/foundation.dart';
import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import 'knowledge_graph.dart';

/// MASTERY PROPAGATION ENGINE
/// Handles recursive graph traversal for cascading risk and weakness mapping.
class MasteryPropagationEngine {
  // ===================================================
  // PROPAGATE WEAKNESS 
  // ===================================================

  /// Identifies all nodes affected by a source node's weakness.
  static List<MicroTopicNode> getAffectedNodes({
    required KnowledgeGraph graph,
    required String nodeId,
    required Map<String, NodeRuntimeState> states,
    int maxDepth = 3,
  }) {
    final Set<String> visited = {};
    final List<MicroTopicNode> affected = [];

    final sourceState = states[nodeId];
    if (sourceState == null || sourceState.mastery >= 0.50) return [];

    void traverse(String currentId, int currentDepth) {
      if (currentDepth >= maxDepth || visited.contains(currentId)) return;
      visited.add(currentId);

      final node = graph.getNode(currentId);
      if (node == null) {
        if (kDebugMode) {
          print("GRAPH INTEGRITY: Node $currentId not found. Skipping dependency.");
        }
        return;
      }

      for (final dependentId in node.dependentIds) {
        final dependent = graph.getNode(dependentId);
        if (dependent != null && !visited.contains(dependentId)) {
          affected.add(dependent);
          traverse(dependentId, currentDepth + 1);
        }
      }
    }

    traverse(nodeId, 0);
    affected.removeWhere((n) => n.id == nodeId);
    
    return affected;
  }

  // ===================================================
  // CASCADE RISK SCORE 
  // ===================================================

  /// Calculates the aggregate risk fallout if a specific node fails.
  static double calculateCascadeRisk({
    required MicroTopicNode node,
    required List<MicroTopicNode> affectedNodes,
    required Map<String, NodeRuntimeState> states,
  }) {
    if (affectedNodes.isEmpty) {
      return 0.0;
    }

    // Weighted Fallout Law: NodeDanger = (1 - Mastery) * Importance
    double totalFallout = 0.0;
    for (final affected in affectedNodes) {
      final state = states[affected.id] ?? NodeRuntimeState(nodeId: affected.id);
      totalFallout += (1.0 - state.mastery) * affected.importance;
    }

    return totalFallout / affectedNodes.length;
  }
}
