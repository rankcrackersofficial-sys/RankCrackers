/// RankCrackers deterministic Student Retention Engine.
/// CODE NO: PERS-05-R2
library;

import 'dart:math' as math;
import '../models/student_evidence_event.dart';
import '../models/student_learning_state.dart';
import '../policies/student_evidence_policy.dart';

final class StudentRetentionEstimate {
  const StudentRetentionEstimate({
    required this.studentId,
    required this.amtnId,
    required this.missionId,
    required this.calculatedAtUtc,
    required this.probability,
    required this.state,
    required this.confidence,
    required this.eligibleEvidenceCount,
  });

  final String studentId;
  final String amtnId;
  final String missionId;
  final DateTime calculatedAtUtc;
  final double? probability;
  final StudentRetentionState state;
  final StudentLearningStateConfidence confidence;
  final int eligibleEvidenceCount;
}

final class StudentRetentionEngine {
  const StudentRetentionEngine({
    this.halfLifeDays = 21.0,
    this.minimumEvidenceCount = 2,
  });

  final double halfLifeDays;
  final int minimumEvidenceCount;

  StudentRetentionEstimate calculate({
    required String studentId,
    required String amtnId,
    required String missionId,
    required DateTime calculatedAtUtc,
    required Iterable<StudentEvidenceEvent> events,
  }) {
    if (!calculatedAtUtc.isUtc) {
      throw const FormatException('calculatedAtUtc must be UTC.');
    }

    const policy = StudentEvidencePolicy();
    final eligible = <StudentEvidenceEvent>[];

    for (final e in events) {
      if (e.studentId != studentId || e.missionId != missionId || e.amtnId != amtnId) continue;
      if (policy.evaluate(e, StudentEvidenceUse.retention).eligible) {
        eligible.add(e);
      }
    }

    if (eligible.length < minimumEvidenceCount) {
      return StudentRetentionEstimate(
        studentId: studentId,
        amtnId: amtnId,
        missionId: missionId,
        calculatedAtUtc: calculatedAtUtc,
        probability: null,
        state: StudentRetentionState.unknown,
        confidence: StudentLearningStateConfidence.insufficient,
        eligibleEvidenceCount: eligible.length,
      );
    }

    var weightedSuccess = 0.0;
    var totalWeight = 0.0;

    for (final e in eligible) {
      final ageDays = math.max(
        0.0,
        calculatedAtUtc.difference(e.occurredAtUtc).inMinutes / 1440.0,
      );
      final recency =
          math.pow(0.5, ageDays / halfLifeDays).toDouble().clamp(0.10, 1.0);
      final success = _successValue(e);
      weightedSuccess += success * recency;
      totalWeight += recency;
    }

    final p = (weightedSuccess / totalWeight).clamp(0.0, 1.0);
    return StudentRetentionEstimate(
      studentId: studentId,
      amtnId: amtnId,
      missionId: missionId,
      calculatedAtUtc: calculatedAtUtc,
      probability: p,
      state: _state(p),
      confidence: eligible.length >= 6
          ? StudentLearningStateConfidence.high
          : eligible.length >= 4
              ? StudentLearningStateConfidence.medium
              : StudentLearningStateConfidence.low,
      eligibleEvidenceCount: eligible.length,
    );
  }

  double _successValue(StudentEvidenceEvent event) {
    if (event.action == StudentEvidenceAction.nodeCompleted ||
        event.action == StudentEvidenceAction.revisionCompleted ||
        event.action == StudentEvidenceAction.diagnosticCompleted ||
        event.action == StudentEvidenceAction.mentorVerified) {
      return 1.0;
    }
    return event.answerOutcome == StudentAnswerOutcome.correct ? 1.0 : 0.0;
  }

  StudentRetentionState _state(double p) {
    if (p < 0.40) return StudentRetentionState.fragile;
    if (p < 0.62) return StudentRetentionState.unstable;
    if (p < 0.82) return StudentRetentionState.stable;
    return StudentRetentionState.strong;
  }
}
