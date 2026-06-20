import 'package:equatable/equatable.dart';

/// 🔱 RISK NODE (Blueprint v1.0 - Document 49)
/// Represents the decision-making intelligence for an Atomic Topic.
class RiskNode extends Equatable {
  final String id; // [userId]_[atomicTopicId]
  final String userId;
  final String realmId;
  final String atomicTopicId;

  final double riskScore; // 0.0 to 100.0 (High means high risk)
  final String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

  final List<String> reasons; // ["Low Coverage", "Weak Mastery", "High PYQ Weight"]
  final DateTime calculatedAt;

  const RiskNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.atomicTopicId,
    this.riskScore = 0.0,
    this.riskLevel = 'LOW',
    this.reasons = const [],
    required this.calculatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'atomicTopicId': atomicTopicId,
      'riskScore': riskScore,
      'risk_level': riskLevel,
      'reasons': reasons,
      'calculatedAt': calculatedAt.toIso8601String(),
    };
  }

  factory RiskNode.fromMap(Map<String, dynamic> map) {
    return RiskNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      atomicTopicId: map['atomicTopicId'] ?? '',
      riskScore: (map['riskScore'] ?? 0.0).toDouble(),
      riskLevel: map['risk_level'] ?? 'LOW',
      reasons: List<String>.from(map['reasons'] ?? []),
      calculatedAt: DateTime.parse(map['calculatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [id, userId, riskScore, riskLevel, reasons];
}
