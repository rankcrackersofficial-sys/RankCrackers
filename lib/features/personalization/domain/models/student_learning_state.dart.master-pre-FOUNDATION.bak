/// RankCrackers governed Student Learning State Contract.
///
/// CODE NO: PERS-02-R2
///
/// PURPOSE:
/// Define the canonical deterministic state vocabulary produced by
/// personalization calculation engines for exactly one student + AMTN.
///
/// IMPORTANT:
/// 1. This file stores calculated state; it does not calculate it.
/// 2. It contains NO AI/LLM inference.
/// 3. It contains NO psychological/personality profiling.
/// 4. It contains NO Firebase/persistence logic.
/// 5. Mastery, retention, fluency, prerequisite readiness, and confidence
///    remain separate dimensions.
/// 6. "Unknown" and "insufficient" are first-class fail-closed states.
/// 7. No missing academic value may be fabricated.
/// 8. All timestamps are UTC.
/// 9. Probabilities/scores are normalized to [0, 1].
/// 10. Schema version: 2.
library;

enum StudentMasteryBand {
  unknown,
  emerging,
  developing,
  proficient,
  mastered,
}

enum StudentRetentionState {
  unknown,
  fragile,
  unstable,
  stable,
  strong,
}

enum StudentFluencyPattern {
  unknown,
  slowAndAccurate,
  balanced,
  fastAndAccurate,
  fastButInaccurate,
  slowAndInaccurate,
}

enum StudentPrerequisiteReadiness {
  unknown,
  blocked,
  partial,
  ready,
}

enum StudentLearningStateConfidence {
  insufficient,
  low,
  medium,
  high,
}

/// Canonical aggregate student learning state for one AMTN.
///
/// This model intentionally carries the output dimensions independently.
/// Downstream treatment engines must not collapse them into psychological or
/// personality labels.
final class StudentLearningState {
  static const int currentSchemaVersion = 2;

  const StudentLearningState({
    required this.studentId,
    required this.amtnId,
    required this.calculatedAtUtc,
    required this.masteryProbability,
    required this.masteryBand,
    required this.masteryConfidence,
    required this.retentionProbability,
    required this.retentionState,
    required this.retentionConfidence,
    required this.fluencyScore,
    required this.fluencyPattern,
    required this.fluencyConfidence,
    required this.prerequisiteReadiness,
    required this.prerequisiteConfidence,
    required this.hintDependencyRate,
    required this.explanationDependencyRate,
    required this.retryRate,
    required this.answerChangeRate,
    required this.totalEligibleEvidenceCount,
    required this.schemaVersion,
  });

  final String studentId;
  final String amtnId;
  final DateTime calculatedAtUtc;

  final double? masteryProbability;
  final StudentMasteryBand masteryBand;
  final StudentLearningStateConfidence masteryConfidence;

  final double? retentionProbability;
  final StudentRetentionState retentionState;
  final StudentLearningStateConfidence retentionConfidence;

  final double? fluencyScore;
  final StudentFluencyPattern fluencyPattern;
  final StudentLearningStateConfidence fluencyConfidence;

  final StudentPrerequisiteReadiness prerequisiteReadiness;
  final StudentLearningStateConfidence prerequisiteConfidence;

  /// Explicit behavioral evidence rates.
  ///
  /// These are observable interaction statistics only. They are not
  /// psychological traits.
  final double? hintDependencyRate;
  final double? explanationDependencyRate;
  final double? retryRate;
  final double? answerChangeRate;

  final int totalEligibleEvidenceCount;
  final int schemaVersion;

  bool get hasSufficientMasteryEvidence =>
      masteryConfidence != StudentLearningStateConfidence.insufficient;

  bool get hasSufficientRetentionEvidence =>
      retentionConfidence != StudentLearningStateConfidence.insufficient;

  bool get hasSufficientFluencyEvidence =>
      fluencyConfidence != StudentLearningStateConfidence.insufficient;

  bool get hasSufficientPrerequisiteEvidence =>
      prerequisiteConfidence != StudentLearningStateConfidence.insufficient;

  bool get hasAnyInsufficientDimension =>
      !hasSufficientMasteryEvidence ||
      !hasSufficientRetentionEvidence ||
      !hasSufficientFluencyEvidence ||
      !hasSufficientPrerequisiteEvidence;

  void validate() {
    if (studentId.trim().isEmpty) {
      throw const FormatException(
        'StudentLearningState.studentId must not be empty.',
      );
    }

    if (amtnId.trim().isEmpty) {
      throw const FormatException(
        'StudentLearningState.amtnId must not be empty.',
      );
    }

    if (!calculatedAtUtc.isUtc) {
      throw const FormatException(
        'StudentLearningState.calculatedAtUtc must be UTC.',
      );
    }

    if (schemaVersion <= 0) {
      throw const FormatException(
        'StudentLearningState.schemaVersion must be positive.',
      );
    }

    if (totalEligibleEvidenceCount < 0) {
      throw const FormatException(
        'StudentLearningState.totalEligibleEvidenceCount cannot be negative.',
      );
    }

    _validateOptionalProbability(
      masteryProbability,
      'masteryProbability',
    );
    _validateOptionalProbability(
      retentionProbability,
      'retentionProbability',
    );
    _validateOptionalProbability(
      fluencyScore,
      'fluencyScore',
    );
    _validateOptionalProbability(
      hintDependencyRate,
      'hintDependencyRate',
    );
    _validateOptionalProbability(
      explanationDependencyRate,
      'explanationDependencyRate',
    );
    _validateOptionalProbability(
      retryRate,
      'retryRate',
    );
    _validateOptionalProbability(
      answerChangeRate,
      'answerChangeRate',
    );

    _validateMasteryConsistency();
    _validateRetentionConsistency();
    _validateFluencyConsistency();
    _validatePrerequisiteConsistency();
  }

  void _validateMasteryConsistency() {
    if (masteryConfidence == StudentLearningStateConfidence.insufficient) {
      if (masteryBand != StudentMasteryBand.unknown) {
        throw const FormatException(
          'Insufficient mastery confidence requires unknown masteryBand.',
        );
      }
      return;
    }

    if (masteryBand == StudentMasteryBand.unknown) {
      throw const FormatException(
        'Sufficient mastery confidence cannot use unknown masteryBand.',
      );
    }

    if (masteryProbability == null) {
      throw const FormatException(
        'Sufficient mastery confidence requires masteryProbability.',
      );
    }
  }

  void _validateRetentionConsistency() {
    if (retentionConfidence == StudentLearningStateConfidence.insufficient) {
      if (retentionState != StudentRetentionState.unknown) {
        throw const FormatException(
          'Insufficient retention confidence requires unknown retentionState.',
        );
      }
      return;
    }

    if (retentionState == StudentRetentionState.unknown) {
      throw const FormatException(
        'Sufficient retention confidence cannot use unknown retentionState.',
      );
    }

    if (retentionProbability == null) {
      throw const FormatException(
        'Sufficient retention confidence requires retentionProbability.',
      );
    }
  }

  void _validateFluencyConsistency() {
    if (fluencyConfidence == StudentLearningStateConfidence.insufficient) {
      if (fluencyPattern != StudentFluencyPattern.unknown) {
        throw const FormatException(
          'Insufficient fluency confidence requires unknown fluencyPattern.',
        );
      }
      return;
    }

    if (fluencyPattern == StudentFluencyPattern.unknown) {
      throw const FormatException(
        'Sufficient fluency confidence cannot use unknown fluencyPattern.',
      );
    }

    if (fluencyScore == null) {
      throw const FormatException(
        'Sufficient fluency confidence requires fluencyScore.',
      );
    }
  }

  void _validatePrerequisiteConsistency() {
    if (prerequisiteConfidence == StudentLearningStateConfidence.insufficient) {
      if (prerequisiteReadiness != StudentPrerequisiteReadiness.unknown) {
        throw const FormatException(
          'Insufficient prerequisite confidence requires unknown readiness.',
        );
      }
      return;
    }

    if (prerequisiteReadiness == StudentPrerequisiteReadiness.unknown) {
      throw const FormatException(
        'Sufficient prerequisite confidence cannot use unknown readiness.',
      );
    }
  }

  Map<String, Object?> toJson() {
    validate();

    return <String, Object?>{
      'schemaVersion': schemaVersion,
      'studentId': studentId,
      'amtnId': amtnId,
      'calculatedAtUtc': calculatedAtUtc.toIso8601String(),
      'masteryProbability': masteryProbability,
      'masteryBand': masteryBand.wireName,
      'masteryConfidence': masteryConfidence.wireName,
      'retentionProbability': retentionProbability,
      'retentionState': retentionState.wireName,
      'retentionConfidence': retentionConfidence.wireName,
      'fluencyScore': fluencyScore,
      'fluencyPattern': fluencyPattern.wireName,
      'fluencyConfidence': fluencyConfidence.wireName,
      'prerequisiteReadiness': prerequisiteReadiness.wireName,
      'prerequisiteConfidence': prerequisiteConfidence.wireName,
      'hintDependencyRate': hintDependencyRate,
      'explanationDependencyRate': explanationDependencyRate,
      'retryRate': retryRate,
      'answerChangeRate': answerChangeRate,
      'totalEligibleEvidenceCount': totalEligibleEvidenceCount,
    };
  }

  factory StudentLearningState.fromJson(
    Map<String, Object?> json,
  ) {
    final state = StudentLearningState(
      studentId: _readRequiredString(json, 'studentId'),
      amtnId: _readRequiredString(json, 'amtnId'),
      calculatedAtUtc: _readRequiredUtcDateTime(
        json,
        'calculatedAtUtc',
      ),
      masteryProbability: _readOptionalDouble(
        json,
        'masteryProbability',
      ),
      masteryBand: StudentMasteryBandWire.parse(
        _readRequiredString(json, 'masteryBand'),
      ),
      masteryConfidence: StudentLearningStateConfidenceWire.parse(
        _readRequiredString(json, 'masteryConfidence'),
      ),
      retentionProbability: _readOptionalDouble(
        json,
        'retentionProbability',
      ),
      retentionState: StudentRetentionStateWire.parse(
        _readRequiredString(json, 'retentionState'),
      ),
      retentionConfidence: StudentLearningStateConfidenceWire.parse(
        _readRequiredString(json, 'retentionConfidence'),
      ),
      fluencyScore: _readOptionalDouble(json, 'fluencyScore'),
      fluencyPattern: StudentFluencyPatternWire.parse(
        _readRequiredString(json, 'fluencyPattern'),
      ),
      fluencyConfidence: StudentLearningStateConfidenceWire.parse(
        _readRequiredString(json, 'fluencyConfidence'),
      ),
      prerequisiteReadiness: StudentPrerequisiteReadinessWire.parse(
        _readRequiredString(json, 'prerequisiteReadiness'),
      ),
      prerequisiteConfidence: StudentLearningStateConfidenceWire.parse(
        _readRequiredString(json, 'prerequisiteConfidence'),
      ),
      hintDependencyRate: _readOptionalDouble(
        json,
        'hintDependencyRate',
      ),
      explanationDependencyRate: _readOptionalDouble(
        json,
        'explanationDependencyRate',
      ),
      retryRate: _readOptionalDouble(json, 'retryRate'),
      answerChangeRate: _readOptionalDouble(
        json,
        'answerChangeRate',
      ),
      totalEligibleEvidenceCount: _readRequiredInt(
        json,
        'totalEligibleEvidenceCount',
      ),
      schemaVersion: _readRequiredInt(json, 'schemaVersion'),
    );

    state.validate();
    return state;
  }

  static void _validateOptionalProbability(
    double? value,
    String field,
  ) {
    if (value == null) {
      return;
    }

    if (value.isNaN || value.isInfinite || value < 0.0 || value > 1.0) {
      throw FormatException('$field must be within [0, 1].');
    }
  }

  static String _readRequiredString(
    Map<String, Object?> json,
    String key,
  ) {
    final value = json[key];

    if (value is! String || value.trim().isEmpty) {
      throw FormatException('$key must be a non-empty string.');
    }

    return value;
  }

  static int _readRequiredInt(
    Map<String, Object?> json,
    String key,
  ) {
    final value = json[key];

    if (value is! int) {
      throw FormatException('$key must be an integer.');
    }

    return value;
  }

  static double? _readOptionalDouble(
    Map<String, Object?> json,
    String key,
  ) {
    final value = json[key];

    if (value == null) {
      return null;
    }

    if (value is int) {
      return value.toDouble();
    }

    if (value is double) {
      return value;
    }

    throw FormatException(
      '$key must be numeric when supplied.',
    );
  }

  static DateTime _readRequiredUtcDateTime(
    Map<String, Object?> json,
    String key,
  ) {
    final raw = _readRequiredString(json, key);
    final parsed = DateTime.tryParse(raw);

    if (parsed == null || !parsed.isUtc) {
      throw FormatException('$key must be a valid UTC timestamp.');
    }

    return parsed;
  }
}

extension StudentMasteryBandWire on StudentMasteryBand {
  String get wireName {
    switch (this) {
      case StudentMasteryBand.unknown:
        return 'unknown';
      case StudentMasteryBand.emerging:
        return 'emerging';
      case StudentMasteryBand.developing:
        return 'developing';
      case StudentMasteryBand.proficient:
        return 'proficient';
      case StudentMasteryBand.mastered:
        return 'mastered';
    }
  }

  static StudentMasteryBand parse(String value) {
    switch (value.trim()) {
      case 'unknown':
        return StudentMasteryBand.unknown;
      case 'emerging':
        return StudentMasteryBand.emerging;
      case 'developing':
        return StudentMasteryBand.developing;
      case 'proficient':
        return StudentMasteryBand.proficient;
      case 'mastered':
        return StudentMasteryBand.mastered;
      default:
        throw FormatException(
          'Unknown StudentMasteryBand "$value".',
        );
    }
  }
}

extension StudentRetentionStateWire on StudentRetentionState {
  String get wireName {
    switch (this) {
      case StudentRetentionState.unknown:
        return 'unknown';
      case StudentRetentionState.fragile:
        return 'fragile';
      case StudentRetentionState.unstable:
        return 'unstable';
      case StudentRetentionState.stable:
        return 'stable';
      case StudentRetentionState.strong:
        return 'strong';
    }
  }

  static StudentRetentionState parse(String value) {
    switch (value.trim()) {
      case 'unknown':
        return StudentRetentionState.unknown;
      case 'fragile':
        return StudentRetentionState.fragile;
      case 'unstable':
        return StudentRetentionState.unstable;
      case 'stable':
        return StudentRetentionState.stable;
      case 'strong':
        return StudentRetentionState.strong;
      default:
        throw FormatException(
          'Unknown StudentRetentionState "$value".',
        );
    }
  }
}

extension StudentFluencyPatternWire on StudentFluencyPattern {
  String get wireName {
    switch (this) {
      case StudentFluencyPattern.unknown:
        return 'unknown';
      case StudentFluencyPattern.slowAndAccurate:
        return 'slow_and_accurate';
      case StudentFluencyPattern.balanced:
        return 'balanced';
      case StudentFluencyPattern.fastAndAccurate:
        return 'fast_and_accurate';
      case StudentFluencyPattern.fastButInaccurate:
        return 'fast_but_inaccurate';
      case StudentFluencyPattern.slowAndInaccurate:
        return 'slow_and_inaccurate';
    }
  }

  static StudentFluencyPattern parse(String value) {
    switch (value.trim()) {
      case 'unknown':
        return StudentFluencyPattern.unknown;
      case 'slow_and_accurate':
        return StudentFluencyPattern.slowAndAccurate;
      case 'balanced':
        return StudentFluencyPattern.balanced;
      case 'fast_and_accurate':
        return StudentFluencyPattern.fastAndAccurate;
      case 'fast_but_inaccurate':
        return StudentFluencyPattern.fastButInaccurate;
      case 'slow_and_inaccurate':
        return StudentFluencyPattern.slowAndInaccurate;
      default:
        throw FormatException(
          'Unknown StudentFluencyPattern "$value".',
        );
    }
  }
}

extension StudentPrerequisiteReadinessWire on StudentPrerequisiteReadiness {
  String get wireName {
    switch (this) {
      case StudentPrerequisiteReadiness.unknown:
        return 'unknown';
      case StudentPrerequisiteReadiness.blocked:
        return 'blocked';
      case StudentPrerequisiteReadiness.partial:
        return 'partial';
      case StudentPrerequisiteReadiness.ready:
        return 'ready';
    }
  }

  static StudentPrerequisiteReadiness parse(String value) {
    switch (value.trim()) {
      case 'unknown':
        return StudentPrerequisiteReadiness.unknown;
      case 'blocked':
        return StudentPrerequisiteReadiness.blocked;
      case 'partial':
        return StudentPrerequisiteReadiness.partial;
      case 'ready':
        return StudentPrerequisiteReadiness.ready;
      default:
        throw FormatException(
          'Unknown StudentPrerequisiteReadiness "$value".',
        );
    }
  }
}

extension StudentLearningStateConfidenceWire on StudentLearningStateConfidence {
  String get wireName {
    switch (this) {
      case StudentLearningStateConfidence.insufficient:
        return 'insufficient';
      case StudentLearningStateConfidence.low:
        return 'low';
      case StudentLearningStateConfidence.medium:
        return 'medium';
      case StudentLearningStateConfidence.high:
        return 'high';
    }
  }

  static StudentLearningStateConfidence parse(String value) {
    switch (value.trim()) {
      case 'insufficient':
        return StudentLearningStateConfidence.insufficient;
      case 'low':
        return StudentLearningStateConfidence.low;
      case 'medium':
        return StudentLearningStateConfidence.medium;
      case 'high':
        return StudentLearningStateConfidence.high;
      default:
        throw FormatException(
          'Unknown StudentLearningStateConfidence "$value".',
        );
    }
  }
}
