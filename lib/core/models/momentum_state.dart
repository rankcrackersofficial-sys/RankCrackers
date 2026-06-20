class MomentumState {
  final int studyStreakDays;

  final int completedToday;

  final int completedThisWeek;

  final double momentumScore;

  final bool isStalled;

  final DateTime? lastStudyAt;

  const MomentumState({
    required this.studyStreakDays,
    required this.completedToday,
    required this.completedThisWeek,
    required this.momentumScore,
    required this.isStalled,
    this.lastStudyAt,
  });

  MomentumState copyWith({
    int? studyStreakDays,
    int? completedToday,
    int? completedThisWeek,
    double? momentumScore,
    bool? isStalled,
    DateTime? lastStudyAt,
  }) {
    return MomentumState(
      studyStreakDays:
      studyStreakDays ??
          this.studyStreakDays,
      completedToday:
      completedToday ??
          this.completedToday,
      completedThisWeek:
      completedThisWeek ??
          this.completedThisWeek,
      momentumScore:
      momentumScore ??
          this.momentumScore,
      isStalled:
      isStalled ??
          this.isStalled,
      lastStudyAt:
      lastStudyAt ??
          this.lastStudyAt,
    );
  }
}
