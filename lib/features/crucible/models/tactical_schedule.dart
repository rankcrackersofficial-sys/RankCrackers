import 'package:equatable/equatable.dart';
import '../../../core/models/micro_topic_node.dart';

/// 🔱 TACTICAL SCHEDULE (Hydrated)
/// Represents the runtime instance of a 2-day block within the 100-Day Protocol.
/// Contains the physically resolved MicroTopicNodes for immediate preparation.
class TacticalSchedule extends Equatable {
  final String id;
  final String recruitmentId;
  final int scheduleIndex;
  final List<MicroTopicNode> nodes;
  final String type; // study, rebuild, macro_test, major_test
  final double targetHours;
  final DateTime startTime;
  final DateTime endTime;

  const TacticalSchedule({
    required this.id,
    required this.recruitmentId,
    required this.scheduleIndex,
    required this.nodes,
    required this.type,
    required this.targetHours,
    required this.startTime,
    required this.endTime,
  });

  @override
  List<Object?> get props => [
        id,
        recruitmentId,
        scheduleIndex,
        nodes,
        type,
        targetHours,
        startTime,
        endTime,
      ];
}
