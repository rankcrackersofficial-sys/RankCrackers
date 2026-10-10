/// RankCrackers governed Crucible Personalization Blueprint Contract.
/// CODE NO: PERS-15-R2
library;

enum CruciblePersonalizationBucketType {
  prerequisite,
  concept,
  guided,
  independent,
  fluency,
  retrieval,
  probe,
}

enum CruciblePersonalizationDifficultyBand { foundational, standard, stretch }

enum CruciblePersonalizationReason {
  prerequisiteRepair,
  lowMastery,
  guidedSupport,
  fluencySupport,
  retentionReview,
  evidenceProbe,
  maintenance,
}

final class CruciblePersonalizationAllocation {
  const CruciblePersonalizationAllocation({
    required this.bucket,
    required this.questionCount,
    required this.difficulty,
    required this.reason,
  });

  final CruciblePersonalizationBucketType bucket;
  final int questionCount;
  final CruciblePersonalizationDifficultyBand difficulty;
  final CruciblePersonalizationReason reason;

  void validate() {
    if (questionCount <= 0) {
      throw const FormatException('questionCount must be positive.');
    }
  }
}

final class CruciblePersonalizationBlueprint {
  static const int currentSchemaVersion = 3;

  const CruciblePersonalizationBlueprint({
    required this.studentId,
    required this.targetAmtnId,
    required this.missionId,
    required this.createdAtUtc,
    required this.allocations,
    required this.totalQuestionCount,
    required this.durationMinutes,
    required this.schemaVersion,
  });

  final String studentId;
  final String targetAmtnId;
  final String missionId;
  final DateTime createdAtUtc;
  final List<CruciblePersonalizationAllocation> allocations;
  final int totalQuestionCount;
  final int durationMinutes;
  final int schemaVersion;

  void validate() {
    if (studentId.trim().isEmpty ||
        targetAmtnId.trim().isEmpty ||
        missionId.trim().isEmpty ||
        !createdAtUtc.isUtc ||
        totalQuestionCount <= 0 ||
        durationMinutes <= 0 ||
        schemaVersion <= 0 ||
        allocations.isEmpty) {
      throw const FormatException('Invalid Crucible blueprint.');
    }
    var sum = 0;
    for (final a in allocations) {
      a.validate();
      sum += a.questionCount;
    }
    if (sum != totalQuestionCount) {
      throw const FormatException('Allocation total mismatch.');
    }
  }
}
