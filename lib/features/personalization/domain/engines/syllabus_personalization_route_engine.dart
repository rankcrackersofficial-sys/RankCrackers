/// RankCrackers deterministic Syllabus Personalization Route Engine.
/// CODE NO: PERS-14-R2
library;

import '../models/student_treatment_decision.dart';
import '../models/syllabus_personalization_route.dart';

final class SyllabusPersonalizationRouteEngine {
  const SyllabusPersonalizationRouteEngine();

  SyllabusPersonalizationRoute build({
    required String studentId,
    required String examId,
    required String targetAmtnId,
    required DateTime createdAtUtc,
    required StudentTreatmentDecision decision,
    DateTime? reviewDueAtUtc,
  }) {
    decision.validate();
    if (decision.studentId != studentId ||
        decision.targetAmtnId != targetAmtnId) {
      throw const FormatException('Decision identity mismatch.');
    }

    final nodes = <SyllabusPersonalizationNodeRoute>[];
    var rank = 1;

    final prereq = decision.directives
        .where((d) => d.type == StudentTreatmentType.prerequisiteRepair)
        .expand((d) => d.prerequisiteAmtnIds)
        .toSet()
        .toList()
      ..sort();

    for (final id in prereq) {
      nodes.add(SyllabusPersonalizationNodeRoute(
        amtnId: id,
        state: SyllabusPersonalizationNodeState.prerequisiteRepair,
        priority: SyllabusPersonalizationPriority.blocking,
        sequenceRank: rank++,
        requiredBeforeTarget: true,
        targetReturnAmtnId: targetAmtnId,
      ));
    }

    nodes.add(SyllabusPersonalizationNodeRoute(
      amtnId: targetAmtnId,
      state: SyllabusPersonalizationNodeState.currentTarget,
      priority: prereq.isEmpty
          ? SyllabusPersonalizationPriority.high
          : SyllabusPersonalizationPriority.normal,
      sequenceRank: rank++,
      requiredBeforeTarget: false,
    ));

    if (decision.directives
        .any((d) => d.type == StudentTreatmentType.retrievalReview)) {
      nodes.add(SyllabusPersonalizationNodeRoute(
        amtnId: targetAmtnId,
        state: SyllabusPersonalizationNodeState.reviewDue,
        priority: SyllabusPersonalizationPriority.normal,
        sequenceRank: rank++,
        requiredBeforeTarget: false,
        reviewDueAtUtc: reviewDueAtUtc,
      ));
    }

    final route = SyllabusPersonalizationRoute(
      studentId: studentId,
      missionId: decision.missionId,
      examId: examId,
      createdAtUtc: createdAtUtc,
      currentTargetAmtnId: targetAmtnId,
      orderedNodes: List.unmodifiable(nodes),
      schemaVersion: SyllabusPersonalizationRoute.currentSchemaVersion,
    );
    route.validate();
    return route;
  }
}
