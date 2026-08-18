/// Governed personalized practice route contract.
library;

enum PersonalizedPracticeRouteStatus {
  ready,
  blocked,
}

enum PersonalizedPracticeRouteReason {
  verifiedItemSelected,
  noVerifiedItem,
  withdrawnProjection,
  identityMismatch,
}

final class VerifiedPracticeItem {
  const VerifiedPracticeItem({
    required this.itemId,
    required this.targetAmtnId,
    required this.canonicalSemanticTopicId,
    required this.canonicalKnowledgeVersion,
    required this.publicProjectionId,
    required this.isVerified,
    required this.isCurrent,
    required this.difficultyRank,
  });

  final String itemId;
  final String targetAmtnId;
  final String canonicalSemanticTopicId;
  final int canonicalKnowledgeVersion;
  final String publicProjectionId;
  final bool isVerified;
  final bool isCurrent;
  final int difficultyRank;

  void validate() {
    _requireNonEmpty(itemId, 'itemId');
    _requireNonEmpty(targetAmtnId, 'targetAmtnId');
    _requireNonEmpty(canonicalSemanticTopicId, 'canonicalSemanticTopicId');
    _requireNonEmpty(publicProjectionId, 'publicProjectionId');
    if (canonicalKnowledgeVersion <= 0) {
      throw const FormatException(
        'canonicalKnowledgeVersion must be positive.',
      );
    }
    if (difficultyRank < 0) {
      throw const FormatException('difficultyRank cannot be negative.');
    }
  }

  static void _requireNonEmpty(String value, String field) {
    if (value.trim().isEmpty) {
      throw FormatException('$field must not be empty.');
    }
  }
}

final class PersonalizedPracticeRoute {
  static const int currentSchemaVersion = 1;

  const PersonalizedPracticeRoute({
    required this.studentId,
    required this.targetAmtnId,
    required this.canonicalSemanticTopicId,
    required this.canonicalKnowledgeVersion,
    required this.publicProjectionId,
    required this.studentStateVersion,
    required this.routeVersion,
    required this.createdAtUtc,
    required this.status,
    required this.reasons,
    required this.practiceItemIds,
    required this.schemaVersion,
  });

  final String studentId;
  final String targetAmtnId;
  final String canonicalSemanticTopicId;
  final int canonicalKnowledgeVersion;
  final String publicProjectionId;
  final int studentStateVersion;
  final int routeVersion;
  final DateTime createdAtUtc;
  final PersonalizedPracticeRouteStatus status;
  final Set<PersonalizedPracticeRouteReason> reasons;
  final List<String> practiceItemIds;
  final int schemaVersion;

  bool get isReady => status == PersonalizedPracticeRouteStatus.ready;

  void validate() {
    VerifiedPracticeItem._requireNonEmpty(studentId, 'studentId');
    VerifiedPracticeItem._requireNonEmpty(targetAmtnId, 'targetAmtnId');
    VerifiedPracticeItem._requireNonEmpty(
      canonicalSemanticTopicId,
      'canonicalSemanticTopicId',
    );
    VerifiedPracticeItem._requireNonEmpty(
        publicProjectionId, 'publicProjectionId');
    if (canonicalKnowledgeVersion <= 0 ||
        studentStateVersion <= 0 ||
        routeVersion <= 0 ||
        schemaVersion <= 0) {
      throw const FormatException('Version fields must be positive.');
    }
    if (!createdAtUtc.isUtc) {
      throw const FormatException('createdAtUtc must be UTC.');
    }
    if (reasons.isEmpty) {
      throw const FormatException('Practice route requires a reason.');
    }
    if (status == PersonalizedPracticeRouteStatus.ready) {
      if (practiceItemIds.isEmpty) {
        throw const FormatException('Ready route requires practice items.');
      }
      if (reasons.any(
        (reason) =>
            reason != PersonalizedPracticeRouteReason.verifiedItemSelected,
      )) {
        throw const FormatException(
          'Ready route cannot contain fail-closed reasons.',
        );
      }
    }
  }
}
