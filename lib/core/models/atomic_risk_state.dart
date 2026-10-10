import 'package:equatable/equatable.dart';

/// ATOMIC RISK STATE
/// Represents the vulnerability level of an Atomic Topic.
/// Implements Document 35.
class AtomicRiskState extends Equatable {
  final String id;
  final String atomicTopicId;
  final double score; // 0-100 (Maximum Vulnerability)
  final double confidence; // 0-1.0
  final String status; // Minimal, Low, Moderate, High, Critical
  final String trend; // Declining, Stable, Increasing, Escalating
  final double coverageDeficiency; // 0-1.0
  final double masteryDeficiency; // 0-1.0
  final double assessmentWeakness; // 0-1.0
  final double recencyWeakness; // 0-1.0
  final DateTime lastCalculatedAt;
  final int version;

  const AtomicRiskState({
    required this.id,
    required this.atomicTopicId,
    required this.score,
    required this.confidence,
    required this.status,
    required this.trend,
    required this.coverageDeficiency,
    required this.masteryDeficiency,
    required this.assessmentWeakness,
    required this.recencyWeakness,
    required this.lastCalculatedAt,
    this.version = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'atomicTopicId': atomicTopicId,
      'score': score,
      'confidence': confidence,
      'status': status,
      'trend': trend,
      'coverageDeficiency': coverageDeficiency,
      'masteryDeficiency': masteryDeficiency,
      'assessmentWeakness': assessmentWeakness,
      'recencyWeakness': recencyWeakness,
      'lastCalculatedAt': lastCalculatedAt.millisecondsSinceEpoch,
      'version': version,
    };
  }

  factory AtomicRiskState.fromMap(Map<String, dynamic> map) {
    return AtomicRiskState(
      id: map['id'] ?? '',
      atomicTopicId: map['atomicTopicId'] ?? '',
      score: (map['score'] ?? 0.0).toDouble(),
      confidence: (map['confidence'] ?? 0.0).toDouble(),
      status: map['status'] ?? 'Minimal',
      trend: map['trend'] ?? 'Stable',
      coverageDeficiency: (map['coverageDeficiency'] ?? 0.0).toDouble(),
      masteryDeficiency: (map['masteryDeficiency'] ?? 0.0).toDouble(),
      assessmentWeakness: (map['assessmentWeakness'] ?? 0.0).toDouble(),
      recencyWeakness: (map['recencyWeakness'] ?? 0.0).toDouble(),
      lastCalculatedAt: DateTime.fromMillisecondsSinceEpoch(map['lastCalculatedAt'] ?? 0),
      version: map['version'] ?? 1,
    );
  }

  @override
  List<Object?> get props => [
        id,
        atomicTopicId,
        score,
        confidence,
        status,
        trend,
        coverageDeficiency,
        masteryDeficiency,
        assessmentWeakness,
        recencyWeakness,
        lastCalculatedAt,
        version,
      ];
}
