import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_revision_queue_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_revision_queue.dart';

StudentLearningState s() => StudentLearningState(
    studentId: 's',
    amtnId: 'a',
    missionId: 'jee_main_2026',
    calculatedAtUtc: DateTime.utc(2026, 8, 16),
    masteryProbability: .9,
    masteryBand: StudentMasteryBand.mastered,
    masteryConfidence: StudentLearningStateConfidence.high,
    retentionProbability: .9,
    retentionState: StudentRetentionState.strong,
    retentionConfidence: StudentLearningStateConfidence.high,
    fluencyScore: .9,
    fluencyPattern: StudentFluencyPattern.fastAndAccurate,
    fluencyConfidence: StudentLearningStateConfidence.high,
    prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
    prerequisiteConfidence: StudentLearningStateConfidence.high,
    hintDependencyRate: 0,
    explanationDependencyRate: 0,
    retryRate: 0,
    answerChangeRate: 0,
    totalEligibleEvidenceCount: 20,
    schemaVersion: 3);
void main() {
  test('UTC calendar date determines due today', () {
    final q = const StudentRevisionQueueEngine().build(
        studentId: 's',
        nowUtc: DateTime.utc(2026, 8, 16, 23),
        candidates: [
          StudentRevisionCandidate(
              amtnId: 'a',
              state: s(),
              reviewAtUtc: DateTime.utc(2026, 8, 16, 1))
        ]);
    expect(q.items.single.state, StudentRevisionQueueState.dueToday);
  });
}
