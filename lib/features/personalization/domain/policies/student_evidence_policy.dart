/// RankCrackers governed Student Evidence Policy.
///
/// CODE NO: PERS-03-R2
///
/// PURPOSE:
/// Decide whether one canonical [StudentEvidenceEvent] is eligible for
/// downstream personalization calculations.
///
/// ARCHITECTURE:
/// - pure deterministic domain policy;
/// - no persistence;
/// - no AI/LLM;
/// - no psychological/personality profiling;
/// - no academic-content generation;
/// - no synthetic evidence.
///
/// FAIL-CLOSED RULE:
/// Missing, assisted, low-trust, or semantically incompatible evidence is
/// excluded from the affected calculation rather than silently promoted.
library;

import '../models/student_evidence_event.dart';

enum StudentEvidenceUse {
  mastery,
  retention,
  fluency,
  prerequisite,
}

enum StudentEvidenceExclusionReason {
  none,
  missingAcademicCoordinate,
  missingQuestionIdentity,
  incompatibleAction,
  unsupportedOutcome,
  skipped,
  hinted,
  explanationAssisted,
  retryAttempt,
  partialAnswer,
  unanswered,
  notApplicableOutcome,
  insufficientSourceConfidence,
  missingActiveDuration,
  missingTrustedTimingBaseline,
  invalidTimingBaseline,
}

final class StudentEvidenceEligibility {
  const StudentEvidenceEligibility._({
    required this.use,
    required this.eligible,
    required this.reason,
  });

  factory StudentEvidenceEligibility.allowed(
    StudentEvidenceUse use,
  ) {
    return StudentEvidenceEligibility._(
      use: use,
      eligible: true,
      reason: StudentEvidenceExclusionReason.none,
    );
  }

  factory StudentEvidenceEligibility.blocked(
    StudentEvidenceUse use,
    StudentEvidenceExclusionReason reason,
  ) {
    if (reason == StudentEvidenceExclusionReason.none) {
      throw const FormatException(
        'Blocked evidence eligibility requires an exclusion reason.',
      );
    }

    return StudentEvidenceEligibility._(
      use: use,
      eligible: false,
      reason: reason,
    );
  }

  final StudentEvidenceUse use;
  final bool eligible;
  final StudentEvidenceExclusionReason reason;

  void validate() {
    if (eligible && reason != StudentEvidenceExclusionReason.none) {
      throw const FormatException(
        'Eligible evidence cannot carry an exclusion reason.',
      );
    }

    if (!eligible && reason == StudentEvidenceExclusionReason.none) {
      throw const FormatException(
        'Blocked evidence must carry an exclusion reason.',
      );
    }
  }
}

/// Deterministic evidence-governance authority.
///
/// Important distinction:
/// eligibility != score.
///
/// This policy never calculates mastery, retention, fluency, prerequisite
/// readiness, treatment, route, or student psychology.
final class StudentEvidencePolicy {
  const StudentEvidencePolicy();

  StudentEvidenceEligibility evaluate(
    StudentEvidenceEvent event,
    StudentEvidenceUse use,
  ) {
    event.validate();

    switch (use) {
      case StudentEvidenceUse.mastery:
        return _forMastery(event);
      case StudentEvidenceUse.retention:
        return _forRetention(event);
      case StudentEvidenceUse.fluency:
        return _forFluency(event);
      case StudentEvidenceUse.prerequisite:
        return _forPrerequisite(event);
    }
  }

  bool isEligible(
    StudentEvidenceEvent event,
    StudentEvidenceUse use,
  ) =>
      evaluate(event, use).eligible;

  StudentEvidenceEligibility _forMastery(
    StudentEvidenceEvent event,
  ) {
    final coordinate = _requireAcademicCoordinate(
      event,
      StudentEvidenceUse.mastery,
    );
    if (coordinate != null) {
      return coordinate;
    }

    final question = _requireQuestionIdentity(
      event,
      StudentEvidenceUse.mastery,
    );
    if (question != null) {
      return question;
    }

    if (event.action != StudentEvidenceAction.answerSubmitted) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.mastery,
        StudentEvidenceExclusionReason.incompatibleAction,
      );
    }

    final independence = _requireIndependentFirstPass(
      event,
      StudentEvidenceUse.mastery,
    );
    if (independence != null) {
      return independence;
    }

    final confidence = _requireTrustedConfidence(
      event,
      StudentEvidenceUse.mastery,
    );
    if (confidence != null) {
      return confidence;
    }

    switch (event.answerOutcome) {
      case StudentAnswerOutcome.correct:
      case StudentAnswerOutcome.incorrect:
        return StudentEvidenceEligibility.allowed(
          StudentEvidenceUse.mastery,
        );

      case StudentAnswerOutcome.partiallyCorrect:
        return StudentEvidenceEligibility.blocked(
          StudentEvidenceUse.mastery,
          StudentEvidenceExclusionReason.partialAnswer,
        );

      case StudentAnswerOutcome.unanswered:
        return StudentEvidenceEligibility.blocked(
          StudentEvidenceUse.mastery,
          StudentEvidenceExclusionReason.unanswered,
        );

      case StudentAnswerOutcome.notApplicable:
        return StudentEvidenceEligibility.blocked(
          StudentEvidenceUse.mastery,
          StudentEvidenceExclusionReason.notApplicableOutcome,
        );
    }
  }

  StudentEvidenceEligibility _forRetention(
    StudentEvidenceEvent event,
  ) {
    final coordinate = _requireAcademicCoordinate(
      event,
      StudentEvidenceUse.retention,
    );
    if (coordinate != null) {
      return coordinate;
    }

    final confidence = _requireTrustedConfidence(
      event,
      StudentEvidenceUse.retention,
    );
    if (confidence != null) {
      return confidence;
    }

    // Passive exposure must never become retention proof.
    switch (event.action) {
      case StudentEvidenceAction.nodeOpened:
      case StudentEvidenceAction.learningBlockViewed:
      case StudentEvidenceAction.questionPresented:
      case StudentEvidenceAction.explanationOpened:
      case StudentEvidenceAction.hintRequested:
      case StudentEvidenceAction.retryStarted:
      case StudentEvidenceAction.revisionStarted:
      case StudentEvidenceAction.doubtRaised:
      case StudentEvidenceAction.doubtResolved:
      case StudentEvidenceAction.sessionAbandoned:
      case StudentEvidenceAction.answerChanged:
        return StudentEvidenceEligibility.blocked(
          StudentEvidenceUse.retention,
          StudentEvidenceExclusionReason.incompatibleAction,
        );

      case StudentEvidenceAction.answerSubmitted:
      case StudentEvidenceAction.retrySubmitted:
      case StudentEvidenceAction.questionSkipped:
      case StudentEvidenceAction.nodeCompleted:
      case StudentEvidenceAction.revisionCompleted:
      case StudentEvidenceAction.diagnosticCompleted:
      case StudentEvidenceAction.mentorVerified:
        break;
    }

    if (event.wasSkipped == true ||
        event.action == StudentEvidenceAction.questionSkipped) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.retention,
        StudentEvidenceExclusionReason.skipped,
      );
    }

    if (event.answerOutcome == StudentAnswerOutcome.partiallyCorrect) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.retention,
        StudentEvidenceExclusionReason.partialAnswer,
      );
    }

    if (event.answerOutcome == StudentAnswerOutcome.unanswered) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.retention,
        StudentEvidenceExclusionReason.unanswered,
      );
    }

    // Retention can be evidenced by independent successful retrieval or a
    // governed completion/verification event. Assisted question attempts do
    // not count as retained retrieval.
    if (event.action == StudentEvidenceAction.answerSubmitted ||
        event.action == StudentEvidenceAction.retrySubmitted) {
      final question = _requireQuestionIdentity(
        event,
        StudentEvidenceUse.retention,
      );
      if (question != null) {
        return question;
      }

      final independence = _requireIndependentFirstPass(
        event,
        StudentEvidenceUse.retention,
      );
      if (independence != null) {
        return independence;
      }

      if (event.answerOutcome != StudentAnswerOutcome.correct) {
        return StudentEvidenceEligibility.blocked(
          StudentEvidenceUse.retention,
          StudentEvidenceExclusionReason.unsupportedOutcome,
        );
      }
    }

    return StudentEvidenceEligibility.allowed(
      StudentEvidenceUse.retention,
    );
  }

  StudentEvidenceEligibility _forFluency(
    StudentEvidenceEvent event,
  ) {
    final coordinate = _requireAcademicCoordinate(
      event,
      StudentEvidenceUse.fluency,
    );
    if (coordinate != null) {
      return coordinate;
    }

    final question = _requireQuestionIdentity(
      event,
      StudentEvidenceUse.fluency,
    );
    if (question != null) {
      return question;
    }

    if (event.action != StudentEvidenceAction.answerSubmitted) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.fluency,
        StudentEvidenceExclusionReason.incompatibleAction,
      );
    }

    final independence = _requireIndependentFirstPass(
      event,
      StudentEvidenceUse.fluency,
    );
    if (independence != null) {
      return independence;
    }

    final confidence = _requireTrustedConfidence(
      event,
      StudentEvidenceUse.fluency,
    );
    if (confidence != null) {
      return confidence;
    }

    if (event.answerOutcome != StudentAnswerOutcome.correct &&
        event.answerOutcome != StudentAnswerOutcome.incorrect) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.fluency,
        StudentEvidenceExclusionReason.unsupportedOutcome,
      );
    }

    if (event.activeDurationMs == null) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.fluency,
        StudentEvidenceExclusionReason.missingActiveDuration,
      );
    }

    if (event.expectedDurationMs == null) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.fluency,
        StudentEvidenceExclusionReason.missingTrustedTimingBaseline,
      );
    }

    if (event.expectedDurationMs! <= 0) {
      return StudentEvidenceEligibility.blocked(
        StudentEvidenceUse.fluency,
        StudentEvidenceExclusionReason.invalidTimingBaseline,
      );
    }

    return StudentEvidenceEligibility.allowed(
      StudentEvidenceUse.fluency,
    );
  }

  StudentEvidenceEligibility _forPrerequisite(
    StudentEvidenceEvent event,
  ) {
    final coordinate = _requireAcademicCoordinate(
      event,
      StudentEvidenceUse.prerequisite,
    );
    if (coordinate != null) {
      return coordinate;
    }

    final confidence = _requireTrustedConfidence(
      event,
      StudentEvidenceUse.prerequisite,
    );
    if (confidence != null) {
      return confidence;
    }

    switch (event.action) {
      case StudentEvidenceAction.answerSubmitted:
      case StudentEvidenceAction.diagnosticCompleted:
      case StudentEvidenceAction.mentorVerified:
        break;

      case StudentEvidenceAction.nodeOpened:
      case StudentEvidenceAction.nodeCompleted:
      case StudentEvidenceAction.learningBlockViewed:
      case StudentEvidenceAction.questionPresented:
      case StudentEvidenceAction.answerChanged:
      case StudentEvidenceAction.hintRequested:
      case StudentEvidenceAction.explanationOpened:
      case StudentEvidenceAction.retryStarted:
      case StudentEvidenceAction.retrySubmitted:
      case StudentEvidenceAction.questionSkipped:
      case StudentEvidenceAction.sessionAbandoned:
      case StudentEvidenceAction.revisionStarted:
      case StudentEvidenceAction.revisionCompleted:
      case StudentEvidenceAction.doubtRaised:
      case StudentEvidenceAction.doubtResolved:
        return StudentEvidenceEligibility.blocked(
          StudentEvidenceUse.prerequisite,
          StudentEvidenceExclusionReason.incompatibleAction,
        );
    }

    if (event.action == StudentEvidenceAction.answerSubmitted) {
      final question = _requireQuestionIdentity(
        event,
        StudentEvidenceUse.prerequisite,
      );
      if (question != null) {
        return question;
      }

      final independence = _requireIndependentFirstPass(
        event,
        StudentEvidenceUse.prerequisite,
      );
      if (independence != null) {
        return independence;
      }

      if (event.answerOutcome != StudentAnswerOutcome.correct &&
          event.answerOutcome != StudentAnswerOutcome.incorrect) {
        return StudentEvidenceEligibility.blocked(
          StudentEvidenceUse.prerequisite,
          StudentEvidenceExclusionReason.unsupportedOutcome,
        );
      }
    }

    return StudentEvidenceEligibility.allowed(
      StudentEvidenceUse.prerequisite,
    );
  }

  StudentEvidenceEligibility? _requireAcademicCoordinate(
    StudentEvidenceEvent event,
    StudentEvidenceUse use,
  ) {
    if (!event.hasAcademicCoordinate) {
      return StudentEvidenceEligibility.blocked(
        use,
        StudentEvidenceExclusionReason.missingAcademicCoordinate,
      );
    }

    return null;
  }

  StudentEvidenceEligibility? _requireQuestionIdentity(
    StudentEvidenceEvent event,
    StudentEvidenceUse use,
  ) {
    if (!event.hasQuestionIdentity) {
      return StudentEvidenceEligibility.blocked(
        use,
        StudentEvidenceExclusionReason.missingQuestionIdentity,
      );
    }

    return null;
  }

  StudentEvidenceEligibility? _requireIndependentFirstPass(
    StudentEvidenceEvent event,
    StudentEvidenceUse use,
  ) {
    if (event.wasSkipped == true) {
      return StudentEvidenceEligibility.blocked(
        use,
        StudentEvidenceExclusionReason.skipped,
      );
    }

    if ((event.hintsUsed ?? 0) > 0) {
      return StudentEvidenceEligibility.blocked(
        use,
        StudentEvidenceExclusionReason.hinted,
      );
    }

    if (event.wasExplanationOpened == true) {
      return StudentEvidenceEligibility.blocked(
        use,
        StudentEvidenceExclusionReason.explanationAssisted,
      );
    }

    if (event.wasRetry == true ||
        event.action == StudentEvidenceAction.retrySubmitted) {
      return StudentEvidenceEligibility.blocked(
        use,
        StudentEvidenceExclusionReason.retryAttempt,
      );
    }

    return null;
  }

  StudentEvidenceEligibility? _requireTrustedConfidence(
    StudentEvidenceEvent event,
    StudentEvidenceUse use,
  ) {
    switch (event.sourceConfidence) {
      case StudentEvidenceConfidence.medium:
      case StudentEvidenceConfidence.high:
        return null;

      case StudentEvidenceConfidence.unknown:
      case StudentEvidenceConfidence.low:
        return StudentEvidenceEligibility.blocked(
          use,
          StudentEvidenceExclusionReason.insufficientSourceConfidence,
        );
    }
  }
}

extension StudentEvidenceUseWire on StudentEvidenceUse {
  String get wireName {
    switch (this) {
      case StudentEvidenceUse.mastery:
        return 'mastery';
      case StudentEvidenceUse.retention:
        return 'retention';
      case StudentEvidenceUse.fluency:
        return 'fluency';
      case StudentEvidenceUse.prerequisite:
        return 'prerequisite';
    }
  }
}

extension StudentEvidenceExclusionReasonWire on StudentEvidenceExclusionReason {
  String get wireName {
    switch (this) {
      case StudentEvidenceExclusionReason.none:
        return 'none';
      case StudentEvidenceExclusionReason.missingAcademicCoordinate:
        return 'missing_academic_coordinate';
      case StudentEvidenceExclusionReason.missingQuestionIdentity:
        return 'missing_question_identity';
      case StudentEvidenceExclusionReason.incompatibleAction:
        return 'incompatible_action';
      case StudentEvidenceExclusionReason.unsupportedOutcome:
        return 'unsupported_outcome';
      case StudentEvidenceExclusionReason.skipped:
        return 'skipped';
      case StudentEvidenceExclusionReason.hinted:
        return 'hinted';
      case StudentEvidenceExclusionReason.explanationAssisted:
        return 'explanation_assisted';
      case StudentEvidenceExclusionReason.retryAttempt:
        return 'retry_attempt';
      case StudentEvidenceExclusionReason.partialAnswer:
        return 'partial_answer';
      case StudentEvidenceExclusionReason.unanswered:
        return 'unanswered';
      case StudentEvidenceExclusionReason.notApplicableOutcome:
        return 'not_applicable_outcome';
      case StudentEvidenceExclusionReason.insufficientSourceConfidence:
        return 'insufficient_source_confidence';
      case StudentEvidenceExclusionReason.missingActiveDuration:
        return 'missing_active_duration';
      case StudentEvidenceExclusionReason.missingTrustedTimingBaseline:
        return 'missing_trusted_timing_baseline';
      case StudentEvidenceExclusionReason.invalidTimingBaseline:
        return 'invalid_timing_baseline';
    }
  }
}
