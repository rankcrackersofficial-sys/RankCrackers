class MemoryEngine {
  // ===================================================
  // UPDATE MASTERY
  // ===================================================
  static double updateMastery({
    required double current,
    required bool correct,
  }) {
    if (correct) {
      return (current + 0.08).clamp(0.0, 1.0);
    }
    return (current - 0.12).clamp(0.0, 1.0);
  }

  // ===================================================
  // WEAKNESS CHECK
  // ===================================================
  static bool isWeak(double mastery) {
    return mastery < 0.60;
  }

  // ===================================================
  // REVISION REQUIRED
  // ===================================================
  static bool needsRevision(double mastery) {
    return mastery < 0.75;
  }
}
