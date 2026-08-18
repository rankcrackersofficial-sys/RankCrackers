/// RankCrackers deterministic Student Revision Queue Engine.
/// CODE NO: PERS-19-R2
library;

import '../models/student_learning_state.dart';
import '../models/student_revision_queue.dart';
import '../models/student_evidence_event.dart';
import '../models/aaf_personalization_bridge.dart';

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
    if (!nowUtc.isUtc || !reviewDueAtUtc.isUtc) {
      throw const FormatException('Timestamps must be UTC.');
    }
    return nowUtc.isAfter(reviewDueAtUtc) ||
        nowUtc.isAtSameMomentAs(reviewDueAtUtc);
  }

  bool shouldInvalidate({
    required StudentRevisionClosedLoopCandidate candidate,
    required AafPersonalizationBridgeAuthority aafAuthority,
  }) {
    candidate.validate();
    try {
      aafAuthority.validate();
    } catch (_) {
      return true;
    }

    if (aafAuthority.studentId != candidate.studentId ||
        aafAuthority.targetAmtnId != candidate.amtnId) {
      throw const FormatException('Bridge authority identity mismatch.');
    }

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

    if (event.studentId != candidate.studentId ||
        event.amtnId != candidate.amtnId) {
      throw const FormatException('Evidence event identity mismatch.');
    }

    if (event.action == StudentEvidenceAction.mentorVerified ||
        event.action == StudentEvidenceAction.diagnosticCompleted) {
      return true;
    }
    return false;
  }
}

final class StudentRevisionCandidate {
  const StudentRevisionCandidate({
    required this.amtnId,
    required this.state,
    required this.reviewAtUtc,
    this.canonicalKnowledgeVersion = 1,
    this.publicProjectionId = 'pub1',
  });

  final String amtnId;
  final StudentLearningState state;
  final DateTime reviewAtUtc;
  final int canonicalKnowledgeVersion;
  final String publicProjectionId;
}

final class StudentRevisionQueueEngine {
  const StudentRevisionQueueEngine();

  StudentRevisionQueue build({
    required String studentId,
    required DateTime nowUtc,
    required Iterable<StudentRevisionCandidate> candidates,
  }) {
    if (!nowUtc.isUtc) {
      throw const FormatException('nowUtc must be UTC.');
    }

    final drafts = <({
      String amtnId,
      DateTime reviewAt,
      StudentRevisionQueueState state,
      bool required,
      int canonicalKnowledgeVersion,
      String publicProjectionId
    })>[];

    for (final c in candidates) {
      c.state.validate();
      if (c.state.studentId != studentId || c.state.amtnId != c.amtnId) {
        throw const FormatException('Revision candidate identity mismatch.');
      }
      if (!c.reviewAtUtc.isUtc) {
        throw const FormatException('reviewAtUtc must be UTC.');
      }

      final state = _classify(c, nowUtc);
      drafts.add((
        amtnId: c.amtnId,
        reviewAt: c.reviewAtUtc,
        state: state,
        required: state != StudentRevisionQueueState.maintenance,
        canonicalKnowledgeVersion: c.canonicalKnowledgeVersion,
        publicProjectionId: c.publicProjectionId,
      ));
    }

    drafts.sort((a, b) {
      final s = _stateRank(a.state).compareTo(_stateRank(b.state));
      if (s != 0) return s;
      final d = a.reviewAt.compareTo(b.reviewAt);
      if (d != 0) return d;
      return a.amtnId.compareTo(b.amtnId);
    });

    final items = <StudentRevisionQueueItem>[];
    for (var i = 0; i < drafts.length; i++) {
      final d = drafts[i];
      items.add(StudentRevisionQueueItem(
        revisionItemId:
            'revision:$studentId:${d.amtnId}:${d.reviewAt.toIso8601String()}',
        studentId: studentId,
        amtnId: d.amtnId,
        state: d.state,
        sequenceRank: i + 1,
        reviewAtUtc: d.reviewAt,
        required: d.required,
        canonicalKnowledgeVersion: d.canonicalKnowledgeVersion,
        publicProjectionId: d.publicProjectionId,
      ));
    }

    final queue = StudentRevisionQueue(
      studentId: studentId,
      builtAtUtc: nowUtc,
      items: List.unmodifiable(items),
    );
    queue.validate();
    return queue;
  }

  StudentRevisionQueueState _classify(
    StudentRevisionCandidate c,
    DateTime now,
  ) {
    if (c.state.retentionConfidence ==
            StudentLearningStateConfidence.insufficient ||
        c.state.masteryConfidence ==
            StudentLearningStateConfidence.insufficient) {
      return StudentRevisionQueueState.evidenceNeeded;
    }

    final nowDate = DateTime.utc(now.year, now.month, now.day);
    final dueDate = DateTime.utc(
      c.reviewAtUtc.year,
      c.reviewAtUtc.month,
      c.reviewAtUtc.day,
    );

    if (dueDate.isBefore(nowDate)) return StudentRevisionQueueState.overdue;
    if (dueDate == nowDate) return StudentRevisionQueueState.dueToday;

    if (c.state.retentionState == StudentRetentionState.strong &&
        c.state.masteryBand == StudentMasteryBand.mastered) {
      return StudentRevisionQueueState.maintenance;
    }

    return StudentRevisionQueueState.upcoming;
  }

  int _stateRank(StudentRevisionQueueState state) {
    switch (state) {
      case StudentRevisionQueueState.overdue:
        return 0;
      case StudentRevisionQueueState.evidenceNeeded:
        return 1;
      case StudentRevisionQueueState.dueToday:
        return 2;
      case StudentRevisionQueueState.maintenance:
        return 3;
      case StudentRevisionQueueState.upcoming:
        return 4;
      case StudentRevisionQueueState.completed:
        return 5;
      case StudentRevisionQueueState.rescheduled:
        return 6;
      case StudentRevisionQueueState.blockedByStaleAafVersion:
        return 7;
    }
  }
}
