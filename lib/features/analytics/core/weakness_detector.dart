class WeaknessDetector {
  // ===================================================
  // IS WEAK 🔱
  // ===================================================
  static bool weak({required double mastery}) {
    return mastery < 0.45;
  }
}
