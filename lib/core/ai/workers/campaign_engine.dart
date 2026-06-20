import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/campaign_node.dart';
import 'package:rank_crackers/core/models/fusion_node.dart';
import 'package:rank_crackers/core/models/momentum_node.dart';

/// 🔱 ADAPTIVE CAMPAIGN ENGINE (Blueprint v1.0 - Document 51)
/// Generates multi-day strategic campaigns based on student momentum and risk clusters.
class CampaignEngine {
  
  static CampaignNode generate({
    required String userId,
    required String realmId,
    required List<FusionNode> riskCluster, // Topics with High/Critical risk in same subject
    required MomentumNode momentum,
  }) {
    debugPrint("🔱 CAMPAIGN ENGINE: Forging strategic mission plan for $userId...");

    final String subject = riskCluster.isNotEmpty ? riskCluster.first.atomicTopicId.split('_')[0].toUpperCase() : 'General';
    final String title = "$subject Strategic Recovery Campaign";
    
    final Map<int, List<String>> schedule = {
      1: ['MASTER_TOPIC', 'PRACTICE_TOPIC'],
      2: ['MASTER_TOPIC', 'REVISE_TOPIC'],
      3: ['PRACTICE_TOPIC', 'PYQ_STRIKE'],
      4: ['REVISE_TOPIC', 'PRACTICE_TOPIC'],
      5: ['PYQ_STRIKE', 'PYQ_STRIKE'],
      6: ['EMERGENCY_RECOVERY', 'REVISE_TOPIC'],
      7: ['DIAGNOSTIC_BATTLE'],
    };

    return CampaignNode(
      id: "camp_${userId}_${DateTime.now().millisecondsSinceEpoch}",
      userId: userId,
      realmId: realmId,
      title: title,
      type: CampaignType.RECOVERY,
      focusAtomicTopicIds: riskCluster.map((n) => n.atomicTopicId).toList(),
      startDate: DateTime.now(),
      endDate: DateTime.now().add(const Duration(days: 7)),
      dayWiseMissionTypes: schedule,
    );
  }
}
