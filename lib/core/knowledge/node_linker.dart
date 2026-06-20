import '../models/micro_topic_node.dart';
import 'knowledge_graph.dart';

/// 🔱 NODE LINKER
/// Handles relationship lookups and graph traversal.
class NodeLinker {
  final KnowledgeGraph graph;

  NodeLinker(this.graph);

  List<MicroTopicNode> getPrerequisites(String nodeId) {
    final node = graph.getNode(nodeId);
    if (node == null) return [];
    return node.prerequisiteIds
        .map((id) => graph.getNode(id))
        .whereType<MicroTopicNode>()
        .toList();
  }

  List<MicroTopicNode> getDependents(String nodeId) {
    final node = graph.getNode(nodeId);
    if (node == null) return [];
    return node.dependentIds
        .map((id) => graph.getNode(id))
        .whereType<MicroTopicNode>()
        .toList();
  }

  List<MicroTopicNode> getRelated(String nodeId) {
    final node = graph.getNode(nodeId);
    if (node == null) return [];
    return node.relatedIds
        .map((id) => graph.getNode(id))
        .whereType<MicroTopicNode>()
        .toList();
  }

  List<MicroTopicNode> getRevisionChain(String nodeId) {
    final node = graph.getNode(nodeId);
    if (node == null) return [];
    return node.revisionChainIds
        .map((id) => graph.getNode(id))
        .whereType<MicroTopicNode>()
        .toList();
  }

  // ===================================================
  // RECURSIVE TRAVERSAL 🔱
  // ===================================================

  /// Returns all prerequisites recursively up to a certain depth.
  List<MicroTopicNode> getAllPrerequisites(String nodeId, {int maxDepth = 5}) {
    final Set<String> visited = {};
    final List<MicroTopicNode> results = [];

    void traverse(String currentId, int depth) {
      if (depth >= maxDepth || visited.contains(currentId)) return;
      visited.add(currentId);

      final node = graph.getNode(currentId);
      if (node == null) return;

      for (final preId in node.prerequisiteIds) {
        final preNode = graph.getNode(preId);
        if (preNode != null) {
          if (!visited.contains(preId)) {
            results.add(preNode);
            traverse(preId, depth + 1);
          }
        }
      }
    }

    traverse(nodeId, 0);
    // Remove self from results
    results.removeWhere((n) => n.id == nodeId);
    return results;
  }

  /// Returns all dependents recursively up to a certain depth.
  List<MicroTopicNode> getAllDependents(String nodeId, {int maxDepth = 5}) {
    final Set<String> visited = {};
    final List<MicroTopicNode> results = [];

    void traverse(String currentId, int depth) {
      if (depth >= maxDepth || visited.contains(currentId)) return;
      visited.add(currentId);

      final node = graph.getNode(currentId);
      if (node == null) return;

      for (final depId in node.dependentIds) {
        final depNode = graph.getNode(depId);
        if (depNode != null) {
          if (!visited.contains(depId)) {
            results.add(depNode);
            traverse(depId, depth + 1);
          }
        }
      }
    }

    traverse(nodeId, 0);
    // Remove self from results
    results.removeWhere((n) => n.id == nodeId);
    return results;
  }
}
