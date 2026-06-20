/// 🔱 NOTIFICATION IMPORTANCE ENGINE
/// Sovereign authority for determining tactical alert priorities.
/// Implements Document 16 Section 73.
class NotificationImportanceEngine {
  /// Calculates the systemic priority score of a notification event.
  /// Each impact factor must be normalized (0.0 - 1.0).
  static double calculatePriority({
    required double riskImpact,      // Systemic preparation danger (30%)
    required double readinessImpact, // Mission completion proximity (25%)
    required double missionWeight,   // Relative exam importance (20%)
    required double timeUrgency,    // Deadline proximity (15%)
    required double userImpact,      // Persona-specific relevance (10%)
  }) {
    // 🔱 CONSTITUTIONAL FORMULA WITH INPUT HARDENING
    final double priorityScore = 
        (riskImpact.clamp(0.0, 1.0) * 0.30) +
        (readinessImpact.clamp(0.0, 1.0) * 0.25) +
        (missionWeight.clamp(0.0, 1.0) * 0.20) +
        (timeUrgency.clamp(0.0, 1.0) * 0.15) +
        (userImpact.clamp(0.0, 1.0) * 0.10);

    return priorityScore.clamp(0.0, 1.0);
  }

  /// Maps the raw score to a priority state.
  static String determineState(double score) {
    if (score >= 0.90) return 'critical';
    if (score >= 0.70) return 'high';
    if (score >= 0.40) return 'medium';
    return 'low';
  }
}
