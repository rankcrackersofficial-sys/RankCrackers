import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_treatment_decision_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_prerequisite_state_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_treatment_decision.dart';

void main() {
  test('blocked prerequisite creates blocking repair directive', () {
    final t = DateTime.utc(2026, 8, 16);
    final s = StudentLearningState(
        studentId: 's',
        amtnId: 'a',
        calculatedAtUtc: t,
        masteryProbability: .4,
        masteryBand: StudentMasteryBand.emerging,
        masteryConfidence: StudentLearningStateConfidence.high,
        retentionProbability: .3,
        retentionState: StudentRetentionState.fragile,
        retentionConfidence: StudentLearningStateConfidence.high,
        fluencyScore: .5,
        fluencyPattern: StudentFluencyPattern.slowAndInaccurate,
        fluencyConfidence: StudentLearningStateConfidence.high,
        prerequisiteReadiness: StudentPrerequisiteReadiness.blocked,
        prerequisiteConfidence: StudentLearningStateConfidence.high,
        hintDependencyRate: .4,
        explanationDependencyRate: .4,
        retryRate: .4,
        answerChangeRate: .1,
        totalEligibleEvidenceCount: 10,
        schemaVersion: 2);
    final p = StudentPrerequisiteDiagnosis(
        studentId: 's',
        targetAmtnId: 'a',
        calculatedAtUtc: t,
        readiness: StudentPrerequisiteReadiness.blocked,
        confidence: StudentLearningStateConfidence.high,
        blockingPrerequisiteAmtnIds: ['p'],
        weakPrerequisiteAmtnIds: const []);
    final d = const StudentTreatmentDecisionEngine()
        .decide(state: s, prerequisite: p, createdAtUtc: t);
    expect(d.directives.first.type, StudentTreatmentType.prerequisiteRepair);
    expect(d.directives.first.urgency, StudentTreatmentUrgency.blocking);
  });
}
