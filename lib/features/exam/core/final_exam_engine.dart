import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/question_model.dart';
import '../models/exam_pattern.dart';
import '../models/final_exam.dart';
import '../../digibook/models/digibook_content.dart';

/// 🔱 FINAL EXAM ENGINE
/// Compiles subject-balanced exams based on mission patterns.
class FinalExamEngine {
  // ===================================================
  // GENERATE FINAL EXAM
  // ===================================================
  static FinalExam generate({
    required String examName,
    required List<ExamPattern> patterns,
    required List<MicroTopicNode> nodes,
    required Map<String, DigiBookContent> contentMap, // 🔱 Decoupled
  }) {
    final questions = <QuestionModel>[];
    final used = <String>{};

    for (final pattern in patterns) {
      final subjectNodes = nodes.where((e) {
        return e.subjectId == pattern.subject;
      }).toList();

      final subjectQuestions = _collectQuestions(
        nodes: subjectNodes,
        total: pattern.questions,
        used: used,
        contentMap: contentMap,
      );

      questions.addAll(subjectQuestions);
    }

    return FinalExam(
      examName: examName,
      totalQuestions: questions.length,
      durationMinutes: 120,
      questions: questions,
    );
  }

  // ===================================================
  // COLLECT QUESTIONS
  // ===================================================
  static List<QuestionModel> _collectQuestions({
    required List<MicroTopicNode> nodes,
    required int total,
    required Set<String> used,
    required Map<String, DigiBookContent> contentMap,
  }) {
    final result = <QuestionModel>[];

    for (final node in nodes) {
      final payload = contentMap[node.id];
      if (payload == null) continue;

      // 🔱 Aggregate all MCQ layers for final exam pool
      final pool = [
        ...payload.easyMcqs,
        ...payload.mediumMcqs,
        ...payload.hardMcqs,
      ];

      for (final mcq in pool) {
        if (result.length >= total) {
          break;
        }
        if (used.contains(mcq.id)) {
          continue;
        }
        used.add(mcq.id);
        result.add(mcq);
      }
    }

    return result;
  }
}
