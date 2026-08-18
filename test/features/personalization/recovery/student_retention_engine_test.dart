import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_retention_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';

void main() {
  StudentEvidenceEvent e(int d) => StudentEvidenceEvent(
      eventId: 'e$d',
      studentId: 's',
      source: StudentEvidenceSource.revision,
      action: StudentEvidenceAction.answerSubmitted,
      occurredAtUtc: DateTime.utc(2026, 8, d),
      sourceConfidence: StudentEvidenceConfidence.high,
      difficulty: StudentEvidenceDifficulty.medium,
      answerOutcome: StudentAnswerOutcome.correct,
      schemaVersion: 2,
      amtnId: 'a',
      questionId: 'q$d',
      hintsUsed: 0,
      wasRetry: false,
      wasSkipped: false,
      wasExplanationOpened: false);
  test('retention uses successful retrieval evidence', () {
    final r = const StudentRetentionEngine().calculate(
        studentId: 's',
        amtnId: 'a',
        calculatedAtUtc: DateTime.utc(2026, 8, 20),
        events: [e(15), e(18)]);
    expect(r.probability, isNotNull);
    expect(r.eligibleEvidenceCount, 2);
  });
}
