import 'dart:math';
import '../models/readiness_state.dart';
import '../models/coverage_state.dart';
import '../models/risk_state.dart';
import '../models/momentum_state.dart';

/// FORECASTING ENGINE
/// Sovereign authority for predicting preparation outcomes.
/// Implements Document 32 Sections 37-42, Document 34 Section 39, and Document 35 Section 40.
class ForecastingEngine {
  
  // ===================================================
  // READINESS FORECAST 
  // ===================================================

  /// Estimates the readiness score at a future point in time.
  static double forecastReadiness({
    required ReadinessState currentState,
    required MomentumState momentum,
    required int daysForward,
  }) {
    // Formula: CurrentScore + (Velocity * Days * Confidence)
    // High confidence (>0.8) makes the forecast more aggressive.
    final double velocityFactor = momentum.momentumScore * currentState.confidence;
    final double projection = currentState.score + (velocityFactor * daysForward * 0.5);
    
    return projection.clamp(0.0, 100.0);
  }

  // ===================================================
  // MISSION SUCCESS PROBABILITY 
  // ===================================================

  /// Calculates the statistical probability of examination success.
  static double calculateSuccessProbability({
    required ReadinessState readiness,
    required RiskState risk,
    required double examDifficulty, // 0.0 - 1.0
  }) {
    // Constitutional Model: Readiness (60%) - Risk (30%) - Environment (10%)
    // Audit Fix: Removed double-penalty on confidence to align with Documentation 32 Section 15.
    final double readinessComponent = readiness.score / 100.0;
    final double riskComponent = 1.0 - risk.overallRisk;
    final double environmentComponent = 1.0 - examDifficulty;

    final double probability = 
        (readinessComponent * 0.60) + 
        (riskComponent * 0.30) + 
        (environmentComponent * 0.10);

    return probability.clamp(0.0, 1.0);
  }

  // ===================================================
  // COVERAGE FORECAST 
  // ===================================================

  /// Predicts when 100% atomic coverage will be achieved.
  static DateTime? estimateCompletionDate({
    required CoverageState coverage,
    required MomentumState momentum,
    required DateTime startDate,
  }) {
    if (momentum.momentumScore <= 0.05) return null; // Stalled

    final double remaining = 1.0 - coverage.coveragePercent;
    if (remaining <= 0) return DateTime.now();

    // Days to complete = (Remaining Scope / Daily Velocity)
    final double dailyVelocity = (coverage.coveragePercent) / max(1, DateTime.now().difference(startDate).inDays);
    final int daysToComplete = (remaining / max(0.001, dailyVelocity)).ceil();

    return DateTime.now().add(Duration(days: daysToComplete));
  }
}
