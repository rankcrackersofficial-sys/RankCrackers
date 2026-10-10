import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_learning_state_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_mastery_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_retention_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_fluency_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';

void main() {
  test('aggregate state preserves independent dimensions', () {
    final t = DateTime.utc(2026, 8, 16);
    final s = const StudentLearningStateEngine().assemble(
        studentId: 's',
        amtnId: 'a',
        missionId: 'jee_main_2026',
        calculatedAtUtc: t,
        rawEvents: const [],
        mastery: StudentMasteryEstimate(
            studentId: 's',
            amtnId: 'a',
            missionId: 'jee_main_2026',
            calculatedAtUtc: t,
            probability: null,
            band: StudentMasteryBand.unknown,
            confidence: StudentLearningStateConfidence.insufficient,
            eligibleEvidenceCount: 0,
            excludedEvidenceCount: 0),
        retention: StudentRetentionEstimate(
            studentId: 's',
            amtnId: 'a',
            missionId: 'jee_main_2026',
            calculatedAtUtc: t,
            probability: null,
            state: StudentRetentionState.unknown,
            confidence: StudentLearningStateConfidence.insufficient,
            eligibleEvidenceCount: 0),
        fluency: StudentFluencyEstimate(
            studentId: 's',
            amtnId: 'a',
            missionId: 'jee_main_2026',
            calculatedAtUtc: t,
            score: null,
            pattern: StudentFluencyPattern.unknown,
            confidence: StudentLearningStateConfidence.insufficient,
            eligibleEvidenceCount: 0,
            accuracy: null,
            medianTimingRatio: null),
        prerequisiteReadiness: StudentPrerequisiteReadiness.unknown,
        prerequisiteConfidence: StudentLearningStateConfidence.insufficient);
    expect(s.hasAnyInsufficientDimension, isTrue);
  });
}
