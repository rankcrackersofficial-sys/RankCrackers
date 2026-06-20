import 'dart:math';

/// 🔱 MASTERY ENGINE (Document 33)
/// Sovereign authority for competency measurement at Atomic Topic Level.
class MasteryEngine {
  // ===================================================
  // CONSTITUTIONAL FORMULA 🔱 (Section 18)
  // ===================================================

  /// Calculates the Mastery Score based on four impact factors.
  /// Result is normalized (0.0 - 1.0) for internal use, usually displayed as 0-100.
  static double calculateScore({
    required double assessmentEvidence, // 🔱 Article 7 Audit Fix: Performance evidence (40%)
    required double readingEvidence,    // 🔱 Article 7 Audit Fix: Baseline understanding (20%)
    required double revisionEvidence,   // 🔱 Article 7 Audit Fix: Stability evidence (20%)
    required double retention,          // 🔱 Memory Decay (10%)
    required double difficulty,         // 🔱 Weighted complexity (10%)
  }) {
    // 🔱 CONSTITUTIONAL MODEL (Redefined for Evidence Law)
    final double score = 
        (assessmentEvidence.clamp(0.0, 1.0) * 0.40) +
        (readingEvidence.clamp(0.0, 1.0) * 0.20) +
        (revisionEvidence.clamp(0.0, 1.0) * 0.20) +
        (retention.clamp(0.0, 1.0) * 0.10) +
        (difficulty.clamp(0.0, 1.0) * 0.10);

    return score.clamp(0.0, 1.0);
  }

  // ===================================================
  // MASTERY STATES 🔱 (Section 24-30)
  // ===================================================

  /// Maps a raw score (0-100) to a constitutional competency state.
  static String determineState(double score) {
    if (score <= 20) return 'Unknown';
    if (score <= 40) return 'Learning';
    if (score <= 60) return 'Developing';
    if (score <= 80) return 'Strong';
    return 'Mastered';
  }

  // ===================================================
  // TREND DETECTION 🔱 (Section 57)
  // ===================================================

  static String determineTrend(double current, double previous) {
    final diff = current - previous;
    if (diff > 0.10) return 'Accelerating';
    if (diff > 0.02) return 'Improving';
    if (diff < -0.02) return 'Declining';
    return 'Stable';
  }

  // ===================================================
  // UTILITIES 🔱
  // ===================================================

  /// Calculates consistency based on a series of results.
  /// (Stub implementation for Phase 2, can be expanded with real streak data).
  static double calculateConsistency(int battlesWon, int totalBattles) {
    if (totalBattles == 0) return 0.0;
    // Logarithmic scale to reward volume + win rate
    final winRate = battlesWon / totalBattles;
    final volumeBonus = min(1.0, totalBattles / 20.0) * 0.2;
    return (winRate * 0.8 + volumeBonus).clamp(0.0, 1.0);
  }

  /// 🔱 CONFIDENCE LAW (Section 59)
  /// Measures the trustworthiness of a mastery score based on evidence density.
  static double calculateConfidence({
    required int evidenceCount,
    required DateTime lastEvidenceAt,
  }) {
    // 1. Evidence Density (70%) - Capped at 25 events for high confidence
    final double density = (evidenceCount / 25.0).clamp(0.0, 1.0);

    // 2. Recency Quality (30%) - Newer evidence is more trustworthy
    final daysSince = DateTime.now().difference(lastEvidenceAt).inDays;
    final double recency = exp(-daysSince / 14.0); // 2-week half-life for confidence

    return (density * 0.7) + (recency * 0.3);
  }

  // ===================================================
  // LEGACY BRIDGE 🔱
  // ===================================================

  /// Legacy wrapper to maintain compatibility with existing diagnostic callers.
  static double calculate({
    required int attempts,
    required int correct,
    double previousMastery = 0.0,
  }) {
    if (attempts == 0) return previousMastery;
    final accuracy = correct / attempts;
    
    // 🔱 Audit Fix: Map legacy metrics to Constitutional Evidence Chain
    return calculateScore(
      assessmentEvidence: accuracy,
      readingEvidence: previousMastery > 0 ? 0.5 : 0.0, // Assumption based on previous state
      revisionEvidence: 0.0,
      retention: 1.0, // Diagnostic is recent evidence
      difficulty: 0.5, // Standard difficulty
    );
  }
}
