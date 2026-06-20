// FILE: lib/features/dashboard/data/models/dashboard_model.dart

import 'battle_mission_model.dart';

class DashboardModel {
  final int currentDay;
  final double totalSyllabusProgress;
  final String scheduleHealth;
  final double examReadiness;
  final double dailyStudyHours;
  final int consistencyStreak;
  final String focusMode;

  // प्रकारों को String से बदलकर BattleMission ऑब्जेक्ट्स में लॉक किया गया
  final List<BattleMission> todayMissions;
  final List<String> weakAlerts;
  final List<BattleMission> pendingCarryForward;
  final List<BattleMission> revisionInjections;
  final List<DashboardWeakZone> weakZones;

  DashboardModel({
    required this.currentDay,
    required this.totalSyllabusProgress,
    required this.scheduleHealth,
    required this.examReadiness,
    required this.dailyStudyHours,
    required this.consistencyStreak,
    required this.focusMode,
    required this.todayMissions,
    required this.weakAlerts,
    required this.pendingCarryForward,
    required this.revisionInjections,
    required this.weakZones,
  });
}

class DashboardWeakZone {
  final String title;
  final String accuracy;
  final double progress;

  DashboardWeakZone({
    required this.title,
    required this.accuracy,
    required this.progress,
  });
}