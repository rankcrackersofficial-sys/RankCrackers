import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/node_runtime_state.dart';
import '../../../core/models/question_model.dart';
import '../../digibook/models/digibook_content.dart';

/// 🔱 BATTLE ENGINE
/// Orchestrates tactical combat. Now fully Atomic-Aware and Type-Safe.
class BattleEngine {
  // ===================================================
  // DYNAMIC WEAKNESS FORGE 🔱
  // ===================================================
  static List<QuestionModel> generateWeaknessCombat({
    required List<MicroTopicNode> weakNodes,
    required Map<String, NodeRuntimeState> states,
    required Map<String, DigiBookContent> contentMap, // 🔱 Document 46A: Decoupled content
    Map<String, List<String>> nodeRiskFacts = const {},
  }) {
    List<QuestionModel> combatSet = [];

    for (var node in weakNodes) {
      final state = states[node.id] ?? NodeRuntimeState(nodeId: node.id);
      final payload = contentMap[node.id];
      if (payload == null) continue;
      
      // 🔱 Identify Atomic Strike Pool
      final List<QuestionModel> allNodeQuestions = [
        ...payload.easyMcqs,
        ...payload.mediumMcqs,
        ...payload.hardMcqs,
      ];

      final targetedFactIds = nodeRiskFacts[node.id] ?? [];
      final targetedQuestions = allNodeQuestions
          .where((q) => targetedFactIds.contains(q.factId))
          .toList();

      if (targetedQuestions.isEmpty) {
        // Fallback Law: Revert to legacy node-level combat
        final pool = state.mastery < 0.3 ? payload.easyMcqs : payload.mediumMcqs;
        combatSet.addAll(pool.take(5));
      } else {
        // 🔱 Combat Composition Rule: 60% Targeted Strike, 40% Breadth Coverage
        targetedQuestions.shuffle();
        final List<QuestionModel> breadthPool = List.from(allNodeQuestions)..shuffle();

        const int targetCount = 3; 
        const int breadthCount = 2;

        // 1. Add targeted facts
        final selectedTargeted = targetedQuestions.take(targetCount).toList();
        combatSet.addAll(selectedTargeted);

        // 2. Fill breadth with general node questions
        final remainingBreadth = breadthPool
            .where((q) => !selectedTargeted.contains(q))
            .take(breadthCount);
        combatSet.addAll(remainingBreadth);
      }
    }

    return combatSet;
  }

  // ===================================================
  // CORE BATTLE LOGIC 🔱
  // ===================================================

  static MicroTopicNode? getPriorityNode(
    List<MicroTopicNode> nodes,
    Map<String, NodeRuntimeState> states, {
    double riskFactor = 0.0,
  }) {
    final activeNodes = nodes.where((n) {
      final state = states[n.id];
      return state == null || !state.completed;
    }).toList();

    if (activeNodes.isEmpty) {
      return null;
    }

    activeNodes.sort((a, b) {
      final aState = states[a.id] ?? NodeRuntimeState(nodeId: a.id);
      final bState = states[b.id] ?? NodeRuntimeState(nodeId: b.id);
      
      final aScore = _battleScore(a, aState, riskFactor: riskFactor);
      final bScore = _battleScore(b, bState, riskFactor: riskFactor);
      return bScore.compareTo(aScore);
    });

    return activeNodes.first;
  }

  static double _battleScore(
    MicroTopicNode node, 
    NodeRuntimeState state, {
    double riskFactor = 0.0
  }) {
    final baseScore = ((1 - state.mastery) * 50) +
        (node.importance * 3) +
        (node.difficulty * 2) +
        (state.revisionLevel * 2);

    final stabilizationBonus =
        (riskFactor * node.importance).clamp(0.0, 5.0);

    return baseScore + stabilizationBonus;
  }
}
