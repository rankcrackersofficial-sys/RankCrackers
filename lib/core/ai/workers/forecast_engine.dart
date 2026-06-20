import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/forecast_node.dart';
import 'package:rank_crackers/core/models/momentum_node.dart';
import 'package:rank_crackers/core/models/exam_clock_node.dart';

/// 🔱 READINESS FORECAST ENGINE (Blueprint v1.1 - Evidence Driven)
/// Projects future states based on current velocity, momentum, and remaining budget.
class ForecastEngine {
  
  static ForecastNode predict({
    required String userId,
    required String realmId,
    required MomentumNode momentum,
    required ExamClockNode clock,
    required double currentReadiness,
    required double currentCoverage,
    required double currentMastery,
  }) {
    debugPrint("🔱 FORECAST ENGINE: Projecting preparation trajectory for $userId...");

    // 🔱 Velocity Calculation (Audit GAP P-1 Hardened)
    // velocity is determined by momentum status weighted by recent accuracy
    double baseVelocity = 0.5; // Baseline
    double momentumMultiplier = 1.0;

    switch (momentum.status) {
      case MomentumStatus.RISING: momentumMultiplier = 1.5; break;
      case MomentumStatus.STABLE: momentumMultiplier = 1.0; break;
      case MomentumStatus.DECLINING: momentumMultiplier = 0.5; break;
      case MomentumStatus.COLLAPSING: momentumMultiplier = 0.1; break;
    }

    // Weighted Velocity: accounts for current mastery level (diminishing returns)
    double masteryWeight = (100.0 - currentMastery) / 100.0;
    double dailyVelocity = baseVelocity * momentumMultiplier * (0.5 + masteryWeight);

    // Projected State at intervals
    double p7d = (currentReadiness + (dailyVelocity * 7)).clamp(0.0, 100.0);
    double p30d = (currentReadiness + (dailyVelocity * 30)).clamp(0.0, 100.0);
    
    // Exam Day Projection (Constitutional Realism Check)
    double pExam = (currentReadiness + (dailyVelocity * clock.daysRemaining)).clamp(0.0, 100.0);

    return ForecastNode(
      userId: userId,
      realmId: realmId,
      projectedReadiness7d: p7d,
      projectedReadiness30d: p30d,
      projectedReadinessExamDay: pExam,
      projectedCoverageExamDay: (currentCoverage + (dailyVelocity * clock.daysRemaining * 1.2)).clamp(0.0, 100.0), 
      projectedMasteryExamDay: (currentMastery + (dailyVelocity * clock.daysRemaining * 0.8)).clamp(0.0, 100.0),
      calculatedAt: DateTime.now(),
    );
  }
}
