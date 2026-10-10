import 'package:equatable/equatable.dart';

/// ATOMIC MASTERY STATE
/// Represents the granular competence level of an Atomic Topic.
/// Implements Document 33.
class AtomicMasteryState extends Equatable {
  final String atomicTopicId;
  final double score; // 0-100
  final double confidence; // 0-1.0
  final String status; // Unknown, Learning, Developing, Strong, Mastered
  final String trend; // Declining, Stable, Improving, Accelerating
  final DateTime lastEvidenceAt;
  final int evidenceCount;
  final int version;

  const AtomicMasteryState({
    required this.atomicTopicId,
    required this.score,
    required this.confidence,
    required this.status,
    required this.trend,
    required this.lastEvidenceAt,
    this.evidenceCount = 0,
    this.version = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'atomicTopicId': atomicTopicId,
      'score': score,
      'confidence': confidence,
      'status': status,
      'trend': trend,
      'lastEvidenceAt': lastEvidenceAt.millisecondsSinceEpoch,
      'evidenceCount': evidenceCount,
      'version': version,
    };
  }

  factory AtomicMasteryState.fromMap(Map<String, dynamic> map) {
    return AtomicMasteryState(
      atomicTopicId: map['atomicTopicId'] ?? '',
      score: (map['score'] ?? 0.0).toDouble(),
      confidence: (map['confidence'] ?? 0.0).toDouble(),
      status: map['status'] ?? 'Unknown',
      trend: map['trend'] ?? 'Stable',
      lastEvidenceAt: DateTime.fromMillisecondsSinceEpoch(map['lastEvidenceAt'] ?? 0),
      evidenceCount: map['evidenceCount'] ?? 0,
      version: map['version'] ?? 1,
    );
  }

  @override
  List<Object?> get props => [
        atomicTopicId,
        score,
        confidence,
        status,
        trend,
        lastEvidenceAt,
        evidenceCount,
        version,
      ];
}
