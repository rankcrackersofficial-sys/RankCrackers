import 'package:equatable/equatable.dart';

/// TEST ARENA SUBJECT SCORE
/// Granular breakdown per subject/domain.
class TestArenaSubjectScore extends Equatable {
  final String subject;
  final int score;
  final int maxScore;
  final int attempted;
  final int correct;
  final int incorrect;
  final int unattempted;
  final double accuracy;

  const TestArenaSubjectScore({
    required this.subject,
    required this.score,
    required this.maxScore,
    required this.attempted,
    required this.correct,
    required this.incorrect,
    required this.unattempted,
    required this.accuracy,
  });

  Map<String, dynamic> toMap() {
    return {
      'subject': subject,
      'score': score,
      'maxScore': maxScore,
      'attempted': attempted,
      'correct': correct,
      'incorrect': incorrect,
      'unattempted': unattempted,
      'accuracy': accuracy,
    };
  }

  factory TestArenaSubjectScore.fromMap(Map<String, dynamic> map) {
    return TestArenaSubjectScore(
      subject: map['subject'] ?? '',
      score: map['score'] ?? 0,
      maxScore: map['maxScore'] ?? 0,
      attempted: map['attempted'] ?? 0,
      correct: map['correct'] ?? 0,
      incorrect: map['incorrect'] ?? 0,
      unattempted: map['unattempted'] ?? 0,
      accuracy: (map['accuracy'] as num?)?.toDouble() ?? 0.0,
    );
  }

  @override
  List<Object?> get props => [
        subject,
        score,
        maxScore,
        attempted,
        correct,
        incorrect,
        unattempted,
        accuracy,
      ];
}

/// TEST ARENA REMEDIATION TARGET
/// Canonical academic remediation payload for an incorrect response.
class TestArenaRemediationTarget extends Equatable {
  final String questionId;
  final int questionNumber;
  final String subject;
  final String? canonicalNodeId;
  final String? generationUnitId;
  final List<String> atomicFactIds;
  final bool isContentAvailable;

  const TestArenaRemediationTarget({
    required this.questionId,
    required this.questionNumber,
    required this.subject,
    this.canonicalNodeId,
    this.generationUnitId,
    this.atomicFactIds = const [],
    this.isContentAvailable = false,
  });

  @override
  List<Object?> get props => [
        questionId,
        questionNumber,
        subject,
        canonicalNodeId,
        generationUnitId,
        atomicFactIds,
        isContentAvailable,
      ];
}

/// TEST ARENA RESULT
/// Immutable, reproducible outcome for a completed assessment attempt.
class TestArenaResult extends Equatable {
  final String attemptId;
  final String eventId;
  final String paperId;
  final String uid;
  final String paperVersionHash;
  final String scoringPolicyVersion;
  final int totalScore;
  final int maxScore;
  final int totalAttempted;
  final int totalCorrect;
  final int totalIncorrect;
  final int totalUnattempted;
  final double accuracy;
  final Map<String, TestArenaSubjectScore> subjectScores;
  final Map<String, int> domainScores; // Backward compatibility alias
  final List<TestArenaRemediationTarget> remediationTargets;
  final bool isLiveAttempt;
  final bool isResultReleased;
  final DateTime completedAt;
  final int? eventRank; // Gated: only visible if cohort ranking complete
  final int? participantCount;
  final double? percentile; // Gated: only visible if cohort ranking complete
  final double? historicalBenchmarkPercentile;

  const TestArenaResult({
    this.attemptId = '',
    required this.eventId,
    this.paperId = '',
    required this.uid,
    this.paperVersionHash = '',
    this.scoringPolicyVersion = '',
    int? totalScore,
    int? rawScore,
    this.maxScore = 0,
    this.totalAttempted = 0,
    this.totalCorrect = 0,
    this.totalIncorrect = 0,
    this.totalUnattempted = 0,
    this.accuracy = 0.0,
    this.subjectScores = const {},
    Map<String, int>? domainScores,
    this.remediationTargets = const [],
    required this.isLiveAttempt,
    this.isResultReleased = false,
    required this.completedAt,
    this.eventRank,
    this.participantCount,
    this.percentile,
    this.historicalBenchmarkPercentile,
  })  : totalScore = totalScore ?? rawScore ?? 0,
        domainScores = domainScores ?? const {};

  int get rawScore => totalScore;

  TestArenaResult copyWith({
    bool? isResultReleased,
    int? eventRank,
    int? participantCount,
    double? percentile,
    double? historicalBenchmarkPercentile,
  }) {
    return TestArenaResult(
      attemptId: attemptId,
      eventId: eventId,
      paperId: paperId,
      uid: uid,
      paperVersionHash: paperVersionHash,
      scoringPolicyVersion: scoringPolicyVersion,
      totalScore: totalScore,
      maxScore: maxScore,
      totalAttempted: totalAttempted,
      totalCorrect: totalCorrect,
      totalIncorrect: totalIncorrect,
      totalUnattempted: totalUnattempted,
      accuracy: accuracy,
      subjectScores: subjectScores,
      domainScores: domainScores,
      remediationTargets: remediationTargets,
      isLiveAttempt: isLiveAttempt,
      isResultReleased: isResultReleased ?? this.isResultReleased,
      completedAt: completedAt,
      eventRank: eventRank ?? this.eventRank,
      participantCount: participantCount ?? this.participantCount,
      percentile: percentile ?? this.percentile,
      historicalBenchmarkPercentile: historicalBenchmarkPercentile ?? this.historicalBenchmarkPercentile,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'attemptId': attemptId,
      'eventId': eventId,
      'paperId': paperId,
      'uid': uid,
      'paperVersionHash': paperVersionHash,
      'scoringPolicyVersion': scoringPolicyVersion,
      'totalScore': totalScore,
      'rawScore': totalScore,
      'maxScore': maxScore,
      'totalAttempted': totalAttempted,
      'totalCorrect': totalCorrect,
      'totalIncorrect': totalIncorrect,
      'totalUnattempted': totalUnattempted,
      'accuracy': accuracy,
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
      attemptId: map['attemptId'] ?? '',
      eventId: map['eventId'] ?? '',
      paperId: map['paperId'] ?? '',
      uid: map['uid'] ?? '',
      paperVersionHash: map['paperVersionHash'] ?? '',
      scoringPolicyVersion: map['scoringPolicyVersion'] ?? '',
      totalScore: map['totalScore'] ?? map['rawScore'] ?? 0,
      maxScore: map['maxScore'] ?? 0,
      totalAttempted: map['totalAttempted'] ?? 0,
      totalCorrect: map['totalCorrect'] ?? 0,
      totalIncorrect: map['totalIncorrect'] ?? 0,
      totalUnattempted: map['totalUnattempted'] ?? 0,
      accuracy: (map['accuracy'] as num?)?.toDouble() ?? 0.0,
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
        attemptId,
        eventId,
        paperId,
        uid,
        paperVersionHash,
        scoringPolicyVersion,
        totalScore,
        maxScore,
        totalAttempted,
        totalCorrect,
        totalIncorrect,
        totalUnattempted,
        accuracy,
        subjectScores,
        domainScores,
        remediationTargets,
        isLiveAttempt,
        isResultReleased,
        completedAt,
        eventRank,
        participantCount,
        percentile,
        historicalBenchmarkPercentile,
      ];
}
