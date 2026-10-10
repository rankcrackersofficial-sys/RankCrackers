import 'package:equatable/equatable.dart';

/// SUCCESS PROBABILITY (Blueprint v1.0 - Document 57)
/// The executive intelligence layer that predicts exam outcome.
class SuccessProbabilityNode extends Equatable {
  final String userId;
  final String realmId;
  
  final double overallProbability; // 0.0 to 100.0
  final List<String> failureDrivers; // Reasons for potential failure
  
  final Map<String, double> subjectReadiness; // Subject -> Projected Readiness
  final Map<String, double> actionImpact; // Potential improvement if action taken
  
  final DateTime calculatedAt;

  const SuccessProbabilityNode({
    required this.userId,
    required this.realmId,
    required this.overallProbability,
    required this.failureDrivers,
    required this.subjectReadiness,
    required this.actionImpact,
    required this.calculatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'realmId': realmId,
      'overallProbability': overallProbability,
      'failureDrivers': failureDrivers,
      'subjectReadiness': subjectReadiness,
      'actionImpact': actionImpact,
      'calculatedAt': calculatedAt.toIso8601String(),
    };
  }

  factory SuccessProbabilityNode.fromMap(Map<String, dynamic> map) {
    return SuccessProbabilityNode(
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      overallProbability: (map['overallProbability'] ?? 0.0).toDouble(),
      failureDrivers: List<String>.from(map['failureDrivers'] ?? []),
      subjectReadiness: Map<String, double>.from(map['subjectReadiness'] ?? {}),
      actionImpact: Map<String, double>.from(map['actionImpact'] ?? {}),
      calculatedAt: DateTime.parse(map['calculatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [userId, realmId, overallProbability, calculatedAt];
}
