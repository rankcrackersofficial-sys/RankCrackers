class RiskState {
  final double overallRisk;

  final double coverageRisk;

  final double masteryRisk;

  final double weaknessRisk;

  final bool highRisk;

  const RiskState({
    required this.overallRisk,
    required this.coverageRisk,
    required this.masteryRisk,
    required this.weaknessRisk,
    required this.highRisk,
  });

  RiskState copyWith({
    double? overallRisk,
    double? coverageRisk,
    double? masteryRisk,
    double? weaknessRisk,
    bool? highRisk,
  }) {
    return RiskState(
      overallRisk: overallRisk ?? this.overallRisk,
      coverageRisk: coverageRisk ?? this.coverageRisk,
      masteryRisk: masteryRisk ?? this.masteryRisk,
      weaknessRisk: weaknessRisk ?? this.weaknessRisk,
      highRisk: highRisk ?? this.highRisk,
    );
  }
}