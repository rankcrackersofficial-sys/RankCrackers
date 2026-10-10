import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';

void main() {
  StudentLearningState validState() {
    return StudentLearningState(
      studentId: 's-1',
      amtnId: 'amtn-1',
      missionId: 'jee_main_2026',
      calculatedAtUtc: DateTime.utc(2026, 8, 16, 10),
      masteryProbability: 0.8,
      masteryBand: StudentMasteryBand.proficient,
      masteryConfidence: StudentLearningStateConfidence.high,
      retentionProbability: 0.75,
      retentionState: StudentRetentionState.stable,
      retentionConfidence: StudentLearningStateConfidence.medium,
      fluencyScore: 0.7,
      fluencyPattern: StudentFluencyPattern.balanced,
      fluencyConfidence: StudentLearningStateConfidence.medium,
      prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
      prerequisiteConfidence: StudentLearningStateConfidence.high,
      hintDependencyRate: 0.1,
      explanationDependencyRate: 0.2,
      retryRate: 0.05,
      answerChangeRate: 0.1,
      totalEligibleEvidenceCount: 12,
      schemaVersion: StudentLearningState.currentSchemaVersion,
    );
  }

  test('valid learning state round-trips', () {
    final original = validState();
    final restored = StudentLearningState.fromJson(original.toJson());

    expect(restored.studentId, 's-1');
    expect(restored.masteryBand, StudentMasteryBand.proficient);
    expect(restored.retentionState, StudentRetentionState.stable);
    expect(restored.fluencyPattern, StudentFluencyPattern.balanced);
    expect(
      restored.prerequisiteReadiness,
      StudentPrerequisiteReadiness.ready,
    );
  });

  test('probabilities outside zero-one range fail closed', () {
    final state = StudentLearningState(
      studentId: 's',
      amtnId: 'a',
      missionId: 'jee_main_2026',
      calculatedAtUtc: DateTime.utc(2026, 8, 16),
      masteryProbability: 1.2,
      masteryBand: StudentMasteryBand.mastered,
      masteryConfidence: StudentLearningStateConfidence.high,
      retentionProbability: null,
      retentionState: StudentRetentionState.unknown,
      retentionConfidence: StudentLearningStateConfidence.insufficient,
      fluencyScore: null,
      fluencyPattern: StudentFluencyPattern.unknown,
      fluencyConfidence: StudentLearningStateConfidence.insufficient,
      prerequisiteReadiness: StudentPrerequisiteReadiness.unknown,
      prerequisiteConfidence: StudentLearningStateConfidence.insufficient,
      hintDependencyRate: null,
      explanationDependencyRate: null,
      retryRate: null,
      answerChangeRate: null,
      totalEligibleEvidenceCount: 1,
      schemaVersion: StudentLearningState.currentSchemaVersion,
    );

    expect(state.validate, throwsFormatException);
  });

  test('insufficient confidence requires unknown band/state', () {
    final state = StudentLearningState(
      studentId: 's',
      amtnId: 'a',
      missionId: 'jee_main_2026',
      calculatedAtUtc: DateTime.utc(2026, 8, 16),
      masteryProbability: null,
      masteryBand: StudentMasteryBand.emerging,
      masteryConfidence: StudentLearningStateConfidence.insufficient,
      retentionProbability: null,
      retentionState: StudentRetentionState.unknown,
      retentionConfidence: StudentLearningStateConfidence.insufficient,
      fluencyScore: null,
      fluencyPattern: StudentFluencyPattern.unknown,
      fluencyConfidence: StudentLearningStateConfidence.insufficient,
      prerequisiteReadiness: StudentPrerequisiteReadiness.unknown,
      prerequisiteConfidence: StudentLearningStateConfidence.insufficient,
      hintDependencyRate: null,
      explanationDependencyRate: null,
      retryRate: null,
      answerChangeRate: null,
      totalEligibleEvidenceCount: 0,
      schemaVersion: StudentLearningState.currentSchemaVersion,
    );

    expect(state.validate, throwsFormatException);
  });
}
