import 'package:equatable/equatable.dart';

/// DRIFT DETECTION NODE (Blueprint v1.0 - Document 65)
/// Captures divergence between plan execution and preparation outcomes.
class DriftDetectionNode extends Equatable {
  final String id;
  final String userId;
  final String realmId;
  
  final double planCompliance;    // 0.0 to 100.0 (% of missions finished)
  final double probabilityDelta; // Growth/Fall of Success Probability
  
  final String driftStatus; // STABLE, CONVERGING, DRIFTING, COLLAPSING
  final String primaryDriftReason;
  
  final DateTime detectedAt;

  const DriftDetectionNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.planCompliance,
    required this.probabilityDelta,
    required this.driftStatus,
    required this.primaryDriftReason,
    required this.detectedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'planCompliance': planCompliance,
      'probabilityDelta': probabilityDelta,
      'driftStatus': driftStatus,
      'primaryDriftReason': primaryDriftReason,
      'detectedAt': detectedAt.toIso8601String(),
    };
  }

  factory DriftDetectionNode.fromMap(Map<String, dynamic> map) {
    return DriftDetectionNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      planCompliance: (map['planCompliance'] ?? 0.0).toDouble(),
      probabilityDelta: (map['probabilityDelta'] ?? 0.0).toDouble(),
      driftStatus: map['driftStatus'] ?? 'STABLE',
      primaryDriftReason: map['primaryDriftReason'] ?? '',
      detectedAt: DateTime.parse(map['detectedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [id, userId, driftStatus, detectedAt];
}
