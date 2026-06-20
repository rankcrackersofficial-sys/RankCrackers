import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/battle_session.dart';
import 'package:rank_crackers/core/models/mission_node.dart';
import 'package:rank_crackers/core/models/mastery_node.dart';
import 'package:rank_crackers/core/models/coverage_node.dart';
import 'package:rank_crackers/core/models/risk_node.dart';
import 'package:rank_crackers/core/models/fusion_node.dart';
import 'package:rank_crackers/core/models/campaign_node.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/core/backend/question_repository.dart';
import 'mastery_update_worker.dart';
import 'coverage_update_worker.dart';
import 'risk_worker.dart';
import 'fusion_engine.dart';
import 'campaign_adaptation_engine.dart';

import 'package:collection/collection.dart';

/// 🔱 BATTLE OUTCOME WORKER (Sprint M/N/O/Q Hardened - Blueprint v1.3)
/// Law: Action -> Feedback -> Recalculation. Closes the preparation loop.
class BattleOutcomeWorker {
  
  /// 🔱 CLOSED INTELLIGENCE LOOP
  /// Triggers full stack recalculation after a mission battle.
  static Future<Map<String, dynamic>> finalizeSession({
    required BattleSession session,
    required MissionNode mission,
    required List<MasteryNode> currentMasteryNodes,
    required List<CoverageNode> currentCoverageNodes,
    required double pyqWeightage,
    CampaignNode? activeCampaign, 
  }) async {
    debugPrint("🔱 BATTLE WORKER: Finalizing session ${session.sessionId}. Closing Intelligence Loop...");

    // 🔱 Adaptation Engine (Audit GAP-O-5)
    CampaignNode? adaptedCampaign;
    if (activeCampaign != null) {
      adaptedCampaign = CampaignAdaptationEngine.adapt(
        currentCampaign: activeCampaign, 
        lastSession: session,
      );
    }

    // 🔱 Law: Mission Completion Logic
    if (session.result == MissionResult.FAILED) {
      debugPrint("🔱 BATTLE WORKER: Mission FAILED. Recalculation restricted.");
      return {
        'success': false, 
        'reason': 'Mission failed',
        'adaptedCampaign': adaptedCampaign,
      };
    }

    final List<MasteryNode> updatedMastery = [];
    final List<CoverageNode> updatedCoverage = [];
    final List<RiskNode> updatedRisk = [];
    final List<FusionNode> updatedFusion = [];

    // 🔱 Granular Recalculation per Topic (Audit GAP-B-1 Safe Recovery)
    for (var topicId in mission.atomicTopicIds) {
      
      // 1. Coverage Update (Audit: firstWhereOrNull)
      final currentCov = currentCoverageNodes.firstWhereOrNull((n) => n.atomicTopicId == topicId);
      if (currentCov == null) {
         debugPrint("🔱 BATTLE WORKER WARNING: Coverage Node missing for $topicId. Skipping.");
         continue;
      }

      final newCov = CoverageUpdateWorker.processEvent(
        currentNode: currentCov, 
        eventType: 'CRUCIBLE_ATTEMPT',
        durationSeconds: session.endedAt?.difference(session.startedAt).inSeconds ?? 0,
      );
      updatedCoverage.add(newCov);

      // 2. Mastery Update (Audit GAP M-1: Using Question Outcomes)
      var topicMastery = currentMasteryNodes.firstWhereOrNull((n) => n.atomicTopicId == topicId);
      if (topicMastery == null) continue;

      final topicOutcomes = session.questionOutcomes.where((o) => o.atomicTopicId == topicId).toList();

      for (var outcome in topicOutcomes) {
        topicMastery = MasteryUpdateWorker.calculateUpdate(
          currentNode: topicMastery!, 
          isCorrect: outcome.isCorrect, 
          difficulty: outcome.difficulty, 
          isPYQ: outcome.isPYQ, 
          responseTimeSeconds: outcome.responseTimeSeconds,
        );
      }
      updatedMastery.add(topicMastery!);

      // 3. Risk Recalculation (Audit GAP Q-7: Real Intelligence Loop)
      final List<QuestionModel> topicQuestions = await QuestionRepository.fetchByTopic(topicId);
      final int actualPyqCount = topicQuestions.where((q) => q.isPYQ).length;
      
      final newRisk = RiskWorker.calculateRisk(
        userId: session.userId, 
        realmId: session.realmId, 
        atomicTopicId: topicId, 
        mastery: topicMastery!, 
        coverage: newCov, 
        pyqWeightage: pyqWeightage, 
        pyqCount: actualPyqCount, 
        recentFrequency: actualPyqCount > 0 ? 1 : 0, // Simplified signal
      );
      updatedRisk.add(newRisk);

      // 4. Fusion Refresh
      final newFusion = FusionEngine.fuse(
        mastery: topicMastery!,
        coverage: newCov, 
        risk: newRisk,
      );
      updatedFusion.add(newFusion);
    }

    debugPrint("🔱 BATTLE WORKER: Intelligence Loop Closed. Full stack recalculated.");

    return {
      'success': true,
      'updatedCoverage': updatedCoverage,
      'updatedMastery': updatedMastery,
      'updatedRisk': updatedRisk,
      'updatedFusion': updatedFusion,
      'adaptedCampaign': adaptedCampaign,
      'missionResult': session.result,
    };
  }
}
