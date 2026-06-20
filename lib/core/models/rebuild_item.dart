import 'package:equatable/equatable.dart';

/// 🔱 REBUILD ITEM
/// Represents a tactical objective for recovery.
class RebuildItem extends Equatable {
  final String nodeId;
  final String nodeTitle;
  final double mastery;
  final double priorityScore;

  const RebuildItem({
    required this.nodeId,
    required this.nodeTitle,
    required this.mastery,
    required this.priorityScore,
  });

  RebuildItem copyWith({
    String? nodeId,
    String? nodeTitle,
    double? mastery,
    double? priorityScore,
  }) {
    return RebuildItem(
      nodeId: nodeId ?? this.nodeId,
      nodeTitle: nodeTitle ?? this.nodeTitle,
      mastery: mastery ?? this.mastery,
      priorityScore: priorityScore ?? this.priorityScore,
    );
  }

  @override
  List<Object?> get props => [
    nodeId,
    nodeTitle,
    mastery,
    priorityScore,
  ];
}
