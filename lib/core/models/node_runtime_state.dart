import 'package:equatable/equatable.dart';

/// NODE RUNTIME STATE
/// Separates volatile user-specific progress and live state from immutable content.
class NodeRuntimeState extends Equatable {
  final String nodeId;
  final double mastery;
  final bool completed;
  final bool activeBattle;
  final int revisionLevel;
  final int battlesWon;
  final int battlesLost;
  final double totalStudyMinutes; // Audit Fix: Precision recovery
  final DateTime? lastStudiedAt;
  final DateTime? lastReviewed;

  // EVIDENCE CHAIN (Article 7 Audit Fix)
  final double assessmentEvidence; 
  final double readingEvidence;
  final double revisionEvidence;
  final double evidenceScore;

  const NodeRuntimeState({
    required this.nodeId,
    this.mastery = 0.0,
    this.completed = false,
    this.activeBattle = false,
    this.revisionLevel = 1,
    this.battlesWon = 0,
    this.battlesLost = 0,
    this.totalStudyMinutes = 0.0,
    this.lastStudiedAt,
    this.lastReviewed,
    this.assessmentEvidence = 0.0,
    this.readingEvidence = 0.0,
    this.revisionEvidence = 0.0,
    this.evidenceScore = 0.0,
  });

  NodeRuntimeState copyWith({
    String? nodeId,
    double? mastery,
    bool? completed,
    bool? activeBattle,
    int? revisionLevel,
    int? battlesWon,
    int? battlesLost,
    double? totalStudyMinutes,
    DateTime? lastStudiedAt,
    DateTime? lastReviewed,
    double? assessmentEvidence,
    double? readingEvidence,
    double? revisionEvidence,
    double? evidenceScore,
  }) {
    return NodeRuntimeState(
      nodeId: nodeId ?? this.nodeId,
      mastery: mastery ?? this.mastery,
      completed: completed ?? this.completed,
      activeBattle: activeBattle ?? this.activeBattle,
      revisionLevel: revisionLevel ?? this.revisionLevel,
      battlesWon: battlesWon ?? this.battlesWon,
      battlesLost: battlesLost ?? this.battlesLost,
      totalStudyMinutes: totalStudyMinutes ?? this.totalStudyMinutes,
      lastStudiedAt: lastStudiedAt ?? this.lastStudiedAt,
      lastReviewed: lastReviewed ?? this.lastReviewed,
      assessmentEvidence: assessmentEvidence ?? this.assessmentEvidence,
      readingEvidence: readingEvidence ?? this.readingEvidence,
      revisionEvidence: revisionEvidence ?? this.revisionEvidence,
      evidenceScore: evidenceScore ?? this.evidenceScore,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nodeId': nodeId,
      'mastery': mastery,
      'completed': completed,
      'activeBattle': activeBattle,
      'revisionLevel': revisionLevel,
      'battlesWon': battlesWon,
      'battlesLost': battlesLost,
      'totalStudyMinutes': totalStudyMinutes,
      'lastStudiedAt': lastStudiedAt?.millisecondsSinceEpoch,
      'lastReviewed': lastReviewed?.millisecondsSinceEpoch,
      'assessmentEvidence': assessmentEvidence,
      'readingEvidence': readingEvidence,
      'revisionEvidence': revisionEvidence,
      'evidenceScore': evidenceScore,
    };
  }

  factory NodeRuntimeState.fromMap(Map<String, dynamic> map) {
    return NodeRuntimeState(
      nodeId: map['nodeId'] ?? '',
      mastery: (map['mastery'] ?? 0.0).toDouble(),
      completed: map['completed'] ?? false,
      activeBattle: map['activeBattle'] ?? false,
      revisionLevel: map['revisionLevel'] ?? 1,
      battlesWon: map['battlesWon'] ?? 0,
      battlesLost: map['battlesLost'] ?? 0,
      totalStudyMinutes: (map['totalStudyMinutes'] ?? 0.0).toDouble(),
      lastStudiedAt: map['lastStudiedAt'] != null 
          ? DateTime.fromMillisecondsSinceEpoch(map['lastStudiedAt']) 
          : null,
      lastReviewed: map['lastReviewed'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['lastReviewed'])
          : null,
      assessmentEvidence: (map['assessmentEvidence'] ?? 0.0).toDouble(),
      readingEvidence: (map['readingEvidence'] ?? 0.0).toDouble(),
      revisionEvidence: (map['revisionEvidence'] ?? 0.0).toDouble(),
      evidenceScore: (map['evidenceScore'] ?? 0.0).toDouble(),
    );
  }

  @override
  List<Object?> get props => [
    nodeId,
    mastery,
    completed,
    activeBattle,
    revisionLevel,
    battlesWon,
    battlesLost,
    totalStudyMinutes,
    lastStudiedAt,
    lastReviewed,
    assessmentEvidence,
    readingEvidence,
    revisionEvidence,
    evidenceScore,
  ];
}
