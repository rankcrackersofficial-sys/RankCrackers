import 'package:equatable/equatable.dart';

/// TEST ARENA RESULT
/// Immutable assessment outcome and ranking record for a student in a Test Arena event.
class TestArenaResult extends Equatable {
  final String eventId;
  final String uid;
  final int rawScore;
  final Map<String, int> domainScores; // subject/domain -> score
  final bool isLiveAttempt;
  final int? eventRank; // Official event rank (only for valid live participants)
  final int? participantCount;
  final double? percentile; // Percentile among live participants
  final double? historicalBenchmarkPercentile; // For late historical attempts
  final DateTime completedAt;

  const TestArenaResult({
    required this.eventId,
    required this.uid,
    required this.rawScore,
    required this.domainScores,
    required this.isLiveAttempt,
    this.eventRank,
    this.participantCount,
    this.percentile,
    this.historicalBenchmarkPercentile,
    required this.completedAt,
  });

  TestArenaResult copyWith({
    int? eventRank,
    int? participantCount,
    double? percentile,
    double? historicalBenchmarkPercentile,
  }) {
    return TestArenaResult(
      eventId: eventId,
      uid: uid,
      rawScore: rawScore,
      domainScores: domainScores,
      isLiveAttempt: isLiveAttempt,
      eventRank: eventRank ?? this.eventRank,
      participantCount: participantCount ?? this.participantCount,
      percentile: percentile ?? this.percentile,
      historicalBenchmarkPercentile: historicalBenchmarkPercentile ?? this.historicalBenchmarkPercentile,
      completedAt: completedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'eventId': eventId,
      'uid': uid,
      'rawScore': rawScore,
      'domainScores': domainScores,
      'isLiveAttempt': isLiveAttempt,
      'eventRank': eventRank,
      'participantCount': participantCount,
      'percentile': percentile,
      'historicalBenchmarkPercentile': historicalBenchmarkPercentile,
      'completedAt': completedAt.millisecondsSinceEpoch,
    };
  }

  factory TestArenaResult.fromMap(Map<String, dynamic> map) {
    return TestArenaResult(
      eventId: map['eventId'] ?? '',
      uid: map['uid'] ?? '',
      rawScore: map['rawScore'] ?? 0,
      domainScores: Map<String, int>.from(map['domainScores'] ?? {}),
      isLiveAttempt: map['isLiveAttempt'] ?? false,
      eventRank: map['eventRank'],
      participantCount: map['participantCount'],
      percentile: (map['percentile'] as num?)?.toDouble(),
      historicalBenchmarkPercentile: (map['historicalBenchmarkPercentile'] as num?)?.toDouble(),
      completedAt: DateTime.fromMillisecondsSinceEpoch(map['completedAt'] ?? 0),
    );
  }

  @override
  List<Object?> get props => [
        eventId,
        uid,
        rawScore,
        domainScores,
        isLiveAttempt,
        eventRank,
        participantCount,
        percentile,
        historicalBenchmarkPercentile,
        completedAt,
      ];
}
