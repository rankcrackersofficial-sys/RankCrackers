import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import 'node_linker.dart';
import 'adaptive_mapper.dart';
import 'mastery_propagation_engine.dart';

/// 🔱 KNOWLEDGE GRAPH
/// Represents the universe of knowledge. Stores immutable content.
class KnowledgeGraph {
  static const double maxDangerScore = 10.0;

  final Map<String, MicroTopicNode> _nodes = {};
  late final NodeLinker linker;

  KnowledgeGraph(List<MicroTopicNode> initialNodes) {
    for (var node in initialNodes) {
      _nodes[node.id] = node;
    }
    linker = NodeLinker(this);
  }

  MicroTopicNode? getNode(String id) => _nodes[id];

  List<MicroTopicNode> get allNodes => _nodes.values.toList();

  List<MicroTopicNode> getNodesBySubject(String subjectId) {
    return _nodes.values.where((n) => n.subjectId == subjectId).toList();
  }

  List<MicroTopicNode> getNodesByChapter(String chapterId) {
    return _nodes.values.where((n) => n.chapterId == chapterId).toList();
  }

  // ===================================================
  // GRAPH QUERIES 🔱 (State-Aware via Mapper/Detector)
  // ===================================================

  List<MicroTopicNode> getLinkedNodes(String nodeId) {
    return linker.getRelated(nodeId);
  }

  List<MicroTopicNode> getRevisionChain(String nodeId, Map<String, NodeRuntimeState> states) {
    final mapper = AdaptiveMapper(this, states);
    return mapper.getRevisionChain(nodeId);
  }

  List<MicroTopicNode> getAdaptiveRecommendations(Map<String, NodeRuntimeState> states, {int limit = 5}) {
    final mapper = AdaptiveMapper(this, states);
    return mapper.getStudyRecommendations(limit: limit);
  }

  // ===================================================
  // PROPAGATION & RISK 🔱 (State-Aware)
  // ===================================================

  List<MicroTopicNode> getAffectedNodes(
    String nodeId,
    Map<String, NodeRuntimeState> states,
  ) {
    return MasteryPropagationEngine.getAffectedNodes(
      graph: this,
      nodeId: nodeId,
      states: states,
    );
  }

  double getCascadeRisk(
    String nodeId,
    Map<String, NodeRuntimeState> states,
  ) {
    final sourceNode = getNode(nodeId);
    if (sourceNode == null) return 0.0;

    final affected = getAffectedNodes(nodeId, states);

    return MasteryPropagationEngine.calculateCascadeRisk(
      node: sourceNode,
      affectedNodes: affected,
      states: states,
    );
  }

  /// 🔱 GLOBAL CASCADE RISK LAW
  /// Calculates the aggregate systemic risk of the entire knowledge graph.
  double getGlobalCascadeRisk(Map<String, NodeRuntimeState> states) {
    final allNodesList = allNodes;
    if (allNodesList.isEmpty) return 0.0;

    double peakSeverity = 0.0;
    final Set<String> uniqueAffectedIds = {};

    for (final node in allNodesList) {
      final state = states[node.id];
      // 🔱 Identify potential collapse sources (Weak Nodes)
      if (state != null && state.mastery < 0.50) {
        final nodeCascadeRisk = getCascadeRisk(node.id, states);
        if (nodeCascadeRisk > peakSeverity) {
          peakSeverity = nodeCascadeRisk;
        }

        final affected = getAffectedNodes(node.id, states);
        for (final aff in affected) {
          uniqueAffectedIds.add(aff.id);
        }
      }
    }

    final volumeFactor = (uniqueAffectedIds.length / allNodesList.length).clamp(0.0, 1.0);
    final peakFactor = (peakSeverity / maxDangerScore).clamp(0.0, 1.0);

    return ((peakFactor * 0.8) + (volumeFactor * 0.2)).clamp(0.0, 1.0);
  }
}
