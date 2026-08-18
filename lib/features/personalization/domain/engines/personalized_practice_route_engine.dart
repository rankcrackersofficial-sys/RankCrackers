/// Selects existing verified practice items only.
library;

import '../models/aaf_personalization_bridge.dart';
import '../models/personalized_practice_route.dart';
import '../models/student_learning_state.dart';

final class PersonalizedPracticeRouteEngine {
  const PersonalizedPracticeRouteEngine();

  PersonalizedPracticeRoute buildRoute({
    required AafPersonalizationBridgeAuthority bridge,
    required StudentLearningState state,
    required DateTime nowUtc,
    required List<VerifiedPracticeItem> availableItems,
    int limit = 5,
  }) {
    if (!nowUtc.isUtc) {
      throw const FormatException('nowUtc must be UTC.');
    }
    if (limit <= 0) {
      throw const FormatException('limit must be positive.');
    }

    final bridgeFailure = _bridgeFailure(bridge);
    if (bridgeFailure != null) {
      return _blocked(bridge, nowUtc, <PersonalizedPracticeRouteReason>{
        bridgeFailure,
      });
    }

    state.validate();
    if (bridge.studentId != state.studentId ||
        bridge.targetAmtnId != state.amtnId) {
      return _blocked(bridge, nowUtc, const <PersonalizedPracticeRouteReason>{
        PersonalizedPracticeRouteReason.identityMismatch,
      });
    }

    final selected = availableItems.where((item) {
      item.validate();
      return item.isVerified &&
          item.isCurrent &&
          item.targetAmtnId == bridge.targetAmtnId &&
          item.canonicalSemanticTopicId == bridge.canonicalSemanticTopicId &&
          item.canonicalKnowledgeVersion == bridge.canonicalKnowledgeVersion &&
          item.publicProjectionId == bridge.publicProjectionId;
    }).toList()
      ..sort((a, b) => a.difficultyRank.compareTo(b.difficultyRank));

    if (selected.isEmpty) {
      return _blocked(bridge, nowUtc, const <PersonalizedPracticeRouteReason>{
        PersonalizedPracticeRouteReason.noVerifiedItem,
      });
    }

    final route = PersonalizedPracticeRoute(
      studentId: bridge.studentId,
      targetAmtnId: bridge.targetAmtnId,
      canonicalSemanticTopicId: bridge.canonicalSemanticTopicId,
      canonicalKnowledgeVersion: bridge.canonicalKnowledgeVersion,
      publicProjectionId: bridge.publicProjectionId,
      studentStateVersion: bridge.studentStateVersion,
      routeVersion: PersonalizedPracticeRoute.currentSchemaVersion,
      createdAtUtc: nowUtc,
      status: PersonalizedPracticeRouteStatus.ready,
      reasons: const <PersonalizedPracticeRouteReason>{
        PersonalizedPracticeRouteReason.verifiedItemSelected,
      },
      practiceItemIds: selected
          .take(limit)
          .map((item) => item.itemId)
          .toList(growable: false),
      schemaVersion: PersonalizedPracticeRoute.currentSchemaVersion,
    );
    route.validate();
    return route;
  }

  PersonalizedPracticeRouteReason? _bridgeFailure(
    AafPersonalizationBridgeAuthority bridge,
  ) {
    try {
      bridge.validate();
      return null;
    } on FormatException {
      return PersonalizedPracticeRouteReason.withdrawnProjection;
    }
  }

  PersonalizedPracticeRoute _blocked(
    AafPersonalizationBridgeAuthority bridge,
    DateTime nowUtc,
    Set<PersonalizedPracticeRouteReason> reasons,
  ) {
    final route = PersonalizedPracticeRoute(
      studentId: bridge.studentId,
      targetAmtnId: bridge.targetAmtnId,
      canonicalSemanticTopicId: bridge.canonicalSemanticTopicId,
      canonicalKnowledgeVersion: bridge.canonicalKnowledgeVersion,
      publicProjectionId: bridge.publicProjectionId,
      studentStateVersion: bridge.studentStateVersion,
      routeVersion: PersonalizedPracticeRoute.currentSchemaVersion,
      createdAtUtc: nowUtc,
      status: PersonalizedPracticeRouteStatus.blocked,
      reasons: reasons,
      practiceItemIds: const <String>[],
      schemaVersion: PersonalizedPracticeRoute.currentSchemaVersion,
    );
    route.validate();
    return route;
  }
}
