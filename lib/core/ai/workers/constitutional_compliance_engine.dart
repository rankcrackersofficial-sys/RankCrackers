import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/mission_node.dart';
import 'package:rank_crackers/core/models/campaign_node.dart';
import 'package:rank_crackers/core/models/time_budget_node.dart';

/// CONSTITUTIONAL COMPLIANCE ENGINE (Blueprint v1.0 - Document 70)
/// The Final Guardian. Ensures all APOS outputs strictly adhere to Constitutional Laws.
class ConstitutionalComplianceEngine {
  
  static Map<String, dynamic> verifyMissions({
    required List<MissionNode> missions,
    required TimeBudgetNode budget,
  }) {
    debugPrint("COMPLIANCE GUARDIAN: Final audit of daily queue...");

    final List<String> issues = [];
    int actualMinutes = 0;

    for (var mission in missions) {
      // Law: No Orphan Topics
      if (mission.atomicTopicIds.isEmpty) {
        issues.add("Mission ${mission.id} contains no atomic topics.");
      }
      
      // Law: Source Traceability
      if (mission.sourceFusionIds.isEmpty) {
        issues.add("Mission ${mission.id} lacks intelligence source linkage.");
      }

      actualMinutes += mission.estimatedMinutes;
    }

    // Law: Budget Fidelity
    if (actualMinutes > budget.totalDailyMinutes + 15) { // 15 min grace
      issues.add("Mission queue exceeds daily time budget by ${actualMinutes - budget.totalDailyMinutes} min.");
    }

    return {
      'isValid': issues.isEmpty,
      'criticalIssues': issues,
    };
  }

  static bool verifyCampaign(CampaignNode campaign) {
    // Law: 7-Day Curriculum Structure
    if (campaign.dayWiseMissionTypes.length != 7) {
      debugPrint("COMPLIANCE ERROR: Campaign must contain exactly 7 days of strategy.");
      return false;
    }

    // Law: Diagnostic Closure
    if (!campaign.dayWiseMissionTypes[7]!.contains('DIAGNOSTIC_BATTLE')) {
      debugPrint("COMPLIANCE ERROR: Campaign must conclude with a Diagnostic Battle on Day 7.");
      return false;
    }

    return true;
  }
}
