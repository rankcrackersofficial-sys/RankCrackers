import '../models/pyq_entry.dart';

class PyqAnalysisEngine {
  // ===================================================
  // CALCULATE TREND SCORE
  // ===================================================
  static double trendScore(List<PyqEntry> pyqs) {
    if (pyqs.isEmpty) {
      return 0;
    }
    double score = 0;
    for (final pyq in pyqs) {
      score += pyq.frequency * 1.5;
    }
    return score / pyqs.length;
  }

  // ===================================================
  // MOST REPEATED
  // ===================================================
  static List<PyqEntry> mostRepeated(List<PyqEntry> pyqs) {
    pyqs.sort((a, b) {
      return b.frequency.compareTo(a.frequency);
    });
    return pyqs;
  }
}
