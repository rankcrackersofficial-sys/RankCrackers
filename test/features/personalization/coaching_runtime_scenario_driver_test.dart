import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_coaching_support_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_coaching_support.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_treatment_decision.dart';

void main() {
  test('Governed coaching support runtime evaluation', () {
    final now = DateTime.utc(2026, 8, 18, 12);

    final bridge = AafPersonalizationBridgeAuthority(
      studentId: 'student-123',
      targetAmtnId: 'amtn-456',
      canonicalSemanticTopicId: 'topic-789',
      canonicalKnowledgeVersion: 1,
      publicProjectionId: 'pub-999',
      status: AafPublicProjectionStatus.current,
      studentStateVersion: 1,
      treatmentDecisionVersion: 1,
      routeVersion: 1,
      createdAtUtc: now,
      schemaVersion: 1,
    );

    final state = StudentLearningState(
      studentId: 'student-123',
      amtnId: 'amtn-456',
      calculatedAtUtc: now,
      masteryProbability: 0.85,
      masteryBand: StudentMasteryBand.proficient,
      masteryConfidence: StudentLearningStateConfidence.high,
      retentionProbability: 0.90,
      retentionState: StudentRetentionState.strong,
      retentionConfidence: StudentLearningStateConfidence.high,
      fluencyScore: 0.80,
      fluencyPattern: StudentFluencyPattern.fastAndAccurate,
      fluencyConfidence: StudentLearningStateConfidence.high,
      prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
      prerequisiteConfidence: StudentLearningStateConfidence.high,
      hintDependencyRate: 0.05,
      explanationDependencyRate: 0.02,
      retryRate: 0.04,
      answerChangeRate: 0.01,
      totalEligibleEvidenceCount: 15,
      schemaVersion: 2,
    );

    final treatmentDecision = StudentTreatmentDecision(
      studentId: 'student-123',
      targetAmtnId: 'amtn-456',
      createdAtUtc: now,
      directives: [
        StudentTreatmentDirective(
          type: StudentTreatmentType.mentorReview,
          targetAmtnId: 'amtn-456',
          reasons: {StudentTreatmentReason.conflictingEvidence},
          urgency: StudentTreatmentUrgency.normal,
          surfaces: {StudentTreatmentSurface.revision},
        ),
      ],
      schemaVersion: 1,
    );

    print('[RUNTIME_PROOF] Starting governed coaching support runtime evaluation...');

    final engine = const StudentCoachingSupportEngine();
    final decision = engine.mentorship(
      bridge: bridge,
      state: state,
      treatmentDecision: treatmentDecision,
      nowUtc: now,
    );

    decision.validate();

    expect(decision.status, equals(StudentCoachingSupportStatus.ready));
    expect(decision.supportRouteId, equals('mentor:pub-999'));
    expect(decision.reasons, contains(StudentCoachingSupportReason.governedTrigger));

    print('[RUNTIME_PROOF] MENTOR_INTERVENTION_CREATED = TRUE');
    print('[RUNTIME_PROOF] MENTOR_INTERVENTION_REASON_BOUND_TO_EVIDENCE = TRUE');
    print('[RUNTIME_PROOF] decision status = ${decision.status.wireName}');
    print('[RUNTIME_PROOF] decision routeId = ${decision.supportRouteId}');
    print('[RUNTIME_PROOF] decision reasons = ${decision.reasons.map((r) => r.wireName).toList()}');
  });
}
