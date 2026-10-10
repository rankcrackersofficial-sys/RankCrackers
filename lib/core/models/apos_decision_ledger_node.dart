import 'package:equatable/equatable.dart';

/// APOS DECISION LEDGER NODE (Blueprint v1.0 - Document 64)
/// Permanent forensic log of every executive decision made by the system.
class APOSDecisionLedgerNode extends Equatable {
  final String id;
  final String userId;
  final String realmId;
  
  final String decisionType; // e.g., CAMPAIGN_GEN, MISSION_ASSIGN, BUDGET_ALLOC
  final String traceId;      // Link to DecisionTraceNode
  
  final Map<String, dynamic> outputSnapshot; // Final state of the generated node
  final String executionStatus; // SUCCESS, FAILED, BYPASSED
  
  final double confidenceScore;
  final DateTime timestamp;

  const APOSDecisionLedgerNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.decisionType,
    required this.traceId,
    required this.outputSnapshot,
    required this.executionStatus,
    required this.confidenceScore,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'decisionType': decisionType,
      'traceId': traceId,
      'outputSnapshot': outputSnapshot,
      'executionStatus': executionStatus,
      'confidenceScore': confidenceScore,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory APOSDecisionLedgerNode.fromMap(Map<String, dynamic> map) {
    return APOSDecisionLedgerNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      decisionType: map['decisionType'] ?? '',
      traceId: map['traceId'] ?? '',
      outputSnapshot: Map<String, dynamic>.from(map['outputSnapshot'] ?? {}),
      executionStatus: map['executionStatus'] ?? 'SUCCESS',
      confidenceScore: (map['confidenceScore'] ?? 0.0).toDouble(),
      timestamp: DateTime.parse(map['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [id, userId, decisionType, timestamp];
}
