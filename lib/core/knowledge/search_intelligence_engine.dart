import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import 'knowledge_graph.dart';

/// SEARCH INTELLIGENCE ENGINE (Document 67 Compliant)
/// Sovereign authority for knowledge summoning and discovery.
class SearchIntelligenceEngine {
  final KnowledgeGraph graph;
  final Map<String, NodeRuntimeState> states;

  SearchIntelligenceEngine({
    required this.graph,
    required this.states,
  });

  /// SUMMON NODES (Graph-Aware Search)
  /// Performs fuzzy matching and enriches results with graph context.
  List<SearchResult> summon(String query) {
    if (query.isEmpty) return [];

    final normalizedQuery = query.toLowerCase();
    
    // 1. Fuzzy Title Match
    final matches = graph.allNodes.where((node) {
      return node.title.toLowerCase().contains(normalizedQuery) ||
             node.titleHindi.toLowerCase().contains(normalizedQuery) ||
             node.subjectId.toLowerCase().contains(normalizedQuery);
    }).toList();

    // 2. Enrich with Graph Context (Dependency Chain)
    return matches.map((node) {
      final state = states[node.id] ?? NodeRuntimeState(nodeId: node.id);
      
      return SearchResult(
        node: node,
        mastery: state.mastery,
        prerequisites: node.prerequisiteIds.map((id) => graph.getNode(id)?.title ?? '').where((t) => t.isNotEmpty).toList(),
        dependents: node.dependentIds.map((id) => graph.getNode(id)?.title ?? '').where((t) => t.isNotEmpty).toList(),
      );
    }).toList();
  }
}

class SearchResult {
  final MicroTopicNode node;
  final double mastery;
  final List<String> prerequisites;
  final List<String> dependents;

  SearchResult({
    required this.node,
    required this.mastery,
    required this.prerequisites,
    required this.dependents,
  });
}
