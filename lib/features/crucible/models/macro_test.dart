class MacroTest {
  final String id;
  final int totalQuestions;
  final int durationMinutes;
  final List<Map<String, dynamic>> questions;

  const MacroTest({
    required this.id,
    required this.totalQuestions,
    required this.durationMinutes,
    required this.questions,
  });
}
