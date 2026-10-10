/// COMPLETION ENGINE
/// Sovereign authority for determining if a node is "Securely Covered."
class CompletionEngine {
  static bool isCompleted({
    required double mastery,
    required Map<String, double> factMastery,
    required int revisionLevel,
    int factCount = 0,
  }) {
    // CONSTITUTIONAL COMPLETION LAW (UPGRADED)
    
    // 1. Threshold Mastery: Node must reach 80% aggregate score.
    if (mastery < 0.80) return false;
    
    // 2. Atomic Integrity: 80% of micro-facts must be secured (>= 0.70).
    if (factCount > 0) {
      final securedFacts = factMastery.values
          .where((m) => m >= 0.70)
          .length;

      if (securedFacts < (factCount * 0.80)) {
        return false;
      }
    }

    // 3. Structural Integrity: Mandatory Revision Cycle (Minimum 1 revision).
    // Level 1 = Studied, Level 2 = Revised once.
    if (revisionLevel < 2) {
      return false;
    }
    
    return true;
  }
}
