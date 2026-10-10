import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_personalization_analytics_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_personalization_analytics.dart';

void main() {
  test('analytics derive truth states from governed student state only', () {
    final analytics = const StudentPersonalizationAnalyticsEngine().derive(
      state: StudentLearningState(
        studentId: 'student-1',
        amtnId: 'amtn-1',
        missionId: 'jee_main_2026',
        calculatedAtUtc: DateTime.utc(2026, 8, 18, 8),
        masteryProbability: null,
        masteryBand: StudentMasteryBand.unknown,
        masteryConfidence: StudentLearningStateConfidence.insufficient,
        retentionProbability: 0.8,
        retentionState: StudentRetentionState.stable,
        retentionConfidence: StudentLearningStateConfidence.high,
        fluencyScore: 0.7,
        fluencyPattern: StudentFluencyPattern.balanced,
        fluencyConfidence: StudentLearningStateConfidence.high,
        prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
        prerequisiteConfidence: StudentLearningStateConfidence.medium,
        hintDependencyRate: null,
        explanationDependencyRate: null,
        retryRate: null,
        answerChangeRate: null,
        totalEligibleEvidenceCount: 4,
        schemaVersion: 3,
      ),
      nowUtc: DateTime.utc(2026, 8, 18, 9),
    );

    expect(analytics.masteryTruth, StudentAnalyticsTruthState.insufficient);
    expect(analytics.retentionTruth, StudentAnalyticsTruthState.supported);
    expect(analytics.hasUnsupportedProgressClaim, isTrue);
  });
}
