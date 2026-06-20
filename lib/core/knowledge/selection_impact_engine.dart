import '../models/coverage_state.dart';
import '../models/risk_state.dart';
import '../models/selection_impact_state.dart';

class SelectionImpactEngine {
  static SelectionImpactState calculate({
    required CoverageState coverage,
    required RiskState risk,
  }) {
    final coverageImpact =
        coverage.coveragePercent;

    final masteryImpact =
    coverage.totalNodes == 0
        ? 0.0
        : coverage.masteredNodes /
        coverage.totalNodes;

    final riskImpact =
        1 - risk.overallRisk;

    final selectionScore =
        (coverageImpact +
            masteryImpact +
            riskImpact) /
            3;

    return SelectionImpactState(
      selectionScore:
      selectionScore,
      coverageImpact:
      coverageImpact,
      masteryImpact:
      masteryImpact,
      riskImpact:
      riskImpact,
      selectionReady:
      selectionScore >= 0.75,
    );
  }
}