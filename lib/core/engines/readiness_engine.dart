import '../models/readiness_state.dart';
import '../models/coverage_state.dart';
import '../models/risk_state.dart';

/// 🔱 MISSION READINESS ENGINE
/// Sovereign authority for estimating total mission preparedness.
/// Implements Document 32.
class ReadinessEngine {
  // ===================================================
  // READINESS CALCULATION 🔱
  // ===================================================

  /// Calculates the current readiness state based on preparation evidence.
  static ReadinessState calculate({
    required CoverageState coverage,
    required double masteryPercent, // 0.0 - 1.0
    required double assessmentPerformance, // 0.0 - 1.0 (e.g. from diagnostic or tests)
    required RiskState risk,
    ReadinessState? previousState,
  }) {
    // 🔱 CONSTITUTIONAL FORMULA (Section 15)
    // Scale inputs to 0-100 for the formula
    final double cov = coverage.coveragePercent * 100;
    final double mast = masteryPercent * 100;
    final double asst = assessmentPerformance * 100;
    final double rsk = risk.overallRisk * 100;

    final double score = 
        (cov * 0.30) + 
        (mast * 0.30) + 
        (asst * 0.30) + 
        ((100 - rsk) * 0.10);

    final clampedScore = score.clamp(0.0, 100.0);

    // 🔱 CONFIDENCE LOGIC (Section 28-32)
    // Confidence increases as preparation depth (Coverage) grows.
    final double confidence = (coverage.coveragePercent * 0.5) + (assessmentPerformance * 0.5);

    return ReadinessState(
      score: clampedScore,
      confidence: confidence.clamp(0.0, 1.0),
      status: _determineStatus(clampedScore),
      trend: _determineTrend(clampedScore, previousState?.score ?? clampedScore),
      successProbability: (clampedScore / 100.0) * confidence.clamp(0.0, 1.0),
      calculatedAt: DateTime.now(),
    );
  }

  // ===================================================
  // STATE THRESHOLDS 🔱 (Section 27)
  // ===================================================

  static String _determineStatus(double score) {
    if (score <= 20) return 'Critical';
    if (score <= 40) return 'Weak';
    if (score <= 60) return 'Developing';
    if (score <= 80) return 'Ready';
    return 'Mission Ready';
  }

  // ===================================================
  // TREND DETECTION 🔱 (Section 34)
  // ===================================================

  static String _determineTrend(double current, double previous) {
    final diff = current - previous;
    if (diff > 5.0) return 'Accelerating';
    if (diff > 0.5) return 'Improving';
    if (diff < -0.5) return 'Declining';
    return 'Stable';
  }
}
