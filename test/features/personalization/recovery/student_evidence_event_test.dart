import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';

void main() {
  StudentEvidenceEvent baseEvent({
    StudentEvidenceAction action = StudentEvidenceAction.answerSubmitted,
    StudentAnswerOutcome outcome = StudentAnswerOutcome.correct,
    StudentEvidenceConfidence confidence = StudentEvidenceConfidence.high,
    String? questionId = 'q-1',
    String? amtnId = 'amtn-1',
    int? hintsUsed = 0,
    bool? wasRetry = false,
    bool? wasSkipped = false,
    bool? explanationOpened = false,
    int? activeDurationMs = 1000,
    int? expectedDurationMs = 1200,
  }) {
    return StudentEvidenceEvent(
      eventId: 'e-1',
      studentId: 's-1',
      missionId: 'jee_main_2026',
      source: StudentEvidenceSource.crucible,
      action: action,
      occurredAtUtc: DateTime.utc(2026, 8, 16, 10),
      sourceConfidence: confidence,
      difficulty: StudentEvidenceDifficulty.medium,
      answerOutcome: outcome,
      schemaVersion: StudentEvidenceEvent.currentSchemaVersion,
      amtnId: amtnId,
      questionId: questionId,
      activeDurationMs: activeDurationMs,
      expectedDurationMs: expectedDurationMs,
      hintsUsed: hintsUsed,
      wasRetry: wasRetry,
      wasSkipped: wasSkipped,
      wasExplanationOpened: explanationOpened,
    );
  }

  test('valid canonical evidence round-trips through JSON', () {
    final original = baseEvent();
    final restored = StudentEvidenceEvent.fromJson(original.toJson());

    expect(restored.eventId, original.eventId);
    expect(restored.studentId, original.studentId);
    expect(restored.missionId, original.missionId);
    expect(restored.amtnId, original.amtnId);
    expect(restored.questionId, original.questionId);
    expect(restored.answerOutcome, StudentAnswerOutcome.correct);
    expect(restored.occurredAtUtc.isUtc, isTrue);
  });

  test('independent attempt requires no hint explanation retry or skip', () {
    expect(baseEvent().isIndependentAttempt, isTrue);
    expect(baseEvent(hintsUsed: 1).isIndependentAttempt, isFalse);
    expect(baseEvent(explanationOpened: true).isIndependentAttempt, isFalse);
    expect(baseEvent(wasRetry: true).isIndependentAttempt, isFalse);
    expect(
        baseEvent(wasSkipped: true, outcome: StudentAnswerOutcome.unanswered)
            .isIndependentAttempt,
        isFalse);
  });

  test('non UTC timestamp fails closed', () {
    final event = StudentEvidenceEvent(
      eventId: 'e-2',
      studentId: 's-1',
      missionId: 'jee_main_2026',
      source: StudentEvidenceSource.practice,
      action: StudentEvidenceAction.answerSubmitted,
      occurredAtUtc: DateTime(2026, 8, 16, 10),
      sourceConfidence: StudentEvidenceConfidence.high,
      difficulty: StudentEvidenceDifficulty.medium,
      answerOutcome: StudentAnswerOutcome.correct,
      schemaVersion: StudentEvidenceEvent.currentSchemaVersion,
      amtnId: 'a',
      questionId: 'q',
    );

    expect(event.validate, throwsFormatException);
  });

  test('forbidden secret/answer metadata is rejected', () {
    final event = StudentEvidenceEvent(
      eventId: 'e-3',
      studentId: 's-1',
      missionId: 'jee_main_2026',
      source: StudentEvidenceSource.practice,
      action: StudentEvidenceAction.nodeOpened,
      occurredAtUtc: DateTime.utc(2026, 8, 16),
      sourceConfidence: StudentEvidenceConfidence.high,
      difficulty: StudentEvidenceDifficulty.unknown,
      answerOutcome: StudentAnswerOutcome.notApplicable,
      schemaVersion: StudentEvidenceEvent.currentSchemaVersion,
      amtnId: 'a',
      metadata: const {'answer_key': 'A'},
    );

    expect(event.validate, throwsFormatException);
  });
}
