import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_fluency_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';

void main() {
  StudentEvidenceEvent e(int i) => StudentEvidenceEvent(
      eventId: 'e$i',
      studentId: 's',
      source: StudentEvidenceSource.crucible,
      action: StudentEvidenceAction.answerSubmitted,
      occurredAtUtc: DateTime.utc(2026, 8, 16, 10, i),
      sourceConfidence: StudentEvidenceConfidence.high,
      difficulty: StudentEvidenceDifficulty.medium,
      answerOutcome: StudentAnswerOutcome.correct,
      schemaVersion: 2,
      amtnId: 'a',
      questionId: 'q$i',
      activeDurationMs: 800,
      expectedDurationMs: 1000,
      hintsUsed: 0,
      wasRetry: false,
      wasSkipped: false,
      wasExplanationOpened: false);
  test('fast accurate pattern is detected from governed timing', () {
    final r = const StudentFluencyEngine().calculate(
        studentId: 's',
        amtnId: 'a',
        calculatedAtUtc: DateTime.utc(2026, 8, 17),
        events: [e(1), e(2), e(3)]);
    expect(r.pattern.name, 'fastAndAccurate');
  });
}
