import 'package:equatable/equatable.dart';

/// 🔱 ATOMIC COVERAGE STATE
/// Represents the scope completion level of an Atomic Topic.
/// Implements Document 34.
class AtomicCoverageState extends Equatable {
  final String atomicTopicId;
  final double score; // 0-100 (Sovereign Coverage)
  final String status; // Not Started, In Progress, Covered, Verified
  final String trend; // Stalled, Slow, Steady, Accelerating
  final double verificationScore; // 0-1.0 (Assessment based)
  final DateTime lastEvidenceAt;
  final int version;

  const AtomicCoverageState({
    required this.atomicTopicId,
    required this.score,
    required this.status,
    required this.trend,
    required this.verificationScore,
    required this.lastEvidenceAt,
    this.version = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'atomicTopicId': atomicTopicId,
      'score': score,
      'status': status,
      'trend': trend,
      'verificationScore': verificationScore,
      'lastEvidenceAt': lastEvidenceAt.millisecondsSinceEpoch,
      'version': version,
    };
  }

  factory AtomicCoverageState.fromMap(Map<String, dynamic> map) {
    return AtomicCoverageState(
      atomicTopicId: map['atomicTopicId'] ?? '',
      score: (map['score'] ?? 0.0).toDouble(),
      status: map['status'] ?? 'Not Started',
      trend: map['trend'] ?? 'Steady',
      verificationScore: (map['verificationScore'] ?? 0.0).toDouble(),
      lastEvidenceAt: DateTime.fromMillisecondsSinceEpoch(map['lastEvidenceAt'] ?? 0),
      version: map['version'] ?? 1,
    );
  }

  @override
  List<Object?> get props => [
        atomicTopicId,
        score,
        status,
        trend,
        verificationScore,
        lastEvidenceAt,
        version,
      ];
}
