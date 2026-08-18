/// RankCrackers governed Student Revision Event Contract.
///
/// CODE NO: PERS-REV-01
///
/// Revision events close the loop only when backed by governed student
/// evidence. They do not calculate mastery and they never create academic
/// truth.
library;

import 'student_evidence_event.dart';

enum StudentRevisionEventOutcome {
  evidenceNeeded,
  completed,
  blockedByStaleAafVersion,
  blockedByIneligibleProjection,
}

final class StudentRevisionEvent {
  static const int currentSchemaVersion = 1;

  const StudentRevisionEvent({
    required this.revisionEventId,
    required this.studentId,
    required this.amtnId,
    required this.canonicalSemanticTopicId,
    required this.canonicalKnowledgeVersion,
    required this.publicProjectionId,
    required this.occurredAtUtc,
    required this.outcome,
    required this.schemaVersion,
    this.evidenceEvent,
    this.assistedAttempt = false,
  });

  final String revisionEventId;
  final String studentId;
  final String amtnId;
  final String canonicalSemanticTopicId;
  final int canonicalKnowledgeVersion;
  final String publicProjectionId;
  final DateTime occurredAtUtc;
  final StudentRevisionEventOutcome outcome;
  final StudentEvidenceEvent? evidenceEvent;
  final bool assistedAttempt;
  final int schemaVersion;

  bool get hasGovernedEvidence => evidenceEvent != null;

  void validate() {
    _requireText(revisionEventId, 'revisionEventId');
    _requireText(studentId, 'studentId');
    _requireText(amtnId, 'amtnId');
    _requireText(canonicalSemanticTopicId, 'canonicalSemanticTopicId');
    _requireText(publicProjectionId, 'publicProjectionId');

    if (canonicalKnowledgeVersion <= 0) {
      throw const FormatException(
        'canonicalKnowledgeVersion must be positive.',
      );
    }
    if (!occurredAtUtc.isUtc) {
      throw const FormatException('occurredAtUtc must be UTC.');
    }
    if (schemaVersion <= 0) {
      throw const FormatException('schemaVersion must be positive.');
    }

    final evidence = evidenceEvent;
    if (evidence != null) {
      evidence.validate();
      if (evidence.studentId != studentId || evidence.amtnId != amtnId) {
        throw const FormatException(
          'Revision evidence identity mismatch.',
        );
      }
    }

    if (outcome == StudentRevisionEventOutcome.completed && evidence == null) {
      throw const FormatException(
        'Completed revision requires governed evidence.',
      );
    }
  }

  static void _requireText(String value, String field) {
    if (value.trim().isEmpty) {
      throw FormatException('$field must not be empty.');
    }
  }
}
