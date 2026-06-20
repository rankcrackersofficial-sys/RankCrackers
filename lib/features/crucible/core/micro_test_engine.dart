import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/node_runtime_state.dart';
import '../../../core/models/question_model.dart';
import '../../digibook/models/digibook_content.dart';

/// 🔱 MICRO TEST ENGINE
/// Generates personalized assessment sets for specific node lists.
class MicroTestEngine {
  static List<QuestionModel> generateTest({
    required List<MicroTopicNode> nodes,
    required Map<String, NodeRuntimeState> states,
    required Map<String, DigiBookContent> contentMap, // 🔱 Document 46A
    int totalQuestions = 50,
  }) {
    final List<QuestionModel> questions = [];

    final sortedNodes = [...nodes]
      ..sort((a, b) {
        final stateA = states[a.id]?.mastery ?? 0.0;
        final stateB = states[b.id]?.mastery ?? 0.0;
        return stateA.compareTo(stateB);
      });

    for (final node in sortedNodes) {
      if (questions.length >= totalQuestions) {
        break;
      }

      final payload = contentMap[node.id];
      if (payload == null) continue;

      final state = states[node.id]?.mastery ?? 0.0;

      if (state < 0.30) {
        questions.addAll(payload.easyMcqs.take(10));
      } else if (state < 0.70) {
        questions.addAll(payload.mediumMcqs.take(8));
      } else {
        questions.addAll(payload.hardMcqs.take(5));
      }
    }

    questions.shuffle();
    return questions.take(totalQuestions).toList();
  }
}
