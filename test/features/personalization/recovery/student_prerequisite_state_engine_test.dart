import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_prerequisite_state_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';

StudentLearningState state(String a, StudentMasteryBand band) =>
    StudentLearningState(
        studentId: 's',
        amtnId: a,
        missionId: 'jee_main_2026',
        calculatedAtUtc: DateTime.utc(2026, 8, 16),
        masteryProbability: .3,
        masteryBand: band,
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
        totalEligibleEvidenceCount: 3,
        schemaVersion: 3);
void main() {
  test('emerging prerequisite blocks target', () {
    final d = const StudentPrerequisiteStateEngine().diagnose(
        studentId: 's',
        targetAmtnId: 'target',
        missionId: 'jee_main_2026',
        calculatedAtUtc: DateTime.utc(2026, 8, 17),
        prerequisiteStates: {'p': state('p', StudentMasteryBand.emerging)});
    expect(d.readiness, StudentPrerequisiteReadiness.blocked);
    expect(d.blockingPrerequisiteAmtnIds, ['p']);
  });
}
