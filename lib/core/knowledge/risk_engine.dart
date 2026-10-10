import '../models/risk_state.dart';
import '../models/coverage_state.dart';
import '../models/atomic_risk_state.dart';
import '../models/atomic_mastery_state.dart';
import '../models/atomic_coverage_state.dart';

/// RISK ENGINE (Document 35 Compliant)
/// Sovereign authority for vulnerability detection.
class RiskEngine {
  
  // ===================================================
  // ATOMIC RISK CALCULATION 
  // ===================================================

  /// Calculates the vulnerability score for a single knowledge atom.
  static AtomicRiskState calculateAtomic({
    required String atomicTopicId,
    required AtomicCoverageState coverage,
    required AtomicMasteryState mastery,
    required double assessmentWeakness, // 0.0 - 1.0 (inverse of performance)
    required double recencyWeakness,    // 0.0 - 1.0 (inverse of recency)
    AtomicRiskState? previousState,
  }) {
    // CONSTITUTIONAL MODEL (Section 18)
    final double coverageDeficiency = 1.0 - (coverage.score / 100);
    final double masteryDeficiency = 1.0 - (mastery.score / 100);

    final double score = 
        (coverageDeficiency * 0.25) +
        (masteryDeficiency * 0.35) +
        (assessmentWeakness * 0.25) +
        (recencyWeakness * 0.15);

    final double clampedScore = score.clamp(0.0, 1.0);

    return AtomicRiskState(
      id: 'risk_${atomicTopicId}_${DateTime.now().millisecondsSinceEpoch}',
      atomicTopicId: atomicTopicId,
      score: clampedScore * 100,
      confidence: mastery.confidence, // Risk confidence maps to evidence density
      status: _determineStatus(clampedScore * 100),
      trend: _determineTrend(clampedScore * 100, previousState?.score ?? (clampedScore * 100)),
      coverageDeficiency: coverageDeficiency,
      masteryDeficiency: masteryDeficiency,
      assessmentWeakness: assessmentWeakness,
      recencyWeakness: recencyWeakness,
      lastCalculatedAt: DateTime.now(),
    );
  }

  // ===================================================
  // MISSION RISK CALCULATION 
  // ===================================================

  static RiskState calculate({
    required CoverageState coverage,
    double atomicWeaknessRisk = 0.0, // 0.0 - 1.0 (Average Atomic Risk)
    double cascadeRisk = 0.0,
  }) {
    // 1. Coverage Risk: Derived from syllabus exposure.
    final coverageRisk = 1.0 - coverage.coveragePercent;

    // 2. Mastery Risk: Derived from aggregate preparation depth.
    final masteryRisk = coverage.totalNodes == 0
        ? 1.0
        : 1.0 - (coverage.masteredNodes / coverage.totalNodes);

    // 3. Blended Weakness Protocol (Section 18 Logic applied at Mission Level)
    // Constitutional Law: Weights prioritize Internal Mastery (35%) and External Graph Propagation (30%)
    final weaknessRisk = (atomicWeaknessRisk * 0.7) + (cascadeRisk * 0.3);

    // 4. Overall Aggregate Risk
    final overallRisk = (coverageRisk * 0.25) + (masteryRisk * 0.35) + (weaknessRisk * 0.40);

    return RiskState(
      overallRisk: overallRisk.clamp(0.0, 1.0),
      coverageRisk: coverageRisk,
      masteryRisk: masteryRisk,
      weaknessRisk: weaknessRisk,
      highRisk: overallRisk >= 0.60,
    );
  }

  // ===================================================
  // UTILITIES 
  // ===================================================

  static String _determineStatus(double score) {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Minimal';
  }

  static String _determineTrend(double current, double previous) {
    final diff = current - previous;
    if (diff > 5.0) return 'Escalating';
    if (diff > 0.5) return 'Increasing';
    if (diff < -0.5) return 'Declining';
    return 'Stable';
  }
}
