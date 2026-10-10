import 'dart:math';

/// RISK ENGINE (Document 49)
/// Quantifies the potential for failure in specific knowledge segments.
class RiskEngine {
  
  /// CALCULATION: PROBABILITY OF FAILURE
  /// Risk factors: Low Mastery, High Decay, High Complexity.
  static double calculateRiskScore({
    required double masteryScore,
    required int daysSinceLastActivity,
    required int difficulty,
  }) {
    // 1. Mastery Risk (Inverse of mastery)
    final double masteryRisk = (100.0 - masteryScore) / 100.0;

    // 2. Decay Risk (Increases over time)
    final double decayRisk = min(1.0, daysSinceLastActivity / 30.0);

    // 3. Complexity Multiplier
    final double complexityFactor = 1.0 + (difficulty / 5.0);

    // Combined Weighted Risk
    double risk = (masteryRisk * 0.7) + (decayRisk * 0.3);
    risk = risk * complexityFactor;

    return max(0.0, min(1.0, risk));
  }

  /// RISK CATEGORIZATION
  static String getRiskCategory(double riskScore) {
    if (riskScore >= 0.8) return 'CRITICAL';
    if (riskScore >= 0.5) return 'HIGH';
    if (riskScore >= 0.3) return 'MEDIUM';
    return 'LOW';
  }
}
