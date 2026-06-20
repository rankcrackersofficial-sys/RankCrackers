import 'package:equatable/equatable.dart';

/// 🔱 REBUILD CANDIDATE (Article 12)
/// Represents a topic identified for recovery based on failure evidence.
class RebuildCandidate extends Equatable {
  final String nodeId;
  final String reason; // 'low_mastery', 'failed_battles', 'retention_collapse'
  final DateTime identifiedAt;
  final double priorityScore;

  const RebuildCandidate({
    required this.nodeId,
    required this.reason,
    required this.identifiedAt,
    required this.priorityScore,
  });

  @override
  List<Object?> get props => [nodeId, reason, identifiedAt, priorityScore];
}
