/// RankCrackers governed Student Treatment Decision Contract.
/// CODE NO: PERS-09-R2
library;

enum StudentTreatmentType {
  prerequisiteRepair,
  conceptRepair,
  guidedExamples,
  independentPractice,
  fluencyPractice,
  retrievalReview,
  assessmentProbe,
  gatherEvidence,
  maintain,
  mentorReview,
}

enum StudentTreatmentReason {
  prerequisiteBlocked,
  prerequisitePartial,
  lowMastery,
  insufficientMasteryEvidence,
  fragileRetention,
  insufficientRetentionEvidence,
  slowAccurate,
  fastInaccurate,
  slowInaccurate,
  insufficientFluencyEvidence,
  repeatedHintDependency,
  repeatedExplanationDependency,
  repeatedRetryDependency,
  stablePerformance,
  conflictingEvidence,
}

enum StudentTreatmentUrgency { low, normal, high, blocking }

enum StudentTreatmentSurface { digibook, syllabus, crucible, revision }

final class StudentTreatmentDirective {
  const StudentTreatmentDirective({
    required this.type,
    required this.targetAmtnId,
    required this.reasons,
    required this.urgency,
    required this.surfaces,
    this.prerequisiteAmtnIds = const <String>[],
  });

  final StudentTreatmentType type;
  final String targetAmtnId;
  final Set<StudentTreatmentReason> reasons;
  final StudentTreatmentUrgency urgency;
  final Set<StudentTreatmentSurface> surfaces;
  final List<String> prerequisiteAmtnIds;

  void validate() {
    if (targetAmtnId.trim().isEmpty) {
      throw const FormatException('targetAmtnId must not be empty.');
    }
    if (reasons.isEmpty) {
      throw const FormatException('Treatment directive requires a reason.');
    }
    if (surfaces.isEmpty) {
      throw const FormatException('Treatment directive requires a surface.');
    }
    if (type == StudentTreatmentType.prerequisiteRepair &&
        prerequisiteAmtnIds.isEmpty) {
      throw const FormatException(
        'prerequisiteRepair requires prerequisite AMTN ids.',
      );
    }
    if (prerequisiteAmtnIds.contains(targetAmtnId)) {
      throw const FormatException('Target cannot be its own prerequisite.');
    }
  }
}

final class StudentTreatmentDecision {
  static const int currentSchemaVersion = 2;

  const StudentTreatmentDecision({
    required this.studentId,
    required this.targetAmtnId,
    required this.createdAtUtc,
    required this.directives,
    required this.schemaVersion,
  });

  final String studentId;
  final String targetAmtnId;
  final DateTime createdAtUtc;
  final List<StudentTreatmentDirective> directives;
  final int schemaVersion;

  void validate() {
    if (studentId.trim().isEmpty || targetAmtnId.trim().isEmpty) {
      throw const FormatException('Decision identity must not be empty.');
    }
    if (!createdAtUtc.isUtc) {
      throw const FormatException('createdAtUtc must be UTC.');
    }
    if (schemaVersion <= 0 || directives.isEmpty) {
      throw const FormatException('Decision must contain directives.');
    }
    final seen = <StudentTreatmentType>{};
    for (final d in directives) {
      d.validate();
      if (d.targetAmtnId != targetAmtnId) {
        throw const FormatException('Directive target mismatch.');
      }
      if (!seen.add(d.type)) {
        throw const FormatException('Duplicate treatment type.');
      }
    }
  }
}

int treatmentPriorityRank(StudentTreatmentType type) {
  switch (type) {
    case StudentTreatmentType.prerequisiteRepair:
      return 0;
    case StudentTreatmentType.conceptRepair:
      return 1;
    case StudentTreatmentType.guidedExamples:
      return 2;
    case StudentTreatmentType.independentPractice:
      return 3;
    case StudentTreatmentType.fluencyPractice:
      return 4;
    case StudentTreatmentType.retrievalReview:
      return 5;
    case StudentTreatmentType.assessmentProbe:
      return 6;
    case StudentTreatmentType.gatherEvidence:
      return 7;
    case StudentTreatmentType.maintain:
      return 8;
    case StudentTreatmentType.mentorReview:
      return 9;
  }
}

extension StudentTreatmentTypeWire on StudentTreatmentType {
  String get wireName => name;
}

extension StudentTreatmentReasonWire on StudentTreatmentReason {
  String get wireName => name;
}

extension StudentTreatmentUrgencyWire on StudentTreatmentUrgency {
  String get wireName => name;
}

extension StudentTreatmentSurfaceWire on StudentTreatmentSurface {
  String get wireName => name;
}
