import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import '../services/knowledge_content_service.dart';

/// ATOMIC RISK ANALYZER
/// Detects deep-layer vulnerabilities at the physical knowledge atom level.
class AtomicRiskAnalyzer {
  
  /// DETECT ATOMIC LEAK
  /// Analyzes if specific facts within a node are causing a mastery collapse.
  static Future<Map<String, double>> analyzeNode(
    MicroTopicNode node,
    NodeRuntimeState state,
  ) async {
    final Map<String, double> factRisks = {};
    
    // 1. Summon the Atomic Layer
    final payload = await KnowledgeContentService.fetchContent(node.id);
    if (payload == null) return {};

    // Physical Ingestion Law
    // If overall mastery is low, every fact inherits a baseline risk.
    final baseRisk = (1.0 - state.mastery);

    for (final fact in payload.facts) {
      // Weighted Atom Risk
      // Risk = (Base Node Risk) * (Fact Importance)
      double risk = baseRisk * (fact.importance / 10.0);
      
      if (fact.isCore) {
        risk *= 1.2; // Constitutional multiplier for core truths
      }

      factRisks[fact.id] = risk.clamp(0.0, 1.0);
    }

    return factRisks;
  }
}
