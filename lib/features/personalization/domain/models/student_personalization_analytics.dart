/// Deterministic personalization analytics derived from governed evidence.
library;

enum StudentAnalyticsTruthState {
  unknown,
  insufficient,
  supported,
}

final class StudentPersonalizationAnalytics {
  static const int currentSchemaVersion = 1;

  const StudentPersonalizationAnalytics({
    required this.studentId,
    required this.targetAmtnId,
    required this.calculatedAtUtc,
    required this.masteryTruth,
    required this.retentionTruth,
    required this.fluencyTruth,
    required this.prerequisiteTruth,
    required this.evidenceCount,
    required this.schemaVersion,
  });

  final String studentId;
  final String targetAmtnId;
  final DateTime calculatedAtUtc;
  final StudentAnalyticsTruthState masteryTruth;
  final StudentAnalyticsTruthState retentionTruth;
  final StudentAnalyticsTruthState fluencyTruth;
  final StudentAnalyticsTruthState prerequisiteTruth;
  final int evidenceCount;
  final int schemaVersion;

  bool get hasUnsupportedProgressClaim =>
      masteryTruth != StudentAnalyticsTruthState.supported ||
      retentionTruth != StudentAnalyticsTruthState.supported ||
      fluencyTruth != StudentAnalyticsTruthState.supported ||
      prerequisiteTruth != StudentAnalyticsTruthState.supported;

  void validate() {
    if (studentId.trim().isEmpty || targetAmtnId.trim().isEmpty) {
      throw const FormatException('Analytics identity must not be empty.');
    }
    if (!calculatedAtUtc.isUtc) {
      throw const FormatException('calculatedAtUtc must be UTC.');
    }
    if (evidenceCount < 0) {
      throw const FormatException('evidenceCount cannot be negative.');
    }
    if (schemaVersion <= 0) {
      throw const FormatException('schemaVersion must be positive.');
    }
  }
}
