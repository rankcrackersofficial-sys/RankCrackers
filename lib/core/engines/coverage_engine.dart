/// 🔱 COVERAGE ENGINE (Document 48)
/// Monitors the physical exploration of the knowledge map.
class CoverageEngine {
  
  /// 🔱 CALCULATION: EXPLORATION VS TOTAL
  /// Tracks "Seen", "Attempted", and "Mastered" depths.
  static double calculateSyllabusCoverage({
    required int attemptedCount,
    required int totalTopics,
  }) {
    if (totalTopics == 0) return 0.0;
    return (attemptedCount / totalTopics) * 100.0;
  }

  /// 🔱 DEPTH LEVEL
  /// 0: Unseen
  /// 1: Seen (Read DigiBook)
  /// 2: Attempted (Attempted Quiz)
  /// 3: Verified (Consistent Mastery)
  static String getCoverageLevel(int depth) {
    switch (depth) {
      case 0: return 'Unseen';
      case 1: return 'Explored';
      case 2: return 'Analyzed';
      case 3: return 'Secured';
      default: return 'Unknown';
    }
  }
}
