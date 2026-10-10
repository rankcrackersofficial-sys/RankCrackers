import 'package:equatable/equatable.dart';

/// DECISION TRACE NODE (Blueprint v1.0 - Document 61)
/// Captures the physical evidence and logical flow behind an APOS decision.
class DecisionTraceNode extends Equatable {
  final String id;
  final String userId;
  final String realmId;
  
  final String targetType; // MISSION, CAMPAIGN, BUDGET, FORECAST
  final String targetId;   // ID of the resulting node
  
  final Map<String, dynamic> inputs; // Snapshot of Risk, Mastery, Coverage, ExamClock
  final List<String> logicalChain;   // Step-by-step logic applied by engines
  final String decisionSource;       // FusionEngine, MissionPlanner, etc.
  
  final DateTime timestamp;

  const DecisionTraceNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.targetType,
    required this.targetId,
    required this.inputs,
    required this.logicalChain,
    required this.decisionSource,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'targetType': targetType,
      'targetId': targetId,
      'inputs': inputs,
      'logicalChain': logicalChain,
      'decisionSource': decisionSource,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory DecisionTraceNode.fromMap(Map<String, dynamic> map) {
    return DecisionTraceNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      targetType: map['targetType'] ?? '',
      targetId: map['targetId'] ?? '',
      inputs: Map<String, dynamic>.from(map['inputs'] ?? {}),
      logicalChain: List<String>.from(map['logicalChain'] ?? []),
      decisionSource: map['decisionSource'] ?? '',
      timestamp: DateTime.parse(map['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [id, userId, targetType, targetId, timestamp];
}
