import 'package:equatable/equatable.dart';

/// 🔱 CAMPAIGN TYPE (Blueprint v1.0 - Sprint N)
enum CampaignType {
  RECOVERY,
  STRIKE,
  MAINTENANCE,
  FOUNDATION
}

/// 🔱 CAMPAIGN NODE (Blueprint v1.0 - Document 51)
/// Represents a multi-day strategic objective (e.g., 7-Day Polity Recovery).
class CampaignNode extends Equatable {
  final String id;
  final String userId;
  final String realmId;
  final String title;

  final CampaignType type;
  final List<String> focusAtomicTopicIds;

  final DateTime startDate;
  final DateTime endDate;
  
  final Map<int, List<String>> dayWiseMissionTypes; // Day Number -> Mission Types
  
  // 🔱 Audit Sprint Q: Evidence-Driven Tracking
  final List<String> completedMissionIds;
  final int totalScheduledMissions;

  final bool active;
  final double progress; // 0.0 to 100.0

  const CampaignNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.title,
    required this.type,
    required this.focusAtomicTopicIds,
    required this.startDate,
    required this.endDate,
    required this.dayWiseMissionTypes,
    this.completedMissionIds = const [],
    this.totalScheduledMissions = 7, // Baseline
    this.active = true,
    this.progress = 0.0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'title': title,
      'type': type.name,
      'focusAtomicTopicIds': focusAtomicTopicIds,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'dayWiseMissionTypes': dayWiseMissionTypes.map((k, v) => MapEntry(k.toString(), v)),
      'completed_mission_ids': completedMissionIds,
      'total_scheduled_missions': totalScheduledMissions,
      'active': active,
      'progress': progress,
    };
  }

  factory CampaignNode.fromMap(Map<String, dynamic> map) {
    return CampaignNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      title: map['title'] ?? '',
      type: CampaignType.values.byName(map['type'] ?? 'RECOVERY'),
      focusAtomicTopicIds: List<String>.from(map['focusAtomicTopicIds'] ?? []),
      startDate: DateTime.parse(map['startDate'] ?? DateTime.now().toIso8601String()),
      endDate: DateTime.parse(map['endDate'] ?? DateTime.now().add(const Duration(days: 7)).toIso8601String()),
      dayWiseMissionTypes: (map['dayWiseMissionTypes'] as Map? ?? {}).map((k, v) => MapEntry(int.parse(k.toString()), List<String>.from(v))),
      completedMissionIds: List<String>.from(map['completed_mission_ids'] ?? []),
      totalScheduledMissions: map['total_scheduled_missions'] ?? 7,
      active: map['active'] ?? true,
      progress: (map['progress'] ?? 0.0).toDouble(),
    );
  }

  @override
  List<Object?> get props => [id, userId, type, active, progress];
}
