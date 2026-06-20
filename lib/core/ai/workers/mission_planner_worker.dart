import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/fusion_node.dart';
import 'package:rank_crackers/core/models/mission_node.dart';
import 'package:rank_crackers/core/models/time_budget_node.dart';

/// 🔱 ADAPTIVE MISSION PLANNER WORKER (Sprint L/M/O - Blueprint v1.2)
/// Law: Converts Fusion intelligence into Daily Actionable Missions.
class MissionPlannerWorker {
  
  static List<MissionNode> generateDailyQueue({
    required String userId,
    required String realmId,
    required List<FusionNode> fusionNodes,
    required int availableMinutes,
    TimeBudgetNode? budget, // 🔱 Sprint O Integration
  }) {
    debugPrint("🔱 MISSION PLANNER: Designing daily battlefield strategy for $userId...");

    final List<MissionNode> dailyQueue = [];
    int totalEstimatedTime = 0;
    
    // 🔱 If budget exists, we track time per action type
    final Map<String, int> actionTimeSpent = {
      'EMERGENCY': 0, 'MASTER': 0, 'PRACTICE': 0, 'REVISE': 0
    };

    // 🔱 Law 1: Never assign IGNORE topics
    final activeFusionNodes = fusionNodes.where((n) => n.action != 'IGNORE').toList();

    // 🔱 Law 2: Always prioritize EMERGENCY over all others
    activeFusionNodes.sort((a, b) {
      if (a.action == 'EMERGENCY' && b.action != 'EMERGENCY') return -1;
      if (b.action == 'EMERGENCY' && a.action != 'EMERGENCY') return 1;
      return b.priorityScore.compareTo(a.priorityScore);
    });

    int priorityCounter = 1;

    // 🔱 Audit Sprint M: Cluster topics by action type to avoid "too many tiny missions"
    final Map<String, List<FusionNode>> groupedNodes = {};
    for (var node in activeFusionNodes) {
      groupedNodes.putIfAbsent(node.action, () => []).add(node);
    }

    // Process groups in priority order
    final actionPriority = ['EMERGENCY', 'MASTER', 'PRACTICE', 'REVISE'];
    
    for (var action in actionPriority) {
      final nodes = groupedNodes[action] ?? [];
      if (nodes.isEmpty) continue;

      int index = 0;
      while (index < nodes.length) {
        int clusterSize = (action == 'EMERGENCY' || action == 'MASTER') ? 1 : 3;
        final cluster = nodes.skip(index).take(clusterSize).toList();
        index += clusterSize;

        int estimatedTime = cluster.fold(0, (sum, n) => sum + _estimateTimeForAction(n.action));
        
        // 🔱 Budget Check (Sprint O)
        if (budget != null) {
          final int actionLimit = budget.actionAllocation[action] ?? 999;
          if ((actionTimeSpent[action] ?? 0) + estimatedTime > actionLimit) {
            debugPrint("🔱 MISSION PLANNER: Action budget reached for $action. Skipping cluster.");
            continue; 
          }
        }

        if (estimatedTime > 90) estimatedTime = 90;

        if (totalEstimatedTime + estimatedTime > availableMinutes) {
          debugPrint("🔱 MISSION PLANNER: Time capacity reached ($totalEstimatedTime min).");
          return dailyQueue;
        }
        
        actionTimeSpent[action] = (actionTimeSpent[action] ?? 0) + estimatedTime;

        String missionType = _mapActionToMissionType(action);
        
        bool isPyqStrike = cluster.any((n) => n.reasons.contains("High PYQ Threat") || n.priorityScore > 80);
        if (isPyqStrike) missionType = "PYQ_STRIKE";

        dailyQueue.add(MissionNode(
          id: "mission_${userId}_${action.toLowerCase()}_${DateTime.now().millisecondsSinceEpoch}_${priorityCounter}",
          userId: userId,
          realmId: realmId,
          atomicTopicIds: cluster.map((n) => n.atomicTopicId).toList(),
          sourceFusionIds: cluster.map((n) => n.id).toList(),
          sourceRiskIds: cluster.map((n) => "${userId}_${n.atomicTopicId}").toList(), 
          missionType: missionType,
          estimatedMinutes: estimatedTime,
          priority: priorityCounter++,
          generatedAt: DateTime.now(),
        ));

        totalEstimatedTime += estimatedTime;
      }
    }

    debugPrint("🔱 MISSION PLANNER: Generation complete. ${dailyQueue.length} missions assigned.");
    return dailyQueue;
  }

  static int _estimateTimeForAction(String action) {
    switch (action) {
      case 'EMERGENCY': return 45;
      case 'MASTER': return 60;
      case 'PRACTICE': return 30;
      case 'REVISE': return 20;
      default: return 15;
    }
  }

  static String _mapActionToMissionType(String action) {
    switch (action) {
      case 'EMERGENCY': return 'EMERGENCY_RECOVERY';
      case 'MASTER': return 'MASTER_TOPIC';
      case 'PRACTICE': return 'PRACTICE_TOPIC';
      case 'REVISE': return 'REVISE_TOPIC';
      default: return 'REVISE_TOPIC';
    }
  }
}
