import 'package:equatable/equatable.dart';

/// READINESS FORECAST (Blueprint v1.0 - Document 55)
/// Predicts future student state based on current momentum and study velocity.
class ForecastNode extends Equatable {
  final String userId;
  final String realmId;
  
  final double projectedReadiness7d;
  final double projectedReadiness30d;
  final double projectedReadinessExamDay;
  
  final double projectedCoverageExamDay;
  final double projectedMasteryExamDay;
  
  final DateTime calculatedAt;

  const ForecastNode({
    required this.userId,
    required this.realmId,
    required this.projectedReadiness7d,
    required this.projectedReadiness30d,
    required this.projectedReadinessExamDay,
    required this.projectedCoverageExamDay,
    required this.projectedMasteryExamDay,
    required this.calculatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'realmId': realmId,
      'projectedReadiness7d': projectedReadiness7d,
      'projectedReadiness30d': projectedReadiness30d,
      'projectedReadinessExamDay': projectedReadinessExamDay,
      'projectedCoverageExamDay': projectedCoverageExamDay,
      'projectedMasteryExamDay': projectedMasteryExamDay,
      'calculatedAt': calculatedAt.toIso8601String(),
    };
  }

  factory ForecastNode.fromMap(Map<String, dynamic> map) {
    return ForecastNode(
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      projectedReadiness7d: (map['projectedReadiness7d'] ?? 0.0).toDouble(),
      projectedReadiness30d: (map['projectedReadiness30d'] ?? 0.0).toDouble(),
      projectedReadinessExamDay: (map['projectedReadinessExamDay'] ?? 0.0).toDouble(),
      projectedCoverageExamDay: (map['projectedCoverageExamDay'] ?? 0.0).toDouble(),
      projectedMasteryExamDay: (map['projectedMasteryExamDay'] ?? 0.0).toDouble(),
      calculatedAt: DateTime.parse(map['calculatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [userId, realmId, projectedReadinessExamDay, calculatedAt];
}
