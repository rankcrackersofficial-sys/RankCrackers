import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/success_probability_node.dart';
import 'package:rank_crackers/core/models/forecast_node.dart';
import 'package:rank_crackers/core/models/exam_clock_node.dart';
import 'package:rank_crackers/core/models/fusion_node.dart';
import 'package:rank_crackers/core/models/momentum_node.dart';
import 'package:rank_crackers/core/models/recruitment_realm.dart';
import 'scenario_simulator.dart';

/// SUCCESS PROBABILITY ENGINE (Blueprint v1.2 - Constitutional Hardened)
/// Computes executive probability by fusing forecast, clock, and multi-dimensional subject readiness.
class SuccessProbabilityEngine {
  
  static SuccessProbabilityNode evaluate({
    required String userId,
    required RecruitmentRealm realm,
    required ForecastNode forecast,
    required ExamClockNode clock,
    required List<FusionNode> fusionNodes,
    required MomentumNode momentum,
  }) {
    debugPrint("PROBABILITY ENGINE: Finalizing executive success metric...");

    final List<String> drivers = [];
    
    // 1. Subject Readiness Breakdown (Audit GAP Q-4)
    // Now uses Mastery + Coverage - Risk
    final Map<String, List<double>> subjectScores = {};
    for (var node in fusionNodes) {
       final subject = node.atomicTopicId.split('_')[0];
       // Formula: (Mastery * 0.4) + (Coverage * 0.4) + ((1.0 - Risk) * 0.2)
       double readyScore = (node.masteryScore * 0.4) + 
                          (node.coverageScore * 0.4) + 
                          ((1.0 - node.riskScore) * 0.2);
       subjectScores.putIfAbsent(subject, () => []).add(readyScore * 100.0);
    }
    
    final Map<String, double> subjectReadiness = subjectScores.map((key, list) {
       return MapEntry(key, list.reduce((a, b) => a + b) / list.length);
    });

    // 2. Dynamic Probability (Audit GAP Q-5)
    // Uses realmDifficultyScore instead of hardcoded 0.85
    double baseProb = forecast.projectedReadinessExamDay;
    double probability = baseProb * realm.realmDifficultyScore; 

    if (clock.status == ExamClockStatus.OFF_TRACK) {
      probability *= 0.7;
      drivers.add("Critical coverage deficit vs. deadline");
    } else if (clock.status == ExamClockStatus.AT_RISK) {
      probability *= 0.9;
      drivers.add("Syllabus velocity is below required threshold");
    }

    // 3. Dynamic Impact Analysis
    final scenarios = ScenarioSimulator.simulateTimeScenarios(
      userId: userId, 
      realmId: realm.realmId, 
      momentum: momentum, 
      clock: clock, 
      currentReadiness: forecast.projectedReadinessExamDay, 
      timeOptionsMinutes: [240, 480],
    );

    final double currentProb = probability;
    final double plus2hrProb = (scenarios[240]?.projectedReadinessExamDay ?? baseProb) * realm.realmDifficultyScore;
    
    return SuccessProbabilityNode(
      userId: userId,
      realmId: realm.realmId,
      overallProbability: probability.clamp(0.0, 100.0),
      failureDrivers: drivers,
      subjectReadiness: subjectReadiness,
      actionImpact: {
        'ADD_2_HOURS': (plus2hrProb - currentProb).clamp(0.0, 100.0),
        'REVISE_CRITICAL': 12.0,
      },
      calculatedAt: DateTime.now(),
    );
  }
}
