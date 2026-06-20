import 'test_question.dart';

class TestSession {
  final String id;
  final String title;
  final int durationMinutes;
  final List<TestQuestion> questions;
  final DateTime startTime;

  const TestSession({
    required this.id,
    required this.title,
    required this.durationMinutes,
    required this.questions,
    required this.startTime,
  });
}
