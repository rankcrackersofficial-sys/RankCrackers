class SelectionImpactState {
  final double selectionScore;

  final double coverageImpact;

  final double masteryImpact;

  final double riskImpact;

  final bool selectionReady;

  const SelectionImpactState({
    required this.selectionScore,
    required this.coverageImpact,
    required this.masteryImpact,
    required this.riskImpact,
    required this.selectionReady,
  });

  SelectionImpactState copyWith({
    double? selectionScore,
    double? coverageImpact,
    double? masteryImpact,
    double? riskImpact,
    bool? selectionReady,
  }) {
    return SelectionImpactState(
      selectionScore:
      selectionScore ??
          this.selectionScore,
      coverageImpact:
      coverageImpact ??
          this.coverageImpact,
      masteryImpact:
      masteryImpact ??
          this.masteryImpact,
      riskImpact:
      riskImpact ??
          this.riskImpact,
      selectionReady:
      selectionReady ??
          this.selectionReady,
    );
  }
}