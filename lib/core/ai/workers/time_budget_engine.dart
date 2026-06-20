import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/time_budget_node.dart';
import 'package:rank_crackers/core/models/fusion_node.dart';
import 'package:rank_crackers/core/models/momentum_node.dart';
import 'package:rank_crackers/core/models/exam_clock_node.dart';

/// 🔱 TIME BUDGET ENGINE (Blueprint v1.0 - Document 53)
/// Optimizes daily study time distribution based on threat levels and temporal pressure.
class TimeBudgetEngine {
  
  static TimeBudgetNode allocate({
    required String userId,
    required String realmId,
    required int dailyLimitMinutes,
    required List<FusionNode> activeNodes,
    required MomentumNode momentum,
    required ExamClockNode clock,
  }) {
    debugPrint("🔱 TIME BUDGET: Optimizing allocation for $dailyLimitMinutes minutes...");

    final Map<String, int> subjectAllocation = {};
    final Map<String, int> actionAllocation = {
      'EMERGENCY': 0,
      'MASTER': 0,
      'PRACTICE': 0,
      'REVISE': 0,
    };

    if (activeNodes.isEmpty) {
      return TimeBudgetNode(
        userId: userId,
        realmId: realmId,
        totalDailyMinutes: dailyLimitMinutes,
        subjectAllocation: {},
        actionAllocation: {},
        calculatedAt: DateTime.now(),
      );
    }

    // 🔱 Strategy: Higher weight to EMERGENCY and HIGH RISK
    // Also consider Exam Clock pressure
    double pressureMultiplier = 1.0;
    if (clock.status == ExamClockStatus.OFF_TRACK) {
      pressureMultiplier = 1.5;
    } else if (clock.status == ExamClockStatus.AT_RISK) {
      pressureMultiplier = 1.2;
    }

    // Aggregate Priority Scores with Pressure Multiplier
    double totalWeightedPriority = 0.0;
    for (var node in activeNodes) {
      double weight = 1.0;
      if (node.action == 'EMERGENCY' || node.action == 'MASTER') {
        weight *= pressureMultiplier;
      }
      totalWeightedPriority += node.priorityScore * weight;
    }
    
    int remainingMinutes = dailyLimitMinutes;
    final List<MapEntry<String, double>> allocations = [];

    for (var node in activeNodes) {
      double nodeWeight = 1.0;
      if (node.action == 'EMERGENCY' || node.action == 'MASTER') {
        nodeWeight *= pressureMultiplier;
      }
      
      double proportion = (node.priorityScore * nodeWeight) / totalWeightedPriority;
      int allocated = (proportion * dailyLimitMinutes).toInt();
      
      // 🔱 Audit GAP-O-2: Degrade Gracefully (Min 5 mins if budget allows)
      if (allocated < 5 && remainingMinutes >= 5) allocated = 5;
      
      allocated = allocated.clamp(0, remainingMinutes);
      remainingMinutes -= allocated;

      // Update Action Allocation
      actionAllocation[node.action] = (actionAllocation[node.action] ?? 0) + allocated;
      
      // Update Subject Allocation
      final subject = node.atomicTopicId.split('_')[0];
      subjectAllocation[subject] = (subjectAllocation[subject] ?? 0) + allocated;
    }

    // 🔱 Audit GAP-O-1: Rounding Recovery
    // Assign any leftover minutes to the highest priority node
    if (remainingMinutes > 0 && activeNodes.isNotEmpty) {
      final highestPriorityAction = activeNodes.first.action;
      actionAllocation[highestPriorityAction] = (actionAllocation[highestPriorityAction] ?? 0) + remainingMinutes;
    }

    return TimeBudgetNode(
      userId: userId,
      realmId: realmId,
      totalDailyMinutes: dailyLimitMinutes,
      subjectAllocation: subjectAllocation,
      actionAllocation: actionAllocation,
      calculatedAt: DateTime.now(),
    );
  }
}
