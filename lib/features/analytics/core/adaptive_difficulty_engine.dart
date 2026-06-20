class AdaptiveDifficultyEngine {
  // ===================================================
  // PICK DIFFICULTY 🔱
  // ===================================================
  static int level({required double mastery}) {
    if (mastery < 0.40) return 1;
    if (mastery < 0.70) return 2;
    return 3;
  }
}
