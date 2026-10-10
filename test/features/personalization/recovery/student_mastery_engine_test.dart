import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_mastery_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';

void main() {
  StudentEvidenceEvent e(int i, bool correct) => StudentEvidenceEvent(
        eventId: 'e$i',
        studentId: 's',
        missionId: 'jee_main_2026',
        source: StudentEvidenceSource.crucible,
        action: StudentEvidenceAction.answerSubmitted,
        occurredAtUtc: DateTime.utc(2026, 8, 16, 10, i),
        sourceConfidence: StudentEvidenceConfidence.high,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: correct
            ? StudentAnswerOutcome.correct
            : StudentAnswerOutcome.incorrect,
        schemaVersion: 3,
        amtnId: 'a',
        questionId: 'q$i',
        hintsUsed: 0,
        wasRetry: false,
        wasSkipped: false,
        wasExplanationOpened: false,
      );
  test('mastery becomes known after minimum independent evidence', () {
    final r = const StudentMasteryEngine().calculate(
      studentId: 's',
      amtnId: 'a',
      missionId: 'jee_main_2026',
      calculatedAtUtc: DateTime.utc(2026, 8, 17),
      events: [e(1, true), e(2, true), e(3, false)],
    );
    expect(r.probability, isNotNull);
    expect(r.eligibleEvidenceCount, 3);
  });
  test('hinted evidence is excluded', () {
    final x = e(1, true);
    final hinted = StudentEvidenceEvent(
      eventId: x.eventId,
      studentId: x.studentId,
      missionId: x.missionId,
      source: x.source,
      action: x.action,
      occurredAtUtc: x.occurredAtUtc,
      sourceConfidence: x.sourceConfidence,
      difficulty: x.difficulty,
      answerOutcome: x.answerOutcome,
      schemaVersion: x.schemaVersion,
      amtnId: x.amtnId,
      questionId: x.questionId,
      hintsUsed: 1,
      wasRetry: false,
      wasSkipped: false,
      wasExplanationOpened: false,
    );
    final r = const StudentMasteryEngine().calculate(
        studentId: 's',
        amtnId: 'a',
        missionId: 'jee_main_2026',
        calculatedAtUtc: DateTime.utc(2026, 8, 17),
        events: [hinted]);
    expect(r.eligibleEvidenceCount, 0);
  });
}
