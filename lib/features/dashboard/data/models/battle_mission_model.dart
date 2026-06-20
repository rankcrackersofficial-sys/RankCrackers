// FILE: lib/features/dashboard/data/models/battle_mission_model.dart

enum MissionState {
  created,
  inProgress,
  completed,
  failed,
  rolledForward,
  expired
}

class BattleMission {
  final String id;
  final String title;
  final String category;
  final double urgency;
  final int estimatedMinutes;
  final bool isRevision;
  final bool isBacklog;
  final MissionState state;
  final String memoryPressureTag;

  const BattleMission({
    required this.id,
    required this.title,
    required this.category,
    required this.urgency,
    required this.estimatedMinutes,
    required this.isRevision,
    required this.isBacklog,
    required this.state,
    required this.memoryPressureTag,
  });
}