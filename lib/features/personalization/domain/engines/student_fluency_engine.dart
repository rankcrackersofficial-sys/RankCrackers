/// RankCrackers deterministic Student Fluency Engine.
/// CODE NO: PERS-06-R2
library;

import '../models/student_evidence_event.dart';
import '../models/student_learning_state.dart';
import '../policies/student_evidence_policy.dart';

final class StudentFluencyEstimate {
  const StudentFluencyEstimate({
    required this.studentId,
    required this.amtnId,
    required this.missionId,
    required this.calculatedAtUtc,
    required this.score,
    required this.pattern,
    required this.confidence,
    required this.eligibleEvidenceCount,
    required this.accuracy,
    required this.medianTimingRatio,
  });

  final String studentId;
  final String amtnId;
  final String missionId;
  final DateTime calculatedAtUtc;
  final double? score;
  final StudentFluencyPattern pattern;
  final StudentLearningStateConfidence confidence;
  final int eligibleEvidenceCount;
  final double? accuracy;
  final double? medianTimingRatio;
}

final class StudentFluencyEngine {
  const StudentFluencyEngine({this.minimumEvidenceCount = 3});

  final int minimumEvidenceCount;

  StudentFluencyEstimate calculate({
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
    final accepted = <StudentEvidenceEvent>[];
    for (final e in events) {
      if (e.studentId == studentId &&
          e.missionId == missionId &&
          e.amtnId == amtnId &&
          policy.evaluate(e, StudentEvidenceUse.fluency).eligible) {
        accepted.add(e);
      }
    }

    if (accepted.length < minimumEvidenceCount) {
      return StudentFluencyEstimate(
        studentId: studentId,
        amtnId: amtnId,
        missionId: missionId,
        calculatedAtUtc: calculatedAtUtc,
        score: null,
        pattern: StudentFluencyPattern.unknown,
        confidence: StudentLearningStateConfidence.insufficient,
        eligibleEvidenceCount: accepted.length,
        accuracy: null,
        medianTimingRatio: null,
      );
    }

    final accuracy = accepted
            .where((e) => e.answerOutcome == StudentAnswerOutcome.correct)
            .length /
        accepted.length;

    final ratios = accepted
        .map((e) => e.activeDurationMs! / e.expectedDurationMs!)
        .toList()
      ..sort();
    final ratio = ratios.length.isOdd
        ? ratios[ratios.length ~/ 2]
        : (ratios[ratios.length ~/ 2 - 1] + ratios[ratios.length ~/ 2]) / 2;

    final speedScore = (1.0 / ratio).clamp(0.0, 1.0);
    final score = (0.65 * accuracy + 0.35 * speedScore).clamp(0.0, 1.0);

    return StudentFluencyEstimate(
      studentId: studentId,
      amtnId: amtnId,
      missionId: missionId,
      calculatedAtUtc: calculatedAtUtc,
      score: score,
      pattern: _pattern(accuracy, ratio),
      confidence: accepted.length >= 8
          ? StudentLearningStateConfidence.high
          : accepted.length >= 5
              ? StudentLearningStateConfidence.medium
              : StudentLearningStateConfidence.low,
      eligibleEvidenceCount: accepted.length,
      accuracy: accuracy,
      medianTimingRatio: ratio,
    );
  }

  StudentFluencyPattern _pattern(double accuracy, double ratio) {
    final fast = ratio <= 0.90;
    final slow = ratio >= 1.20;
    final accurate = accuracy >= 0.80;
    final inaccurate = accuracy < 0.65;

    if (fast && accurate) return StudentFluencyPattern.fastAndAccurate;
    if (fast && inaccurate) return StudentFluencyPattern.fastButInaccurate;
    if (slow && accurate) return StudentFluencyPattern.slowAndAccurate;
    if (slow && inaccurate) return StudentFluencyPattern.slowAndInaccurate;
    return StudentFluencyPattern.balanced;
  }
}
