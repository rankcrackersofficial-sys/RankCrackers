import 'package:equatable/equatable.dart';

/// FUSION NODE (Blueprint v1.1 - Sprint L Ready)
/// The bridge between intelligence and action. 
/// Fuses Breadth (Coverage) and Depth (Mastery) to dictate student strategy.
class FusionNode extends Equatable {
  final String id; // [userId]_[atomicTopicId]
  final String userId;
  final String realmId;
  final String atomicTopicId;

  final double masteryScore;
  final double coverageScore;
  final double riskScore;

  final int priorityScore; // 1-100 (derived from fusion)
  final String action; // IGNORE, REVISE, PRACTICE, MASTER, EMERGENCY
  
  final List<String> reasons; // Audit Sprint L Gap Fix: WHY this priority?

  final DateTime fusedAt;

  const FusionNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.atomicTopicId,
    required this.masteryScore,
    required this.coverageScore,
    required this.riskScore,
    required this.priorityScore,
    required this.action,
    this.reasons = const [],
    required this.fusedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'atomic_topic_id': atomicTopicId,
      'mastery_score': masteryScore,
      'coverage_score': coverageScore,
      'risk_score': riskScore,
      'priority_score': priorityScore,
      'action': action,
      'reasons': reasons,
      'fused_at': fusedAt.toIso8601String(),
    };
  }

  factory FusionNode.fromMap(Map<String, dynamic> map) {
    return FusionNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realm_id'] ?? '',
      atomicTopicId: map['atomic_topic_id'] ?? '',
      masteryScore: (map['mastery_score'] ?? 0.0).toDouble(),
      coverageScore: (map['coverage_score'] ?? 0.0).toDouble(),
      riskScore: (map['risk_score'] ?? 0.0).toDouble(),
      priorityScore: map['priority_score'] ?? 0,
      action: map['action'] ?? 'IGNORE',
      reasons: List<String>.from(map['reasons'] ?? []),
      fusedAt: DateTime.parse(map['fused_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [id, priorityScore, action, reasons, fusedAt];
}
