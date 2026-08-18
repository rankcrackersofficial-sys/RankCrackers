/// RankCrackers deterministic Student Treatment Decision Engine.
/// CODE NO: PERS-10-R2
library;

import '../models/student_learning_state.dart';
import '../models/student_treatment_decision.dart';
import 'student_prerequisite_state_engine.dart';

final class StudentTreatmentDecisionEngine {
  const StudentTreatmentDecisionEngine({
    this.hintDependencyThreshold = 0.35,
    this.explanationDependencyThreshold = 0.35,
    this.retryDependencyThreshold = 0.30,
  });

  final double hintDependencyThreshold;
  final double explanationDependencyThreshold;
  final double retryDependencyThreshold;

  StudentTreatmentDecision decide({
    required StudentLearningState state,
    required StudentPrerequisiteDiagnosis prerequisite,
    required DateTime createdAtUtc,
  }) {
    state.validate();
    if (!createdAtUtc.isUtc) {
      throw const FormatException('createdAtUtc must be UTC.');
    }
    if (prerequisite.studentId != state.studentId ||
        prerequisite.targetAmtnId != state.amtnId) {
      throw const FormatException('Prerequisite diagnosis identity mismatch.');
    }

    final directives = <StudentTreatmentDirective>[];

    void add(
      StudentTreatmentType type,
      Set<StudentTreatmentReason> reasons,
      StudentTreatmentUrgency urgency,
      Set<StudentTreatmentSurface> surfaces, {
      List<String> prerequisiteIds = const [],
    }) {
      if (directives.any((d) => d.type == type)) return;
      directives.add(StudentTreatmentDirective(
        type: type,
        targetAmtnId: state.amtnId,
        reasons: reasons,
        urgency: urgency,
        surfaces: surfaces,
        prerequisiteAmtnIds: prerequisiteIds,
      ));
    }

    if (prerequisite.readiness == StudentPrerequisiteReadiness.blocked ||
        prerequisite.readiness == StudentPrerequisiteReadiness.partial) {
      add(
        StudentTreatmentType.prerequisiteRepair,
        {
          prerequisite.readiness == StudentPrerequisiteReadiness.blocked
              ? StudentTreatmentReason.prerequisiteBlocked
              : StudentTreatmentReason.prerequisitePartial,
        },
        prerequisite.readiness == StudentPrerequisiteReadiness.blocked
            ? StudentTreatmentUrgency.blocking
            : StudentTreatmentUrgency.high,
        {
          StudentTreatmentSurface.digibook,
          StudentTreatmentSurface.syllabus,
          StudentTreatmentSurface.crucible,
        },
        prerequisiteIds: [
          ...prerequisite.blockingPrerequisiteAmtnIds,
          ...prerequisite.weakPrerequisiteAmtnIds,
        ],
      );
    }

    if (state.masteryConfidence ==
        StudentLearningStateConfidence.insufficient) {
      add(
        StudentTreatmentType.gatherEvidence,
        {StudentTreatmentReason.insufficientMasteryEvidence},
        StudentTreatmentUrgency.high,
        {StudentTreatmentSurface.crucible},
      );
      add(
        StudentTreatmentType.assessmentProbe,
        {StudentTreatmentReason.insufficientMasteryEvidence},
        StudentTreatmentUrgency.normal,
        {StudentTreatmentSurface.crucible},
      );
    } else if (state.masteryBand == StudentMasteryBand.emerging ||
        state.masteryBand == StudentMasteryBand.developing) {
      add(
        StudentTreatmentType.conceptRepair,
        {StudentTreatmentReason.lowMastery},
        StudentTreatmentUrgency.high,
        {StudentTreatmentSurface.digibook, StudentTreatmentSurface.syllabus},
      );
      add(
        StudentTreatmentType.guidedExamples,
        {StudentTreatmentReason.lowMastery},
        StudentTreatmentUrgency.normal,
        {StudentTreatmentSurface.digibook, StudentTreatmentSurface.crucible},
      );
    } else {
      add(
        StudentTreatmentType.independentPractice,
        {StudentTreatmentReason.stablePerformance},
        StudentTreatmentUrgency.normal,
        {StudentTreatmentSurface.crucible},
      );
    }

    if (state.retentionConfidence ==
        StudentLearningStateConfidence.insufficient) {
      add(
        StudentTreatmentType.gatherEvidence,
        {StudentTreatmentReason.insufficientRetentionEvidence},
        StudentTreatmentUrgency.normal,
        {StudentTreatmentSurface.revision, StudentTreatmentSurface.crucible},
      );
    } else if (state.retentionState == StudentRetentionState.fragile ||
        state.retentionState == StudentRetentionState.unstable) {
      add(
        StudentTreatmentType.retrievalReview,
        {StudentTreatmentReason.fragileRetention},
        StudentTreatmentUrgency.high,
        {
          StudentTreatmentSurface.digibook,
          StudentTreatmentSurface.revision,
          StudentTreatmentSurface.crucible
        },
      );
    }

    if (state.fluencyConfidence ==
        StudentLearningStateConfidence.insufficient) {
      add(
        StudentTreatmentType.gatherEvidence,
        {StudentTreatmentReason.insufficientFluencyEvidence},
        StudentTreatmentUrgency.normal,
        {StudentTreatmentSurface.crucible},
      );
    } else {
      final reason = switch (state.fluencyPattern) {
        StudentFluencyPattern.slowAndAccurate =>
          StudentTreatmentReason.slowAccurate,
        StudentFluencyPattern.fastButInaccurate =>
          StudentTreatmentReason.fastInaccurate,
        StudentFluencyPattern.slowAndInaccurate =>
          StudentTreatmentReason.slowInaccurate,
        _ => null,
      };
      if (reason != null) {
        add(
          StudentTreatmentType.fluencyPractice,
          {reason},
          StudentTreatmentUrgency.normal,
          {StudentTreatmentSurface.crucible},
        );
      }
    }

    if ((state.hintDependencyRate ?? 0) >= hintDependencyThreshold) {
      add(
        StudentTreatmentType.guidedExamples,
        {StudentTreatmentReason.repeatedHintDependency},
        StudentTreatmentUrgency.normal,
        {StudentTreatmentSurface.digibook, StudentTreatmentSurface.crucible},
      );
    }
    if ((state.explanationDependencyRate ?? 0) >=
        explanationDependencyThreshold) {
      add(
        StudentTreatmentType.conceptRepair,
        {StudentTreatmentReason.repeatedExplanationDependency},
        StudentTreatmentUrgency.normal,
        {StudentTreatmentSurface.digibook},
      );
    }
    if ((state.retryRate ?? 0) >= retryDependencyThreshold) {
      add(
        StudentTreatmentType.assessmentProbe,
        {StudentTreatmentReason.repeatedRetryDependency},
        StudentTreatmentUrgency.normal,
        {StudentTreatmentSurface.crucible},
      );
    }

    if (directives.isEmpty) {
      add(
        StudentTreatmentType.maintain,
        {StudentTreatmentReason.stablePerformance},
        StudentTreatmentUrgency.low,
        {
          StudentTreatmentSurface.digibook,
          StudentTreatmentSurface.syllabus,
          StudentTreatmentSurface.crucible,
          StudentTreatmentSurface.revision,
        },
      );
    }

    directives.sort(
      (a, b) => treatmentPriorityRank(a.type).compareTo(
        treatmentPriorityRank(b.type),
      ),
    );

    final decision = StudentTreatmentDecision(
      studentId: state.studentId,
      targetAmtnId: state.amtnId,
      createdAtUtc: createdAtUtc,
      directives: List.unmodifiable(directives),
      schemaVersion: StudentTreatmentDecision.currentSchemaVersion,
    );
    decision.validate();
    return decision;
  }
}
