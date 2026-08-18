/// RankCrackers deterministic Student Mastery Engine.
/// CODE NO: PERS-04-R2
library;

import 'dart:math' as math;
import '../models/student_evidence_event.dart';
import '../models/student_learning_state.dart';
import '../policies/student_evidence_policy.dart';

enum StudentMasteryExclusionReason {
  wrongStudent,
  wrongAmtn,
  policyRejected,
}

final class StudentMasteryEstimate {
  const StudentMasteryEstimate({
    required this.studentId,
    required this.amtnId,
    required this.calculatedAtUtc,
    required this.probability,
    required this.band,
    required this.confidence,
    required this.eligibleEvidenceCount,
    required this.excludedEvidenceCount,
  });

  final String studentId;
  final String amtnId;
  final DateTime calculatedAtUtc;
  final double? probability;
  final StudentMasteryBand band;
  final StudentLearningStateConfidence confidence;
  final int eligibleEvidenceCount;
  final int excludedEvidenceCount;
}

final class StudentMasteryEngine {
  const StudentMasteryEngine({
    this.priorAlpha = 2.0,
    this.priorBeta = 2.0,
    this.recencyHalfLifeDays = 30.0,
    this.minimumRecencyWeight = 0.25,
    this.minimumEvidenceCount = 3,
  });

  final double priorAlpha;
  final double priorBeta;
  final double recencyHalfLifeDays;
  final double minimumRecencyWeight;
  final int minimumEvidenceCount;

  StudentMasteryEstimate calculate({
    required String studentId,
    required String amtnId,
    required DateTime calculatedAtUtc,
    required Iterable<StudentEvidenceEvent> events,
  }) {
    if (studentId.trim().isEmpty || amtnId.trim().isEmpty) {
      throw const FormatException('studentId/amtnId must not be empty.');
    }
    if (!calculatedAtUtc.isUtc) {
      throw const FormatException('calculatedAtUtc must be UTC.');
    }

    const policy = StudentEvidencePolicy();
    var alpha = priorAlpha;
    var beta = priorBeta;
    var eligible = 0;
    var excluded = 0;

    for (final event in events) {
      if (event.studentId != studentId) {
        excluded++;
        continue;
      }
      if (event.amtnId != amtnId) {
        excluded++;
        continue;
      }
      final eligibility = policy.evaluate(event, StudentEvidenceUse.mastery);
      if (!eligibility.eligible) {
        excluded++;
        continue;
      }

      eligible++;
      final weight = _difficultyWeight(event.difficulty) *
          _confidenceWeight(event.sourceConfidence) *
          _recencyWeight(event.occurredAtUtc, calculatedAtUtc);

      switch (event.answerOutcome) {
        case StudentAnswerOutcome.correct:
          alpha += weight;
          break;
        case StudentAnswerOutcome.incorrect:
          beta += weight;
          break;
        case StudentAnswerOutcome.partiallyCorrect:
        case StudentAnswerOutcome.unanswered:
        case StudentAnswerOutcome.notApplicable:
          throw StateError('Policy admitted unsupported mastery outcome.');
      }
    }

    if (eligible < minimumEvidenceCount) {
      return StudentMasteryEstimate(
        studentId: studentId,
        amtnId: amtnId,
        calculatedAtUtc: calculatedAtUtc,
        probability: null,
        band: StudentMasteryBand.unknown,
        confidence: StudentLearningStateConfidence.insufficient,
        eligibleEvidenceCount: eligible,
        excludedEvidenceCount: excluded,
      );
    }

    final probability = alpha / (alpha + beta);
    return StudentMasteryEstimate(
      studentId: studentId,
      amtnId: amtnId,
      calculatedAtUtc: calculatedAtUtc,
      probability: probability,
      band: _band(probability),
      confidence: _confidence(eligible),
      eligibleEvidenceCount: eligible,
      excludedEvidenceCount: excluded,
    );
  }

  double _difficultyWeight(StudentEvidenceDifficulty difficulty) {
    switch (difficulty) {
      case StudentEvidenceDifficulty.unknown:
        return 0.75;
      case StudentEvidenceDifficulty.foundational:
        return 0.85;
      case StudentEvidenceDifficulty.easy:
        return 0.90;
      case StudentEvidenceDifficulty.medium:
        return 1.00;
      case StudentEvidenceDifficulty.hard:
        return 1.10;
      case StudentEvidenceDifficulty.advanced:
        return 1.20;
    }
  }

  double _confidenceWeight(StudentEvidenceConfidence confidence) {
    switch (confidence) {
      case StudentEvidenceConfidence.unknown:
      case StudentEvidenceConfidence.low:
        return 0.0;
      case StudentEvidenceConfidence.medium:
        return 0.85;
      case StudentEvidenceConfidence.high:
        return 1.00;
    }
  }

  double _recencyWeight(DateTime occurred, DateTime calculated) {
    final ageDays =
        math.max(0.0, calculated.difference(occurred).inMinutes / 1440.0);
    final raw = math.pow(0.5, ageDays / recencyHalfLifeDays).toDouble();
    return math.max(minimumRecencyWeight, raw);
  }

  StudentMasteryBand _band(double p) {
    if (p < 0.45) return StudentMasteryBand.emerging;
    if (p < 0.65) return StudentMasteryBand.developing;
    if (p < 0.82) return StudentMasteryBand.proficient;
    return StudentMasteryBand.mastered;
  }

  StudentLearningStateConfidence _confidence(int count) {
    if (count < minimumEvidenceCount) {
      return StudentLearningStateConfidence.insufficient;
    }
    if (count < 5) return StudentLearningStateConfidence.low;
    if (count < 8) return StudentLearningStateConfidence.medium;
    return StudentLearningStateConfidence.high;
  }
}
