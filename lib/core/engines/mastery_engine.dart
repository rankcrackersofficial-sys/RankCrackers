import 'dart:math';

/// MASTERY ENGINE (Document 47)
/// Orchestrates the calculation of granular competence.
/// Implements the Sovereign Mastery Law: Evidence-based progress tracking.
class MasteryEngine {
  
  /// EVIDENCE WEIGHTING
  static const double correctWeight = 1.0;
  static const double incorrectWeight = -0.5;
  static const double reviewWeight = 0.2;

  /// SCORE CALCULATION
  /// Derived from a combination of accuracy, consistency, and decay.
  static double calculateNewScore({
    required double currentScore,
    required bool isCorrect,
    required int evidenceCount,
  }) {
    final double weight = isCorrect ? correctWeight : incorrectWeight;
    
    // Logarithmic growth for stability
    final double learningRate = 1.0 / (log(evidenceCount + 2) / log(2));
    
    double newScore = currentScore + (weight * learningRate * 10);
    
    // Bounds check
    return max(0.0, min(100.0, newScore));
  }

  /// TREND ANALYSIS
  static String determineTrend(double delta) {
    if (delta > 5.0) return 'Accelerating';
    if (delta > 0.0) return 'Improving';
    if (delta < -5.0) return 'Declining';
    return 'Stable';
  }

  /// STATUS MAPPING
  static String determineStatus(double score) {
    if (score >= 90.0) return 'Mastered';
    if (score >= 70.0) return 'Strong';
    if (score >= 40.0) return 'Developing';
    if (score > 0.0) return 'Learning';
    return 'Unknown';
  }
}
