import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_schedule_support_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_schedule_support.dart';

void main() {
  group('StudentScheduleSupportEngine', () {
    test('creates UTC-safe deterministic schedule', () {
      final support = const StudentScheduleSupportEngine().schedule(
        bridge: _bridge(),
        state: _state(StudentRetentionState.fragile),
        nowUtc: _now,
      );

      expect(support.status, StudentScheduleSupportStatus.scheduled);
      expect(support.nextActionAtUtc, _now.add(const Duration(hours: 12)));
    });

    test('blocks unsafe public projection route', () {
      final support = const StudentScheduleSupportEngine().schedule(
        bridge: _bridge(status: AafPublicProjectionStatus.unverified),
        state: _state(StudentRetentionState.fragile),
        nowUtc: _now,
      );

      expect(support.status, StudentScheduleSupportStatus.blocked);
      expect(support.reason, StudentScheduleSupportReason.bridgeRejected);
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

StudentLearningState _state(StudentRetentionState retentionState) =>
    StudentLearningState(
      studentId: 'student-1',
      amtnId: 'amtn-1',
      calculatedAtUtc: _now,
      masteryProbability: 0.7,
      masteryBand: StudentMasteryBand.proficient,
      masteryConfidence: StudentLearningStateConfidence.high,
      retentionProbability: 0.3,
      retentionState: retentionState,
      retentionConfidence: StudentLearningStateConfidence.medium,
      fluencyScore: 0.6,
      fluencyPattern: StudentFluencyPattern.balanced,
      fluencyConfidence: StudentLearningStateConfidence.medium,
      prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
      prerequisiteConfidence: StudentLearningStateConfidence.high,
      hintDependencyRate: 0.1,
      explanationDependencyRate: 0.1,
      retryRate: 0.1,
      answerChangeRate: 0.1,
      totalEligibleEvidenceCount: 6,
      schemaVersion: StudentLearningState.currentSchemaVersion,
    );
