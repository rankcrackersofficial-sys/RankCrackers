/// RankCrackers AAF to Personalization bridge authority.
///
/// Personalization may choose sequence, support, depth, practice, and review
/// cadence. It must never create academic truth or route to withdrawn,
/// superseded, or unverified canonical content.
library;

enum AafPublicProjectionStatus {
  current,
  withdrawn,
  superseded,
  unverified,
}

final class AafPersonalizationBridgeAuthority {
  static const int currentSchemaVersion = 2;

  const AafPersonalizationBridgeAuthority({
    required this.studentId,
    required this.targetAmtnId,
    required this.missionId,
    required this.canonicalSemanticTopicId,
    required this.canonicalKnowledgeVersion,
    required this.publicProjectionId,
    required this.status,
    required this.studentStateVersion,
    required this.treatmentDecisionVersion,
    required this.routeVersion,
    required this.createdAtUtc,
    required this.schemaVersion,
  });

  final String studentId;
  final String targetAmtnId;
  final String missionId;
  final String canonicalSemanticTopicId;
  final int canonicalKnowledgeVersion;
  final String publicProjectionId;
  final AafPublicProjectionStatus status;
  final int studentStateVersion;
  final int treatmentDecisionVersion;
  final int routeVersion;
  final DateTime createdAtUtc;
  final int schemaVersion;

  bool get isCurrentAndEligible => status == AafPublicProjectionStatus.current;

  bool matchesCanonicalVersion(int currentCanonicalKnowledgeVersion) =>
      canonicalKnowledgeVersion == currentCanonicalKnowledgeVersion;

  void validate() {
    _requireNonEmpty(studentId, 'studentId');
    _requireNonEmpty(targetAmtnId, 'targetAmtnId');
    _requireNonEmpty(missionId, 'missionId');
    _requireNonEmpty(
      canonicalSemanticTopicId,
      'canonicalSemanticTopicId',
    );
    _requireNonEmpty(publicProjectionId, 'publicProjectionId');

    if (canonicalKnowledgeVersion <= 0) {
      throw const FormatException(
        'canonicalKnowledgeVersion must be positive.',
      );
    }
    if (studentStateVersion <= 0) {
      throw const FormatException('studentStateVersion must be positive.');
    }
    if (treatmentDecisionVersion <= 0) {
      throw const FormatException(
        'treatmentDecisionVersion must be positive.',
      );
    }
    if (routeVersion <= 0) {
      throw const FormatException('routeVersion must be positive.');
    }
    if (schemaVersion <= 0) {
      throw const FormatException('schemaVersion must be positive.');
    }
    if (!createdAtUtc.isUtc) {
      throw const FormatException('createdAtUtc must be UTC.');
    }
    if (!isCurrentAndEligible) {
      throw const FormatException(
        'Personalization cannot route to withdrawn, superseded, or '
        'unverified AAF public projections.',
      );
    }
  }

  Map<String, Object?> toJson() {
    validate();
    return <String, Object?>{
      'schemaVersion': schemaVersion,
      'studentId': studentId,
      'targetAmtnId': targetAmtnId,
      'missionId': missionId,
      'canonicalSemanticTopicId': canonicalSemanticTopicId,
      'canonicalKnowledgeVersion': canonicalKnowledgeVersion,
      'publicProjectionId': publicProjectionId,
      'status': status.wireName,
      'studentStateVersion': studentStateVersion,
      'treatmentDecisionVersion': treatmentDecisionVersion,
      'routeVersion': routeVersion,
      'createdAtUtc': createdAtUtc.toIso8601String(),
    };
  }

  static void _requireNonEmpty(String value, String field) {
    if (value.trim().isEmpty) {
      throw FormatException(' must not be empty.');
    }
  }
}

extension AafPublicProjectionStatusWire on AafPublicProjectionStatus {
  String get wireName {
    switch (this) {
      case AafPublicProjectionStatus.current:
        return 'current';
      case AafPublicProjectionStatus.withdrawn:
        return 'withdrawn';
      case AafPublicProjectionStatus.superseded:
        return 'superseded';
      case AafPublicProjectionStatus.unverified:
        return 'unverified';
    }
  }
}
