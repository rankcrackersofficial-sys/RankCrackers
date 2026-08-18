import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_revision_queue.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';

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
    required this.triggerType,
    required this.decayFactor,
    required this.knowledgeVersion,
    required this.projectionId,
    required this.currentLearningState,
  });

  final String studentId;
  final String amtnId;
  final RevisionTriggerType triggerType;
  final double decayFactor;
  final int knowledgeVersion;
  final String projectionId;
  final StudentLearningState currentLearningState;

  void validate() {
    if (studentId.trim().isEmpty ||
        amtnId.trim().isEmpty ||
        projectionId.trim().isEmpty ||
        knowledgeVersion <= 0) {
      throw const FormatException('Invalid revision closed-loop candidate.');
    }
    if (decayFactor < 0.0 || decayFactor > 1.0) {
      throw const FormatException('Decay factor must be between 0.0 and 1.0.');
    }
    if (currentLearningState.studentId != studentId ||
        currentLearningState.amtnId != amtnId) {
      throw const FormatException('Learning state identity mismatch.');
    }
  }
}

final class StudentRevisionClosedLoopEngine {
  const StudentRevisionClosedLoopEngine();

  List<StudentRevisionClosedLoopCandidate> filterAndDeduplicate(
    List<StudentRevisionClosedLoopCandidate> rawCandidates,
  ) {
    final seen = <String>{};
    final unique = <StudentRevisionClosedLoopCandidate>[];
    for (final c in rawCandidates) {
      c.validate();
      if (seen.add(c.amtnId)) {
        unique.add(c);
      }
    }
    return unique;
  }

  RevisionItemPriority computePriority(
    StudentRevisionClosedLoopCandidate candidate,
  ) {
    if (candidate.triggerType == RevisionTriggerType.weaknessDetected ||
        candidate.decayFactor > 0.8) {
      return RevisionItemPriority.critical;
    }
    if (candidate.currentLearningState.retentionState == StudentRetentionState.strong) {
      return RevisionItemPriority.maintenance;
    }
    return RevisionItemPriority.normal;
  }

  bool isDue(
    StudentRevisionClosedLoopCandidate candidate,
    DateTime nowUtc,
    DateTime reviewDueAtUtc,
  ) {
    if (!nowUtc.isUtc || !reviewDueAtUtc.isUtc) {
      throw const FormatException('Timestamps must be UTC.');
    }
    return nowUtc.isAfter(reviewDueAtUtc) || nowUtc.isAtSameMomentAs(reviewDueAtUtc);
  }

  bool shouldInvalidate({
    required StudentRevisionClosedLoopCandidate candidate,
    required AafPersonalizationBridgeAuthority aafAuthority,
  }) {
    candidate.validate();
    try {
      aafAuthority.validate();
    } catch (_) {
      // If the bridge itself fails validation (e.g. withdrawn, superseded, unverified),
      // we must invalidate.
      return true;
    }

    if (aafAuthority.studentId != candidate.studentId ||
        aafAuthority.targetAmtnId != candidate.amtnId) {
      throw const FormatException('Bridge authority identity mismatch.');
    }

    // AAF version-aware route/queue invalidation:
    if (aafAuthority.status == AafPublicProjectionStatus.withdrawn ||
        aafAuthority.status == AafPublicProjectionStatus.superseded ||
        aafAuthority.canonicalKnowledgeVersion != candidate.knowledgeVersion ||
        aafAuthority.publicProjectionId != candidate.projectionId) {
      return true;
    }
    return false;
  }

  bool processCompletionEvidence({
    required StudentRevisionClosedLoopCandidate candidate,
    required StudentEvidenceEvent event,
  }) {
    candidate.validate();
    event.validate();

    if (event.studentId != candidate.studentId || event.amtnId != candidate.amtnId) {
      throw const FormatException('Evidence event identity mismatch.');
    }

    // Safety: Completion evidence requires positive verification action
    if (event.action == StudentEvidenceAction.mentorVerified ||
        event.action == StudentEvidenceAction.diagnosticCompleted) {
      return true;
    }
    return false;
  }
}
