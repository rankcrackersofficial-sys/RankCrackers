import 'package:equatable/equatable.dart';

/// 🔱 CRUCIBLE CLUSTER (Blueprint v1.0)
/// Groups all Crucible Nodes for a specific Atomic Topic.
class CrucibleCluster extends Equatable {
  final String id;
  final String atomicTopicId;
  final String realmId;
  final List<String> nodeIds;
  final double coverageScore;

  const CrucibleCluster({
    required this.id,
    required this.atomicTopicId,
    required this.realmId,
    required this.nodeIds,
    this.coverageScore = 0.0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'atomic_topic_id': atomicTopicId,
      'realm_id': realmId,
      'node_ids': nodeIds,
      'coverage_score': coverageScore,
    };
  }

  factory CrucibleCluster.fromMap(Map<String, dynamic> map) {
    return CrucibleCluster(
      id: map['id'] ?? '',
      atomicTopicId: map['atomic_topic_id'] ?? '',
      realmId: map['realm_id'] ?? '',
      nodeIds: List<String>.from(map['node_ids'] ?? []),
      coverageScore: (map['coverage_score'] ?? 0.0).toDouble(),
    );
  }

  @override
  List<Object?> get props => [id, atomicTopicId, realmId, nodeIds];
}
