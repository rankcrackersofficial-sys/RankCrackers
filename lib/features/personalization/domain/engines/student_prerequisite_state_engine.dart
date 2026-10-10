/// RankCrackers deterministic prerequisite readiness engine.
/// CODE NO: PERS-08-R2
library;

import '../models/student_learning_state.dart';

final class StudentPrerequisiteDiagnosis {
  const StudentPrerequisiteDiagnosis({
    required this.studentId,
    required this.targetAmtnId,
    required this.missionId,
    required this.calculatedAtUtc,
    required this.readiness,
    required this.confidence,
    required this.blockingPrerequisiteAmtnIds,
    required this.weakPrerequisiteAmtnIds,
  });

  final String studentId;
  final String targetAmtnId;
  final String missionId;
  final DateTime calculatedAtUtc;
  final StudentPrerequisiteReadiness readiness;
  final StudentLearningStateConfidence confidence;
  final List<String> blockingPrerequisiteAmtnIds;
  final List<String> weakPrerequisiteAmtnIds;
}

final class StudentPrerequisiteStateEngine {
  const StudentPrerequisiteStateEngine();

  StudentPrerequisiteDiagnosis diagnose({
    required String studentId,
    required String targetAmtnId,
    required String missionId,
    required DateTime calculatedAtUtc,
    required Map<String, StudentLearningState> prerequisiteStates,
  }) {
    if (!calculatedAtUtc.isUtc) {
      throw const FormatException('calculatedAtUtc must be UTC.');
    }
    if (prerequisiteStates.isEmpty) {
      return StudentPrerequisiteDiagnosis(
        studentId: studentId,
        targetAmtnId: targetAmtnId,
        missionId: missionId,
        calculatedAtUtc: calculatedAtUtc,
        readiness: StudentPrerequisiteReadiness.ready,
        confidence: StudentLearningStateConfidence.high,
        blockingPrerequisiteAmtnIds: const [],
        weakPrerequisiteAmtnIds: const [],
      );
    }

    final blocking = <String>[];
    final weak = <String>[];
    var insufficient = false;

    for (final entry in prerequisiteStates.entries) {
      final s = entry.value;
      if (s.studentId != studentId || s.amtnId != entry.key) {
        throw const FormatException('Prerequisite state identity mismatch.');
      }

      if (s.masteryConfidence == StudentLearningStateConfidence.insufficient) {
        insufficient = true;
        weak.add(entry.key);
        continue;
      }

      if (s.masteryBand == StudentMasteryBand.emerging) {
        blocking.add(entry.key);
      } else if (s.masteryBand == StudentMasteryBand.developing) {
        weak.add(entry.key);
      }
    }

    if (blocking.isNotEmpty) {
      return StudentPrerequisiteDiagnosis(
        studentId: studentId,
        targetAmtnId: targetAmtnId,
        missionId: missionId,
        calculatedAtUtc: calculatedAtUtc,
        readiness: StudentPrerequisiteReadiness.blocked,
        confidence: StudentLearningStateConfidence.high,
        blockingPrerequisiteAmtnIds: List.unmodifiable(blocking),
        weakPrerequisiteAmtnIds: List.unmodifiable(weak),
      );
    }

    if (weak.isNotEmpty || insufficient) {
      return StudentPrerequisiteDiagnosis(
        studentId: studentId,
        targetAmtnId: targetAmtnId,
        missionId: missionId,
        calculatedAtUtc: calculatedAtUtc,
        readiness: StudentPrerequisiteReadiness.partial,
        confidence: insufficient
            ? StudentLearningStateConfidence.low
            : StudentLearningStateConfidence.medium,
        blockingPrerequisiteAmtnIds: const [],
        weakPrerequisiteAmtnIds: List.unmodifiable(weak),
      );
    }

    return StudentPrerequisiteDiagnosis(
      studentId: studentId,
      targetAmtnId: targetAmtnId,
      missionId: missionId,
      calculatedAtUtc: calculatedAtUtc,
      readiness: StudentPrerequisiteReadiness.ready,
      confidence: StudentLearningStateConfidence.high,
      blockingPrerequisiteAmtnIds: const [],
      weakPrerequisiteAmtnIds: const [],
    );
  }
}
