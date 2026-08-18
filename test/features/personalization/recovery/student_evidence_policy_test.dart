import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';
import 'package:rank_crackers/features/personalization/domain/policies/student_evidence_policy.dart';

void main() {
  const policy = StudentEvidencePolicy();

  StudentEvidenceEvent event({
    StudentEvidenceAction action = StudentEvidenceAction.answerSubmitted,
    StudentAnswerOutcome outcome = StudentAnswerOutcome.correct,
    StudentEvidenceConfidence confidence = StudentEvidenceConfidence.high,
    int hintsUsed = 0,
    bool wasRetry = false,
    bool wasSkipped = false,
    bool explanationOpened = false,
    String? amtnId = 'amtn-1',
    String? questionId = 'q-1',
    int? activeDurationMs = 900,
    int? expectedDurationMs = 1000,
  }) {
    return StudentEvidenceEvent(
      eventId: 'e-1',
      studentId: 's-1',
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

  test('independent correct/incorrect first pass is mastery eligible', () {
    expect(
      policy.evaluate(event(), StudentEvidenceUse.mastery).eligible,
      isTrue,
    );
    expect(
      policy
          .evaluate(
            event(outcome: StudentAnswerOutcome.incorrect),
            StudentEvidenceUse.mastery,
          )
          .eligible,
      isTrue,
    );
  });

  test('hinted attempt cannot become independent mastery', () {
    final result = policy.evaluate(
      event(hintsUsed: 1),
      StudentEvidenceUse.mastery,
    );
    expect(result.eligible, isFalse);
    expect(result.reason, StudentEvidenceExclusionReason.hinted);
  });

  test('explanation-assisted attempt cannot become mastery', () {
    final result = policy.evaluate(
      event(explanationOpened: true),
      StudentEvidenceUse.mastery,
    );
    expect(result.eligible, isFalse);
    expect(
      result.reason,
      StudentEvidenceExclusionReason.explanationAssisted,
    );
  });

  test('retry cannot masquerade as first-pass mastery', () {
    final result = policy.evaluate(
      event(wasRetry: true),
      StudentEvidenceUse.mastery,
    );
    expect(result.eligible, isFalse);
    expect(result.reason, StudentEvidenceExclusionReason.retryAttempt);
  });

  test('skipped attempt fails closed for mastery', () {
    final result = policy.evaluate(
      event(
        wasSkipped: true,
        outcome: StudentAnswerOutcome.unanswered,
      ),
      StudentEvidenceUse.mastery,
    );
    expect(result.eligible, isFalse);
    expect(result.reason, StudentEvidenceExclusionReason.skipped);
  });

  test('partial answer fails closed for mastery', () {
    final result = policy.evaluate(
      event(outcome: StudentAnswerOutcome.partiallyCorrect),
      StudentEvidenceUse.mastery,
    );
    expect(result.eligible, isFalse);
    expect(result.reason, StudentEvidenceExclusionReason.partialAnswer);
  });

  test('passive view is not retention evidence', () {
    final result = policy.evaluate(
      event(
        action: StudentEvidenceAction.learningBlockViewed,
        outcome: StudentAnswerOutcome.notApplicable,
        questionId: null,
      ),
      StudentEvidenceUse.retention,
    );
    expect(result.eligible, isFalse);
    expect(
      result.reason,
      StudentEvidenceExclusionReason.incompatibleAction,
    );
  });

  test('low and unknown confidence cannot silently become mastery', () {
    for (final confidence in <StudentEvidenceConfidence>[
      StudentEvidenceConfidence.low,
      StudentEvidenceConfidence.unknown,
    ]) {
      final result = policy.evaluate(
        event(confidence: confidence),
        StudentEvidenceUse.mastery,
      );
      expect(result.eligible, isFalse);
      expect(
        result.reason,
        StudentEvidenceExclusionReason.insufficientSourceConfidence,
      );
    }
  });

  test('low and unknown confidence cannot silently become retention', () {
    for (final confidence in <StudentEvidenceConfidence>[
      StudentEvidenceConfidence.low,
      StudentEvidenceConfidence.unknown,
    ]) {
      final result = policy.evaluate(
        event(confidence: confidence),
        StudentEvidenceUse.retention,
      );
      expect(result.eligible, isFalse);
      expect(
        result.reason,
        StudentEvidenceExclusionReason.insufficientSourceConfidence,
      );
    }
  });

  test('fluency requires active duration', () {
    final result = policy.evaluate(
      event(activeDurationMs: null),
      StudentEvidenceUse.fluency,
    );
    expect(result.eligible, isFalse);
    expect(
      result.reason,
      StudentEvidenceExclusionReason.missingActiveDuration,
    );
  });

  test('fluency requires trusted timing baseline', () {
    final result = policy.evaluate(
      event(expectedDurationMs: null),
      StudentEvidenceUse.fluency,
    );
    expect(result.eligible, isFalse);
    expect(
      result.reason,
      StudentEvidenceExclusionReason.missingTrustedTimingBaseline,
    );
  });

  test('valid first-pass timing evidence is fluency eligible', () {
    final result = policy.evaluate(
      event(activeDurationMs: 850, expectedDurationMs: 1000),
      StudentEvidenceUse.fluency,
    );
    expect(result.eligible, isTrue);
    expect(result.reason, StudentEvidenceExclusionReason.none);
  });

  test('missing academic coordinate fails closed', () {
    final result = policy.evaluate(
      event(amtnId: null),
      StudentEvidenceUse.mastery,
    );
    expect(result.eligible, isFalse);
    expect(
      result.reason,
      StudentEvidenceExclusionReason.missingAcademicCoordinate,
    );
  });
}
