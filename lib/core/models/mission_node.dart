import 'package:equatable/equatable.dart';

/// MISSION NODE (Blueprint v1.1 - Sprint M Ready)
/// Represents a daily actionable study mission generated from Fusion intelligence.
class MissionNode extends Equatable {
  final String id;
  final String userId;
  final String realmId;

  final List<String> atomicTopicIds; // Topics assigned to this mission
  
  // Audit Sprint M Gap Fix: Forensic Linkage
  final List<String> sourceFusionIds;
  final List<String> sourceRiskIds;

  final String missionType; // MASTER_TOPIC, PRACTICE_TOPIC, REVISE_TOPIC, EMERGENCY_RECOVERY, PYQ_STRIKE

  final int estimatedMinutes;
  final int priority; // 1 (Highest) to N

  final DateTime generatedAt;
  final bool completed;

  const MissionNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.atomicTopicIds,
    this.sourceFusionIds = const [],
    this.sourceRiskIds = const [],
    required this.missionType,
    required this.estimatedMinutes,
    required this.priority,
    required this.generatedAt,
    this.completed = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'atomicTopicIds': atomicTopicIds,
      'sourceFusionIds': sourceFusionIds,
      'sourceRiskIds': sourceRiskIds,
      'missionType': missionType,
      'estimatedMinutes': estimatedMinutes,
      'priority': priority,
      'generatedAt': generatedAt.toIso8601String(),
      'completed': completed,
    };
  }

  factory MissionNode.fromMap(Map<String, dynamic> map) {
    return MissionNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      atomicTopicIds: List<String>.from(map['atomicTopicIds'] ?? []),
      sourceFusionIds: List<String>.from(map['sourceFusionIds'] ?? []),
      sourceRiskIds: List<String>.from(map['sourceRiskIds'] ?? []),
      missionType: map['missionType'] ?? 'MASTER_TOPIC',
      estimatedMinutes: map['estimatedMinutes'] ?? 30,
      priority: map['priority'] ?? 1,
      generatedAt: DateTime.parse(map['generatedAt'] ?? DateTime.now().toIso8601String()),
      completed: map['completed'] ?? false,
    );
  }

  @override
  List<Object?> get props => [id, userId, missionType, priority, completed, atomicTopicIds];
}
