import '../../../core/models/question_model.dart';

/// 🔱 FINAL EXAM
/// Represents a compiled assessment for a specific mission.
class FinalExam {
  final String examName;
  final int totalQuestions;
  final int durationMinutes;
  final List<QuestionModel> questions;

  const FinalExam({
    required this.examName,
    required this.totalQuestions,
    required this.durationMinutes,
    required this.questions,
  });
}
