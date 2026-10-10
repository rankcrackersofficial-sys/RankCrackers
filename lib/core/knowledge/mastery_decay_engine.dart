import 'dart:math';

/// MASTERY DECAY ENGINE
/// Calculates the natural erosion of knowledge competence over time.
/// Implements Document 33 Sections 31-36.
class MasteryDecayEngine {
  /// Calculates the retention factor (0.0 - 1.0) based on time elapsed.
  static double calculateRetention({
    required DateTime lastEvidenceAt,
    int memoryStrengthDays = 30, // Default forgetting curve floor
  }) {
    final daysElapsed = DateTime.now().difference(lastEvidenceAt).inDays;
    
    if (daysElapsed <= 1) return 1.0; // Perfect retention in the first 24h
    
    // Ebbinghaus Forgetting Curve Approximation: R = e^(-t/S)
    // t = time, S = relative strength of memory
    final double retention = exp(-daysElapsed / memoryStrengthDays);
    
    return retention.clamp(0.0, 1.0);
  }

  /// Applies decay to a base mastery score.
  static double applyDecay(double baseMastery, DateTime lastEvidenceAt) {
    final retention = calculateRetention(lastEvidenceAt: lastEvidenceAt);
    return (baseMastery * retention).clamp(0.0, 1.0);
  }
}
