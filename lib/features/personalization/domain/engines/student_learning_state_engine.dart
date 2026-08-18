/// RankCrackers deterministic aggregate Student Learning State Engine.
/// CODE NO: PERS-07-R2
library;

import '../models/student_evidence_event.dart';
import '../models/student_learning_state.dart';
import 'student_mastery_engine.dart';
import 'student_retention_engine.dart';
import 'student_fluency_engine.dart';

final class StudentLearningStateEngine {
  const StudentLearningStateEngine();

  StudentLearningState assemble({
    required String studentId,
    required String amtnId,
    required DateTime calculatedAtUtc,
    required StudentMasteryEstimate mastery,
    required StudentRetentionEstimate retention,
    required StudentFluencyEstimate fluency,
    required StudentPrerequisiteReadiness prerequisiteReadiness,
    required StudentLearningStateConfidence prerequisiteConfidence,
    required Iterable<StudentEvidenceEvent> rawEvents,
  }) {
    if (!calculatedAtUtc.isUtc) {
      throw const FormatException('calculatedAtUtc must be UTC.');
    }
    if (mastery.studentId != studentId ||
        retention.studentId != studentId ||
        fluency.studentId != studentId ||
        mastery.amtnId != amtnId ||
        retention.amtnId != amtnId ||
        fluency.amtnId != amtnId) {
      throw const FormatException('Estimate identity mismatch.');
    }

    final events = rawEvents
        .where((e) => e.studentId == studentId && e.amtnId == amtnId)
        .toList();

    double? rate(bool Function(StudentEvidenceEvent) predicate) {
      final attempts = events
          .where((e) =>
              e.action == StudentEvidenceAction.answerSubmitted ||
              e.action == StudentEvidenceAction.retrySubmitted)
          .toList();
      if (attempts.isEmpty) return null;
      return attempts.where(predicate).length / attempts.length;
    }

    final state = StudentLearningState(
      studentId: studentId,
      amtnId: amtnId,
      calculatedAtUtc: calculatedAtUtc,
      masteryProbability: mastery.probability,
      masteryBand: mastery.band,
      masteryConfidence: mastery.confidence,
      retentionProbability: retention.probability,
      retentionState: retention.state,
      retentionConfidence: retention.confidence,
      fluencyScore: fluency.score,
      fluencyPattern: fluency.pattern,
      fluencyConfidence: fluency.confidence,
      prerequisiteReadiness: prerequisiteReadiness,
      prerequisiteConfidence: prerequisiteConfidence,
      hintDependencyRate: rate((e) => (e.hintsUsed ?? 0) > 0),
      explanationDependencyRate: rate((e) => e.wasExplanationOpened == true),
      retryRate: rate((e) =>
          e.wasRetry == true ||
          e.action == StudentEvidenceAction.retrySubmitted),
      answerChangeRate: rate((e) => (e.answerChangeCount ?? 0) > 0),
      totalEligibleEvidenceCount: mastery.eligibleEvidenceCount +
          retention.eligibleEvidenceCount +
          fluency.eligibleEvidenceCount,
      schemaVersion: StudentLearningState.currentSchemaVersion,
    );

    state.validate();
    return state;
  }
}
