import 'dart:math';

class RetentionEngine {
  // ===================================================
  // NEUROSCIENCE-INSPIRED FORGETTING CURVE 🔱
  // ===================================================
  static double predictDecay({
    required double initialMastery,
    required int hoursPassed,
    required int stabilityLevel,
  }) {
    // R = e^(-t/S)
    // R: Retention, t: time, S: Stability
    double s = stabilityLevel * 24.0; // Stability in hours
    return initialMastery * exp(-hoursPassed / s);
  }

  // ===================================================
  // SMART REVISION SCHEDULING 🔱
  // ===================================================
  static DateTime calculateNextRevision(int revisionLevel, double currentMastery) {
    int baseHours;
    
    // Multiplier based on mastery quality
    double multiplier = currentMastery > 0.8 ? 1.5 : 0.8;

    switch (revisionLevel) {
      case 1: baseHours = 12; break;
      case 2: baseHours = 24; break;
      case 3: baseHours = 48; break;
      case 4: baseHours = 96; break;
      case 5: baseHours = 168; break;
      default: baseHours = 24;
    }

    return DateTime.now().add(
      Duration(hours: (baseHours * multiplier).toInt()),
    );
  }
}
