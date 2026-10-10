import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/campaign_node.dart';
import 'package:rank_crackers/core/models/battle_session.dart';

/// CAMPAIGN ADAPTATION ENGINE (Blueprint v1.0 - Document 54)
/// Converts a Static Campaign into a Living Campaign by adjusting plans based on session outcomes.
class CampaignAdaptationEngine {
  
  static CampaignNode adapt({
    required CampaignNode currentCampaign,
    required BattleSession lastSession,
  }) {
    debugPrint("CAMPAIGN ADAPTOR: Checking session outcome for campaign rewrite...");

    // Audit GAP-5: Differentiated Adaptation
    if (lastSession.result == MissionResult.FAILED || lastSession.result == MissionResult.PARTIAL) {
      debugPrint("CAMPAIGN ADAPTOR: Mission ${lastSession.result.name}. Adjusting living curriculum.");
      
      final Map<int, List<String>> newSchedule = Map.from(currentCampaign.dayWiseMissionTypes);
      final int currentDayIndex = lastSession.startedAt.difference(currentCampaign.startDate).inDays + 1;
      
      if (lastSession.result == MissionResult.FAILED) {
        // Hard Recovery for failure
        if (newSchedule.containsKey(currentDayIndex + 1)) {
          newSchedule[currentDayIndex + 1] = ['EMERGENCY_RECOVERY', 'REVISE_TOPIC'];
        }
      } else {
        // Soft Reinforcement for partial success
        if (newSchedule.containsKey(currentDayIndex + 1)) {
          newSchedule[currentDayIndex + 1] = ['PRACTICE_TOPIC', 'REVISE_TOPIC'];
        }
      }

      return currentCampaign.copyWith(
        dayWiseMissionTypes: newSchedule,
        progress: _calculateEvidenceDrivenProgress(currentCampaign, lastSession),
      );
    }

    return currentCampaign.copyWith(
      progress: _calculateEvidenceDrivenProgress(currentCampaign, lastSession),
    );
  }

  static double _calculateEvidenceDrivenProgress(CampaignNode campaign, BattleSession lastSession) {
    // Audit GAP-3: Evidence-Driven Progress
    // In production, this counts finished vs scheduled missions.
    // For now, use weighted increments based on result.
    double increment = 0.0;
    switch (lastSession.result) {
      case MissionResult.PERFECT: increment = 15.0; break;
      case MissionResult.COMPLETED: increment = 14.2; break;
      case MissionResult.PARTIAL: increment = 7.0; break;
      case MissionResult.FAILED: increment = 2.0; break;
    }
    return (campaign.progress + increment).clamp(0.0, 100.0);
  }
}

extension CampaignNodeExtension on CampaignNode {
  CampaignNode copyWith({
    Map<int, List<String>>? dayWiseMissionTypes,
    double? progress,
    bool? active,
  }) {
    return CampaignNode(
      id: id,
      userId: userId,
      realmId: realmId,
      title: title,
      type: type,
      focusAtomicTopicIds: focusAtomicTopicIds,
      startDate: startDate,
      endDate: endDate,
      dayWiseMissionTypes: dayWiseMissionTypes ?? this.dayWiseMissionTypes,
      active: active ?? this.active,
      progress: progress ?? this.progress,
    );
  }
}
