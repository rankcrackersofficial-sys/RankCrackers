import 'package:equatable/equatable.dart';
import 'question_outcome.dart';

/// MISSION RESULT (Audit GAP M-3)
enum MissionResult {
  FAILED,
  PARTIAL,
  COMPLETED,
  PERFECT
}

/// BATTLE SESSION (Blueprint v1.1 - Sprint N Ready)
/// The execution instance of a Mission. Tracks real-time performance and completion.
class BattleSession extends Equatable {
  final String sessionId;
  final String userId;
  final String realmId;
  final String missionId;

  final DateTime startedAt;
  final DateTime? endedAt;

  final int questionsSolved;
  final int correctAnswers;
  
  // Audit Sprint M: Mission satisfaction metrics
  final double coverageGained; // percentage
  final int digibookPagesRead;

  // Audit Sprint N: Granular outcomes
  final List<QuestionOutcome> questionOutcomes;
  final MissionResult result;

  const BattleSession({
    required this.sessionId,
    required this.userId,
    required this.realmId,
    required this.missionId,
    required this.startedAt,
    this.endedAt,
    this.questionsSolved = 0,
    this.correctAnswers = 0,
    this.coverageGained = 0.0,
    this.digibookPagesRead = 0,
    this.questionOutcomes = const [],
    this.result = MissionResult.FAILED,
  });

  Map<String, dynamic> toMap() {
    return {
      'session_id': sessionId,
      'userId': userId,
      'realmId': realmId,
      'mission_id': missionId,
      'started_at': startedAt.toIso8601String(),
      'ended_at': endedAt?.toIso8601String(),
      'questions_solved': questionsSolved,
      'correct_answers': correctAnswers,
      'coverage_gained': coverageGained,
      'digibook_pages_read': digibookPagesRead,
      'question_outcomes': questionOutcomes.map((e) => e.toMap()).toList(),
      'result': result.name,
    };
  }

  factory BattleSession.fromMap(Map<String, dynamic> map) {
    return BattleSession(
      sessionId: map['session_id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      missionId: map['mission_id'] ?? '',
      startedAt: DateTime.parse(map['started_at'] ?? DateTime.now().toIso8601String()),
      endedAt: map['ended_at'] != null ? DateTime.parse(map['ended_at']) : null,
      questionsSolved: map['questions_solved'] ?? 0,
      correctAnswers: map['correct_answers'] ?? 0,
      coverageGained: (map['coverage_gained'] ?? 0.0).toDouble(),
      digibookPagesRead: map['digibook_pages_read'] ?? 0,
      questionOutcomes: (map['question_outcomes'] as List? ?? [])
          .map((e) => QuestionOutcome.fromMap(e))
          .toList(),
      result: MissionResult.values.byName(map['result'] ?? 'FAILED'),
    );
  }

  BattleSession copyWith({
    DateTime? endedAt,
    int? questionsSolved,
    int? correctAnswers,
    double? coverageGained,
    int? digibookPagesRead,
    List<QuestionOutcome>? questionOutcomes,
    MissionResult? result,
  }) {
    return BattleSession(
      sessionId: sessionId,
      userId: userId,
      realmId: realmId,
      missionId: missionId,
      startedAt: startedAt,
      endedAt: endedAt ?? this.endedAt,
      questionsSolved: questionsSolved ?? this.questionsSolved,
      correctAnswers: correctAnswers ?? this.correctAnswers,
      coverageGained: coverageGained ?? this.coverageGained,
      digibookPagesRead: digibookPagesRead ?? this.digibookPagesRead,
      questionOutcomes: questionOutcomes ?? this.questionOutcomes,
      result: result ?? this.result,
    );
  }

  @override
  List<Object?> get props => [sessionId, missionId, result, questionsSolved];
}
