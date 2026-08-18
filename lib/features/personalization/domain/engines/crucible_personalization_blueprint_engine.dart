/// RankCrackers deterministic Crucible Personalization Blueprint Engine.
/// CODE NO: PERS-16-R2
library;

import '../models/crucible_personalization_blueprint.dart';
import '../models/student_treatment_decision.dart';

final class CruciblePersonalizationBlueprintEngine {
  const CruciblePersonalizationBlueprintEngine({
    this.minimumQuestions = 8,
    this.maximumQuestions = 20,
    this.minutesPerQuestion = 1.5,
  });

  final int minimumQuestions;
  final int maximumQuestions;
  final double minutesPerQuestion;

  CruciblePersonalizationBlueprint build({
    required StudentTreatmentDecision decision,
    required DateTime createdAtUtc,
  }) {
    decision.validate();
    final allocations = <CruciblePersonalizationAllocation>[];

    for (final d in decision.directives) {
      switch (d.type) {
        case StudentTreatmentType.prerequisiteRepair:
          allocations.add(const CruciblePersonalizationAllocation(
            bucket: CruciblePersonalizationBucketType.prerequisite,
            questionCount: 4,
            difficulty: CruciblePersonalizationDifficultyBand.foundational,
            reason: CruciblePersonalizationReason.prerequisiteRepair,
          ));
          break;
        case StudentTreatmentType.conceptRepair:
          allocations.add(const CruciblePersonalizationAllocation(
            bucket: CruciblePersonalizationBucketType.concept,
            questionCount: 4,
            difficulty: CruciblePersonalizationDifficultyBand.foundational,
            reason: CruciblePersonalizationReason.lowMastery,
          ));
          break;
        case StudentTreatmentType.guidedExamples:
          allocations.add(const CruciblePersonalizationAllocation(
            bucket: CruciblePersonalizationBucketType.guided,
            questionCount: 3,
            difficulty: CruciblePersonalizationDifficultyBand.standard,
            reason: CruciblePersonalizationReason.guidedSupport,
          ));
          break;
        case StudentTreatmentType.independentPractice:
          allocations.add(const CruciblePersonalizationAllocation(
            bucket: CruciblePersonalizationBucketType.independent,
            questionCount: 5,
            difficulty: CruciblePersonalizationDifficultyBand.standard,
            reason: CruciblePersonalizationReason.maintenance,
          ));
          break;
        case StudentTreatmentType.fluencyPractice:
          allocations.add(const CruciblePersonalizationAllocation(
            bucket: CruciblePersonalizationBucketType.fluency,
            questionCount: 4,
            difficulty: CruciblePersonalizationDifficultyBand.standard,
            reason: CruciblePersonalizationReason.fluencySupport,
          ));
          break;
        case StudentTreatmentType.retrievalReview:
          allocations.add(const CruciblePersonalizationAllocation(
            bucket: CruciblePersonalizationBucketType.retrieval,
            questionCount: 4,
            difficulty: CruciblePersonalizationDifficultyBand.standard,
            reason: CruciblePersonalizationReason.retentionReview,
          ));
          break;
        case StudentTreatmentType.assessmentProbe:
        case StudentTreatmentType.gatherEvidence:
          allocations.add(const CruciblePersonalizationAllocation(
            bucket: CruciblePersonalizationBucketType.probe,
            questionCount: 3,
            difficulty: CruciblePersonalizationDifficultyBand.standard,
            reason: CruciblePersonalizationReason.evidenceProbe,
          ));
          break;
        case StudentTreatmentType.maintain:
        case StudentTreatmentType.mentorReview:
          break;
      }
    }

    if (allocations.isEmpty) {
      allocations.add(const CruciblePersonalizationAllocation(
        bucket: CruciblePersonalizationBucketType.independent,
        questionCount: 8,
        difficulty: CruciblePersonalizationDifficultyBand.standard,
        reason: CruciblePersonalizationReason.maintenance,
      ));
    }

    var total = allocations.fold<int>(0, (s, a) => s + a.questionCount);
    if (total < minimumQuestions) {
      allocations.add(CruciblePersonalizationAllocation(
        bucket: CruciblePersonalizationBucketType.independent,
        questionCount: minimumQuestions - total,
        difficulty: CruciblePersonalizationDifficultyBand.standard,
        reason: CruciblePersonalizationReason.maintenance,
      ));
      total = minimumQuestions;
    }

    if (total > maximumQuestions) {
      throw const FormatException(
        'Personalization allocation exceeds governed maximum questions.',
      );
    }

    final blueprint = CruciblePersonalizationBlueprint(
      studentId: decision.studentId,
      targetAmtnId: decision.targetAmtnId,
      createdAtUtc: createdAtUtc,
      allocations: List.unmodifiable(allocations),
      totalQuestionCount: total,
      durationMinutes: (total * minutesPerQuestion).ceil(),
      schemaVersion: CruciblePersonalizationBlueprint.currentSchemaVersion,
    );
    blueprint.validate();
    return blueprint;
  }
}
