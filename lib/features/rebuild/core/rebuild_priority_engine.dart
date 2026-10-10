class RebuildPriorityEngine {
  // ===================================================
  // PRIORITY 
  // ===================================================
  static int priority({required double mastery}) {
    if (mastery < 0.30) return 5;
    if (mastery < 0.50) return 4;
    if (mastery < 0.70) return 3;
    return 1;
  }
}
