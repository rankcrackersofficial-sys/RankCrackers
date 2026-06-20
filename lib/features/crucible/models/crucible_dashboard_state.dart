class CrucibleDashboardState {
  final int currentDay;
  final int currentPhase;
  final int hoursRemaining;
  final double syllabusProgress;
  final bool microTestUnlocked;

  const CrucibleDashboardState({
    required this.currentDay,
    required this.currentPhase,
    required this.hoursRemaining,
    required this.syllabusProgress,
    required this.microTestUnlocked,
  });
}
