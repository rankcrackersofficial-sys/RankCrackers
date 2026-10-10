class ResultEngine {
  // ===================================================
  // CALCULATE SCORE 
  // ===================================================
  static double calculate({
    required int correct,
    required int wrong,
    required double negativeMark,
  }) {
    return correct - (wrong * negativeMark);
  }
}
