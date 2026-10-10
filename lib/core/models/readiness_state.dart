import 'package:equatable/equatable.dart';

/// READINESS STATE
/// The supreme learner metric representing total examination preparedness.
/// Implements Document 32 Sections 10-27.
class ReadinessState extends Equatable {
  final double score; // 0-100
  final double confidence; // 0-1.0
  final String status; // Critical, Weak, Developing, Ready, Mission Ready
  final String trend; // Declining, Stable, Improving, Accelerating
  final double successProbability; // 0-1.0
  final DateTime calculatedAt;
  final int version;

  const ReadinessState({
    required this.score,
    required this.confidence,
    required this.status,
    required this.trend,
    required this.successProbability,
    required this.calculatedAt,
    this.version = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'score': score,
      'confidence': confidence,
      'status': status,
      'trend': trend,
      'successProbability': successProbability,
      'calculatedAt': calculatedAt.millisecondsSinceEpoch,
      'version': version,
    };
  }

  factory ReadinessState.fromMap(Map<String, dynamic> map) {
    return ReadinessState(
      score: (map['score'] ?? 0.0).toDouble(),
      confidence: (map['confidence'] ?? 0.0).toDouble(),
      status: map['status'] ?? 'Critical',
      trend: map['trend'] ?? 'Stable',
      successProbability: (map['successProbability'] ?? 0.0).toDouble(),
      calculatedAt: DateTime.fromMillisecondsSinceEpoch(map['calculatedAt'] ?? 0),
      version: map['version'] ?? 1,
    );
  }

  @override
  List<Object?> get props => [
        score,
        confidence,
        status,
        trend,
        successProbability,
        calculatedAt,
        version,
      ];
}
