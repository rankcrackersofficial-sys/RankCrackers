import '../models/micro_topic_node.dart';
import '../models/question_model.dart';
import '../services/knowledge_content_service.dart';

/// 🔱 DIAGNOSTIC ENGINE (Article 15 Hardened)
/// Sovereign authority for initial baseline verification.
class DiagnosticEngine {
  
  /// 🔱 SUMMON DIAGNOSTIC COMBAT
  /// Assembles a diagnostic test by summoning payloads for relevant nodes.
  static Future<List<QuestionModel>> generateDiagnostic({
    required List<MicroTopicNode> targetNodes,
    int totalQuestions = 50,
  }) async {
    List<QuestionModel> combatPool = [];
    
    // 1. Identify Eligibility (Article 15)
    final eligibleNodes = targetNodes.where((n) => n.isDiagnosticEligible).toList();
    
    if (eligibleNodes.isEmpty) return [];

    // 2. Fetch Payloads & Extract Questions
    for (final node in eligibleNodes) {
      final payload = await KnowledgeContentService.fetchContent(node.id);
      if (payload == null) continue;

      // 🔱 Weighted Diagnostic Law (Section 34)
      // Prioritize High PYQ Frequency nodes for baseline truth.
      if (node.pyqFrequency > 8) {
        combatPool.addAll(payload.diagnosticHard);
      } else if (node.pyqFrequency > 4) {
        combatPool.addAll(payload.diagnosticMedium);
      } else {
        combatPool.addAll(payload.diagnosticEasy);
      }
    }

    // 3. Precision Balancing
    combatPool.shuffle();
    return combatPool.take(totalQuestions).toList();
  }
}
