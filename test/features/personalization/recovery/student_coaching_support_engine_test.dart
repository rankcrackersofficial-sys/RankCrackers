import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_coaching_support_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_coaching_support.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_treatment_decision.dart';

void main() {
  group('StudentCoachingSupportEngine', () {
    test('routes mentorship only on governed mentor trigger', () {
      final decision = const StudentCoachingSupportEngine().mentorship(
        bridge: _bridge(),
        state: _state(),
        treatmentDecision: _treatment(StudentTreatmentType.mentorReview),
        nowUtc: _now,
      );

      expect(decision.status, StudentCoachingSupportStatus.ready);
      expect(decision.supportRouteId, 'mentor:pub-1');
    });

    test('blocks mentorship when trigger is absent', () {
      final decision = const StudentCoachingSupportEngine().mentorship(
        bridge: _bridge(),
        state: _state(),
        treatmentDecision: _treatment(StudentTreatmentType.maintain),
        nowUtc: _now,
      );

      expect(decision.status, StudentCoachingSupportStatus.blocked);
      expect(
        decision.reasons,
        contains(StudentCoachingSupportReason.noGovernedTrigger),
      );
    });

    test('blocks stale public projections', () {
      final decision = const StudentCoachingSupportEngine().engagementSupport(
        bridge: _bridge(status: AafPublicProjectionStatus.superseded),
        state: _state(totalEvidence: 0),
        nowUtc: _now,
      );

      expect(decision.status, StudentCoachingSupportStatus.blocked);
      expect(
        decision.reasons,
        contains(StudentCoachingSupportReason.bridgeRejected),
      );
    });

    test('routes doubts only to existing grounded support', () {
      final decision = const StudentCoachingSupportEngine().doubtResolution(
        bridge: _bridge(),
        state: _state(),
        nowUtc: _now,
        groundedSupportRouteIds: const <String>['support-block-1'],
      );

      expect(decision.status, StudentCoachingSupportStatus.ready);
      expect(decision.supportRouteId, 'support-block-1');
    });
  });
}

final _now = DateTime.utc(2026, 8, 18, 8);

AafPersonalizationBridgeAuthority _bridge({
  AafPublicProjectionStatus status = AafPublicProjectionStatus.current,
}) =>
    AafPersonalizationBridgeAuthority(
      studentId: 'student-1',
      targetAmtnId: 'amtn-1',
      canonicalSemanticTopicId: 'topic-1',
      canonicalKnowledgeVersion: 3,
      publicProjectionId: 'pub-1',
      status: status,
      studentStateVersion: 2,
      treatmentDecisionVersion: 2,
      routeVersion: 1,
      createdAtUtc: _now,
      schemaVersion: AafPersonalizationBridgeAuthority.currentSchemaVersion,
    );

StudentLearningState _state({int totalEvidence = 12}) => StudentLearningState(
      studentId: 'student-1',
      amtnId: 'amtn-1',
      calculatedAtUtc: _now,
      masteryProbability: 0.72,
      masteryBand: StudentMasteryBand.proficient,
      masteryConfidence: StudentLearningStateConfidence.high,
      retentionProbability: 0.51,
      retentionState: StudentRetentionState.unstable,
      retentionConfidence: StudentLearningStateConfidence.medium,
      fluencyScore: 0.64,
      fluencyPattern: StudentFluencyPattern.balanced,
      fluencyConfidence: StudentLearningStateConfidence.medium,
      prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
      prerequisiteConfidence: StudentLearningStateConfidence.high,
      hintDependencyRate: 0.1,
      explanationDependencyRate: 0.1,
      retryRate: 0.1,
      answerChangeRate: 0.1,
      totalEligibleEvidenceCount: totalEvidence,
      schemaVersion: StudentLearningState.currentSchemaVersion,
    );

StudentTreatmentDecision _treatment(StudentTreatmentType type) =>
    StudentTreatmentDecision(
      studentId: 'student-1',
      targetAmtnId: 'amtn-1',
      createdAtUtc: _now,
      directives: <StudentTreatmentDirective>[
        StudentTreatmentDirective(
          type: type,
          targetAmtnId: 'amtn-1',
          reasons: const <StudentTreatmentReason>{
            StudentTreatmentReason.conflictingEvidence,
          },
          urgency: StudentTreatmentUrgency.normal,
          surfaces: const <StudentTreatmentSurface>{
            StudentTreatmentSurface.digibook,
          },
        ),
      ],
      schemaVersion: StudentTreatmentDecision.currentSchemaVersion,
    );
