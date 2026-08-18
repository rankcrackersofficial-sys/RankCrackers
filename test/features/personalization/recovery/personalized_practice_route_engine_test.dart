import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/personalized_practice_route_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/personalized_practice_route.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';

void main() {
  group('PersonalizedPracticeRouteEngine', () {
    test('selects only existing verified current items', () {
      final route = const PersonalizedPracticeRouteEngine().buildRoute(
        bridge: _bridge(),
        state: _state(),
        nowUtc: _now,
        availableItems: <VerifiedPracticeItem>[
          _item('item-2', difficultyRank: 2),
          _item('item-1', difficultyRank: 1),
          _item('unverified', isVerified: false),
        ],
      );

      expect(route.status, PersonalizedPracticeRouteStatus.ready);
      expect(route.practiceItemIds, <String>['item-1', 'item-2']);
    });

    test('fails closed when no verified item exists', () {
      final route = const PersonalizedPracticeRouteEngine().buildRoute(
        bridge: _bridge(),
        state: _state(),
        nowUtc: _now,
        availableItems: <VerifiedPracticeItem>[_item('old', isCurrent: false)],
      );

      expect(route.status, PersonalizedPracticeRouteStatus.blocked);
      expect(route.reasons,
          contains(PersonalizedPracticeRouteReason.noVerifiedItem));
    });

    test('blocks withdrawn projection', () {
      final route = const PersonalizedPracticeRouteEngine().buildRoute(
        bridge: _bridge(status: AafPublicProjectionStatus.withdrawn),
        state: _state(),
        nowUtc: _now,
        availableItems: <VerifiedPracticeItem>[_item('item-1')],
      );

      expect(route.status, PersonalizedPracticeRouteStatus.blocked);
      expect(
        route.reasons,
        contains(PersonalizedPracticeRouteReason.withdrawnProjection),
      );
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

VerifiedPracticeItem _item(
  String itemId, {
  bool isVerified = true,
  bool isCurrent = true,
  int difficultyRank = 1,
}) =>
    VerifiedPracticeItem(
      itemId: itemId,
      targetAmtnId: 'amtn-1',
      canonicalSemanticTopicId: 'topic-1',
      canonicalKnowledgeVersion: 3,
      publicProjectionId: 'pub-1',
      isVerified: isVerified,
      isCurrent: isCurrent,
      difficultyRank: difficultyRank,
    );

StudentLearningState _state() => StudentLearningState(
      studentId: 'student-1',
      amtnId: 'amtn-1',
      calculatedAtUtc: _now,
      masteryProbability: 0.5,
      masteryBand: StudentMasteryBand.developing,
      masteryConfidence: StudentLearningStateConfidence.medium,
      retentionProbability: 0.5,
      retentionState: StudentRetentionState.unstable,
      retentionConfidence: StudentLearningStateConfidence.medium,
      fluencyScore: 0.5,
      fluencyPattern: StudentFluencyPattern.balanced,
      fluencyConfidence: StudentLearningStateConfidence.medium,
      prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
      prerequisiteConfidence: StudentLearningStateConfidence.medium,
      hintDependencyRate: 0,
      explanationDependencyRate: 0,
      retryRate: 0,
      answerChangeRate: 0,
      totalEligibleEvidenceCount: 5,
      schemaVersion: StudentLearningState.currentSchemaVersion,
    );
