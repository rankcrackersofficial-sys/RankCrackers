import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/forecast_node.dart';
import 'package:rank_crackers/core/models/momentum_node.dart';
import 'package:rank_crackers/core/models/exam_clock_node.dart';

/// SCENARIO SIMULATOR (Blueprint v1.1 - Non-Linear Hardened)
/// Simulates 'What-If' scenarios based on diminishing returns of study time.
class ScenarioSimulator {
  
  static Map<int, ForecastNode> simulateTimeScenarios({
    required String userId,
    required String realmId,
    required MomentumNode momentum,
    required ExamClockNode clock,
    required double currentReadiness,
    required List<int> timeOptionsMinutes, // [120, 240, 480]
  }) {
    debugPrint("SCENARIO SIMULATOR: Simulating readiness with Diminishing Returns...");

    final Map<int, ForecastNode> scenarios = {};

    for (var minutes in timeOptionsMinutes) {
      // Logic: Fatigue Saturation Curve (Audit GAP Q-6)
      // Replaces pure Logarithmic model with a bell-curve inspired efficiency factor.
      // Peaks at 8-10 hours, then efficiency drops due to burnout.
      
      double hours = minutes / 60.0;
      // Efficiency factor: standard sigmoid * burnout penalty
      // 1.0 at 2 hours, ~1.8 at 8 hours, starts dropping after 12 hours.
      double sigmoid = 2.0 / (1.0 + math.exp(-0.4 * (hours - 2.0)));
      double burnout = math.exp(-0.01 * math.pow(math.max(0.0, hours - 10.0), 2));
      
      double timeMultiplier = sigmoid * burnout;
      
      double baseVelocity = 0.5 * timeMultiplier;
      if (momentum.status == MomentumStatus.RISING) {
        baseVelocity *= 1.5;
      }
      
      double pExam = (currentReadiness + (baseVelocity * clock.daysRemaining)).clamp(0.0, 100.0);

      scenarios[minutes] = ForecastNode(
        userId: userId,
        realmId: realmId,
        projectedReadiness7d: (currentReadiness + (baseVelocity * 7)).clamp(0.0, 100.0),
        projectedReadiness30d: (currentReadiness + (baseVelocity * 30)).clamp(0.0, 100.0),
        projectedReadinessExamDay: pExam,
        projectedCoverageExamDay: pExam,
        projectedMasteryExamDay: pExam,
        calculatedAt: DateTime.now(),
      );
    }

    return scenarios;
  }
}
