/// RankCrackers deterministic Student Revision Closed Loop Engine.
///
/// CODE NO: PERS-REV-01
///
/// This engine decides whether a revision route can be completed, kept as
/// evidence-needed, blocked by AAF version state, or idempotently ignored.
library;

import '../models/aaf_personalization_bridge.dart';
import '../models/student_evidence_event.dart';
import '../models/student_learning_state.dart';
import '../models/student_revision_event.dart';
import '../models/student_revision_queue.dart';

enum StudentRevisionCompletionDecision {
  evidenceNeeded,
  completed,
  duplicateCompletionIgnored,
  blockedByStaleAafVersion,
  blockedByIneligibleProjection,
}

enum RevisionTriggerType {
  weaknessDetected,
  retentionDecay,
}

enum RevisionItemPriority {
  critical,
  normal,
  maintenance,
}

final class StudentRevisionClosedLoopCandidate {
  const StudentRevisionClosedLoopCandidate({
    required this.studentId,
    required this.amtnId,
    required this.missionId,
    String? canonicalSemanticTopicId,
    required this.triggerType,
    required this.decayFactor,
    int? canonicalKnowledgeVersion,
    String? publicProjectionId,
    int? knowledgeVersion,
    String? projectionId,
    required this.currentLearningState,
  })  : canonicalSemanticTopicId = canonicalSemanticTopicId ?? 'topic1',
        canonicalKnowledgeVersion =
            canonicalKnowledgeVersion ?? knowledgeVersion ?? 1,
        publicProjectionId = publicProjectionId ?? projectionId ?? 'pub1';

  final String studentId;
  final String amtnId;
  final String missionId;
  final String canonicalSemanticTopicId;
  final RevisionTriggerType triggerType;
  final double decayFactor;
  final int canonicalKnowledgeVersion;
  final String publicProjectionId;
  final StudentLearningState currentLearningState;

  void validate() {
    StudentRevisionClosedLoopEngine._requireText(studentId, 'studentId');
    StudentRevisionClosedLoopEngine._requireText(amtnId, 'amtnId');
    StudentRevisionClosedLoopEngine._requireText(missionId, 'missionId');
    StudentRevisionClosedLoopEngine._requireText(
        canonicalSemanticTopicId, 'canonicalSemanticTopicId');
    StudentRevisionClosedLoopEngine._requireText(
        publicProjectionId, 'publicProjectionId');
    if (canonicalKnowledgeVersion <= 0) {
      throw const FormatException(
        'canonicalKnowledgeVersion must be positive.',
      );
    }
    if (decayFactor < 0.0 || decayFactor > 1.0) {
      throw const FormatException('decayFactor must be within [0, 1].');
    }
    currentLearningState.validate();
    if (currentLearningState.studentId != studentId ||
        currentLearningState.amtnId != amtnId ||
        currentLearningState.missionId != missionId) {
      throw const FormatException('Learning state identity mismatch.');
    }
  }
}

final class StudentRevisionClosedLoopResult {
  const StudentRevisionClosedLoopResult({
    required this.decision,
    required this.state,
    required this.createsQueueItem,
    required this.upgradesMastery,
  });

  final StudentRevisionCompletionDecision decision;
  final StudentRevisionQueueState state;
  final bool createsQueueItem;
  final bool upgradesMastery;
}

final class StudentRevisionClosedLoopEngine {
  const StudentRevisionClosedLoopEngine();

  List<StudentRevisionClosedLoopCandidate> filterAndDeduplicate(
    Iterable<StudentRevisionClosedLoopCandidate> rawCandidates,
  ) {
    final seen = <String>{};
    final unique = <StudentRevisionClosedLoopCandidate>[];
    for (final candidate in rawCandidates) {
      candidate.validate();
      final key = '${candidate.studentId}|${candidate.missionId}|${candidate.amtnId}|'
          '${candidate.canonicalKnowledgeVersion}|'
          '${candidate.publicProjectionId}';
      if (seen.add(key)) {
        unique.add(candidate);
      }
    }
    return List.unmodifiable(unique);
  }

  RevisionItemPriority computePriority(
    StudentRevisionClosedLoopCandidate candidate,
  ) {
    candidate.validate();
    if (candidate.triggerType == RevisionTriggerType.weaknessDetected ||
        candidate.decayFactor > 0.8) {
      return RevisionItemPriority.critical;
    }
    if (candidate.currentLearningState.retentionState ==
        StudentRetentionState.strong) {
      return RevisionItemPriority.maintenance;
    }
    return RevisionItemPriority.normal;
  }

  bool isDue(
    StudentRevisionClosedLoopCandidate candidate,
    DateTime nowUtc,
    DateTime reviewDueAtUtc,
  ) {
    candidate.validate();
    if (!nowUtc.isUtc || !reviewDueAtUtc.isUtc) {
      throw const FormatException('Revision timestamps must be UTC.');
    }
    return nowUtc.isAtSameMomentAs(reviewDueAtUtc) ||
        nowUtc.isAfter(reviewDueAtUtc);
  }

  StudentRevisionCompletionDecision evaluateRouteEligibility({
    required StudentRevisionClosedLoopCandidate candidate,
    required AafPersonalizationBridgeAuthority aafAuthority,
  }) {
    candidate.validate();

    if (aafAuthority.studentId != candidate.studentId ||
        aafAuthority.targetAmtnId != candidate.amtnId ||
        aafAuthority.missionId != candidate.missionId) {
      throw const FormatException('AAF revision route identity mismatch.');
    }

    if (aafAuthority.publicProjectionId != candidate.publicProjectionId) {
      return StudentRevisionCompletionDecision.blockedByIneligibleProjection;
    }

    if (aafAuthority.status != AafPublicProjectionStatus.current) {
      return StudentRevisionCompletionDecision.blockedByIneligibleProjection;
    }
    if (aafAuthority.canonicalKnowledgeVersion !=
        candidate.canonicalKnowledgeVersion) {
      return StudentRevisionCompletionDecision.blockedByStaleAafVersion;
    }

    aafAuthority.validate();
    return StudentRevisionCompletionDecision.evidenceNeeded;
  }

  StudentRevisionClosedLoopResult completeRevision({
    required StudentRevisionClosedLoopCandidate candidate,
    required AafPersonalizationBridgeAuthority aafAuthority,
    required StudentEvidenceEvent? evidenceEvent,
    required Set<String> completedRevisionEventIds,
  }) {
    final eligibility = evaluateRouteEligibility(
      candidate: candidate,
      aafAuthority: aafAuthority,
    );
    if (eligibility ==
        StudentRevisionCompletionDecision.blockedByIneligibleProjection) {
      return const StudentRevisionClosedLoopResult(
        decision:
            StudentRevisionCompletionDecision.blockedByIneligibleProjection,
        state: StudentRevisionQueueState.blockedByStaleAafVersion,
        createsQueueItem: false,
        upgradesMastery: false,
      );
    }
    if (eligibility ==
        StudentRevisionCompletionDecision.blockedByStaleAafVersion) {
      return const StudentRevisionClosedLoopResult(
        decision: StudentRevisionCompletionDecision.blockedByStaleAafVersion,
        state: StudentRevisionQueueState.blockedByStaleAafVersion,
        createsQueueItem: false,
        upgradesMastery: false,
      );
    }

    if (evidenceEvent == null) {
      return const StudentRevisionClosedLoopResult(
        decision: StudentRevisionCompletionDecision.evidenceNeeded,
        state: StudentRevisionQueueState.evidenceNeeded,
        createsQueueItem: false,
        upgradesMastery: false,
      );
    }

    evidenceEvent.validate();
    if (evidenceEvent.studentId != candidate.studentId ||
        evidenceEvent.missionId != candidate.missionId ||
        evidenceEvent.amtnId != candidate.amtnId) {
      throw const FormatException('Revision completion evidence mismatch.');
    }

    if (!_isCompletionEvidence(evidenceEvent)) {
      return const StudentRevisionClosedLoopResult(
        decision: StudentRevisionCompletionDecision.evidenceNeeded,
        state: StudentRevisionQueueState.evidenceNeeded,
        createsQueueItem: false,
        upgradesMastery: false,
      );
    }

    if (completedRevisionEventIds.contains(evidenceEvent.eventId)) {
      return const StudentRevisionClosedLoopResult(
        decision: StudentRevisionCompletionDecision.duplicateCompletionIgnored,
        state: StudentRevisionQueueState.completed,
        createsQueueItem: false,
        upgradesMastery: false,
      );
    }

    return StudentRevisionClosedLoopResult(
      decision: StudentRevisionCompletionDecision.completed,
      state: StudentRevisionQueueState.completed,
      createsQueueItem: true,
      upgradesMastery: _isIndependentRevisionCompletion(evidenceEvent),
    );
  }

  bool shouldInvalidate({
    required StudentRevisionClosedLoopCandidate candidate,
    required AafPersonalizationBridgeAuthority aafAuthority,
  }) {
    final decision = evaluateRouteEligibility(
      candidate: candidate,
      aafAuthority: aafAuthority,
    );
    return decision != StudentRevisionCompletionDecision.evidenceNeeded;
  }

  bool processCompletionEvidence({
    required StudentRevisionClosedLoopCandidate candidate,
    required StudentEvidenceEvent event,
  }) {
    candidate.validate();
    event.validate();
    if (event.studentId != candidate.studentId ||
        event.missionId != candidate.missionId ||
        event.amtnId != candidate.amtnId) {
      throw const FormatException('Evidence event identity mismatch.');
    }
    return _isCompletionEvidence(event) ||
        event.action == StudentEvidenceAction.diagnosticCompleted;
  }

  StudentRevisionEvent createRevisionEvent({
    required String revisionEventId,
    required StudentRevisionClosedLoopCandidate candidate,
    required StudentEvidenceEvent? evidenceEvent,
    required StudentRevisionCompletionDecision decision,
    required DateTime occurredAtUtc,
  }) {
    if (!occurredAtUtc.isUtc) {
      throw const FormatException('occurredAtUtc must be UTC.');
    }
    candidate.validate();
    final event = StudentRevisionEvent(
      revisionEventId: revisionEventId,
      studentId: candidate.studentId,
      amtnId: candidate.amtnId,
      canonicalSemanticTopicId: candidate.canonicalSemanticTopicId,
      canonicalKnowledgeVersion: candidate.canonicalKnowledgeVersion,
      publicProjectionId: candidate.publicProjectionId,
      occurredAtUtc: occurredAtUtc,
      outcome: _eventOutcomeFor(decision),
      evidenceEvent: evidenceEvent,
      assistedAttempt: _isAssisted(evidenceEvent),
      schemaVersion: StudentRevisionEvent.currentSchemaVersion,
    );
    event.validate();
    return event;
  }

  bool _isIndependentRevisionCompletion(StudentEvidenceEvent event) {
    if (event.isIndependentAttempt) {
      return true;
    }
    return event.action == StudentEvidenceAction.revisionCompleted &&
        event.answerOutcome == StudentAnswerOutcome.correct &&
        event.wasRetry != true &&
        event.wasSkipped != true &&
        (event.hintsUsed ?? 0) == 0 &&
        event.wasExplanationOpened != true;
  }

  bool _isCompletionEvidence(StudentEvidenceEvent event) {
    if (event.action == StudentEvidenceAction.revisionCompleted) {
      return event.answerOutcome == StudentAnswerOutcome.correct &&
          event.hasAcademicCoordinate;
    }
    if (event.action == StudentEvidenceAction.mentorVerified) {
      return event.answerOutcome == StudentAnswerOutcome.correct &&
          event.hasAcademicCoordinate;
    }
    return false;
  }

  bool _isAssisted(StudentEvidenceEvent? event) {
    if (event == null) {
      return false;
    }
    return (event.hintsUsed ?? 0) > 0 ||
        event.wasExplanationOpened == true ||
        event.wasRetry == true;
  }

  StudentRevisionEventOutcome _eventOutcomeFor(
    StudentRevisionCompletionDecision decision,
  ) {
    switch (decision) {
      case StudentRevisionCompletionDecision.completed:
      case StudentRevisionCompletionDecision.duplicateCompletionIgnored:
        return StudentRevisionEventOutcome.completed;
      case StudentRevisionCompletionDecision.evidenceNeeded:
        return StudentRevisionEventOutcome.evidenceNeeded;
      case StudentRevisionCompletionDecision.blockedByStaleAafVersion:
        return StudentRevisionEventOutcome.blockedByStaleAafVersion;
      case StudentRevisionCompletionDecision.blockedByIneligibleProjection:
        return StudentRevisionEventOutcome.blockedByIneligibleProjection;
    }
  }

  static void _requireText(String value, String field) {
    if (value.trim().isEmpty) {
      throw FormatException('$field must not be empty.');
    }
  }
}
