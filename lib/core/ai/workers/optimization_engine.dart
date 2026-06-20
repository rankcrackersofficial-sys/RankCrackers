import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/optimization_node.dart';
import 'package:rank_crackers/core/models/forecast_node.dart';
import 'package:rank_crackers/core/models/success_probability_node.dart';
import 'package:rank_crackers/core/models/exam_clock_node.dart';
import 'package:rank_crackers/core/models/fusion_node.dart';
import 'package:rank_crackers/core/models/momentum_node.dart';
import 'package:rank_crackers/core/models/recruitment_realm.dart';
import 'scenario_simulator.dart';

/// 🔱 CHIEF STRATEGIST ENGINE (Hardened v1.2 - Solver Final)
/// Solves for the optimal study plan by simulating ROI per minute.
/// Closes Audit GAP Q-1 & A-1.
class OptimizationEngine {
  
  static OptimizationNode solve({
    required String userId,
    required RecruitmentRealm realm,
    required List<FusionNode> activeNodes,
    required ForecastNode currentForecast,
    required SuccessProbabilityNode currentProbability,
    required ExamClockNode clock,
    required MomentumNode momentum,
    required int maxMinutesPossible,
  }) {
    debugPrint("🔱 CHIEF STRATEGIST: Initiating Simulation-Based Solver...");

    // 🔱 1. SIMULATION ITERATION (Audit GAP A-1)
    // We solve for T (time) in 30-minute steps [120, 150, ..., Max]
    int optimalMinutes = 120;
    double maxROI = -1.0;
    final double baselineProb = currentProbability.overallProbability;

    final List<int> simulationSteps = [];
    for (int t = 120; t <= maxMinutesPossible; t += 30) {
      simulationSteps.add(t);
    }

    // 🔱 Scenario Simulation Layer
    final Map<int, ForecastNode> timeScenarios = ScenarioSimulator.simulateTimeScenarios(
      userId: userId, 
      realmId: realm.realmId, 
      momentum: momentum, 
      clock: clock, 
      currentReadiness: currentForecast.projectedReadinessExamDay, 
      timeOptionsMinutes: simulationSteps,
    );

    // 🔱 ROI Optimization Logic
    for (var minutes in simulationSteps) {
      // Projected probability for this time scenario
      double scenarioProb = (timeScenarios[minutes]?.projectedReadinessExamDay ?? 0.0) * realm.realmDifficultyScore;
      double probGain = scenarioProb - baselineProb;
      
      // ROI = Probability Improvement per minute invested
      double currentROI = minutes > 0 ? (probGain / minutes) : 0.0;

      if (currentROI > maxROI) {
        maxROI = currentROI;
        optimalMinutes = minutes;
      }
    }

    // 🔱 2. WEIGHTED RESOURCE ALLOCATION (Audit GAP Q-3)
    // Redesigned to distribute time based on Readiness Gap, not flat rules.
    final Map<String, int> subjectMix = {};
    
    // Calculate Subject Readiness Gaps
    double totalGapValue = 0;
    final Map<String, double> gapWeights = {};
    
    for (var entry in currentProbability.subjectReadiness.entries) {
      // Gap = 100% - current readiness (Mastery/Coverage/Risk fused)
      double gap = (100.0 - entry.value).clamp(1.0, 100.0); 
      gapWeights[entry.key] = gap;
      totalGapValue += gap;
    }

    int allocatedMinutes = 0;
    final sortedSubjects = gapWeights.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    for (var entry in sortedSubjects) {
       // Proportional Allocation: Time = OptimalTotal * (SubjectGap / TotalGap)
       double weight = totalGapValue > 0 ? (entry.value / totalGapValue) : 0;
       int subjectTime = (optimalMinutes * weight).toInt();
       
       subjectMix[entry.key] = subjectTime;
       allocatedMinutes += subjectTime;
    }
    
    // Recovery: Catch rounding errors
    if (allocatedMinutes < optimalMinutes && sortedSubjects.isNotEmpty) {
       String weakest = sortedSubjects.first.key;
       subjectMix[weakest] = (subjectMix[weakest] ?? 0) + (optimalMinutes - allocatedMinutes);
    }

    double finalProjectedProb = (timeScenarios[optimalMinutes]?.projectedReadinessExamDay ?? 0.0) * realm.realmDifficultyScore;

    return OptimizationNode(
      userId: userId,
      realmId: realm.realmId,
      optimalDailyMinutes: optimalMinutes,
      optimalSubjectMix: subjectMix,
      recommendedCampaigns: {
        sortedSubjects.isNotEmpty ? sortedSubjects.first.key : 'GENERAL': 'PRECISION_RECOVERY_V3',
      },
      estimatedProbabilityGain: (finalProjectedProb - baselineProb).clamp(0.0, 100.0),
      strategyNarrative: "Chief Strategist solved for $optimalMinutes minutes with a weighted focus on ${sortedSubjects.take(2).map((e) => e.key).join(' and ')}. Proportional allocation is optimized for highest ROI.",
      optimizedAt: DateTime.now(),
    );
  }
}
