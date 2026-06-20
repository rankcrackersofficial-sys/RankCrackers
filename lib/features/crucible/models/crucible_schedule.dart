import 'package:equatable/equatable.dart';

/// 🔱 CRUCIBLE SCHEDULE
/// The specific tactical session roadmap for a 2-day block.
class CrucibleSchedule extends Equatable {
  final String id;
  final String recruitmentId;
  final int scheduleIndex;
  final List<String> nodeIds;
  final List<String> atomicTopicIds; // 🔱 Document 30: Constitutional Unit of Coverage
  final String scheduleType; // study, rebuild, macro_test, major_test
  final double targetHours;
  final String blueprintId;
  final String digibookSessionId;
  final double priorityScore; // 🔱 ADDED: Dynamic sorting anchor

  const CrucibleSchedule({
    required this.id,
    required this.recruitmentId,
    required this.scheduleIndex,
    required this.nodeIds,
    this.atomicTopicIds = const [],
    required this.scheduleType,
    required this.targetHours,
    required this.blueprintId,
    required this.digibookSessionId,
    this.priorityScore = 0.0,
  });

  CrucibleSchedule copyWith({
    String? id,
    String? recruitmentId,
    int? scheduleIndex,
    List<String>? nodeIds,
    List<String>? atomicTopicIds,
    String? scheduleType,
    double? targetHours,
    String? blueprintId,
    String? digibookSessionId,
    double? priorityScore,
  }) {
    return CrucibleSchedule(
      id: id ?? this.id,
      recruitmentId: recruitmentId ?? this.recruitmentId,
      scheduleIndex: scheduleIndex ?? this.scheduleIndex,
      nodeIds: nodeIds ?? this.nodeIds,
      atomicTopicIds: atomicTopicIds ?? this.atomicTopicIds,
      scheduleType: scheduleType ?? this.scheduleType,
      targetHours: targetHours ?? this.targetHours,
      blueprintId: blueprintId ?? this.blueprintId,
      digibookSessionId: digibookSessionId ?? this.digibookSessionId,
      priorityScore: priorityScore ?? this.priorityScore,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'recruitmentId': recruitmentId,
      'scheduleIndex': scheduleIndex,
      'nodeIds': nodeIds,
      'atomicTopicIds': atomicTopicIds,
      'scheduleType': scheduleType,
      'targetHours': targetHours,
      'blueprintId': blueprintId,
      'digibookSessionId': digibookSessionId,
      'priorityScore': priorityScore,
    };
  }

  factory CrucibleSchedule.fromMap(Map<String, dynamic> map) {
    return CrucibleSchedule(
      id: map['id'] ?? '',
      recruitmentId: map['recruitmentId'] ?? '',
      scheduleIndex: map['scheduleIndex'] ?? 0,
      nodeIds: List<String>.from(map['nodeIds'] ?? []),
      atomicTopicIds: List<String>.from(map['atomicTopicIds'] ?? []),
      scheduleType: map['scheduleType'] ?? 'study',
      targetHours: (map['targetHours'] ?? 0.0).toDouble(),
      blueprintId: map['blueprintId'] ?? '',
      digibookSessionId: map['digibookSessionId'] ?? '',
      priorityScore: (map['priorityScore'] ?? 0.0).toDouble(),
    );
  }

  @override
  List<Object?> get props => [
    id,
    recruitmentId,
    scheduleIndex,
    nodeIds,
    atomicTopicIds,
    scheduleType,
    targetHours,
    blueprintId,
    digibookSessionId,
    priorityScore,
  ];
}
