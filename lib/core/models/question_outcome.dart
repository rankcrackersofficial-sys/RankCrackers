import 'package:equatable/equatable.dart';

/// QUESTION OUTCOME (Blueprint v1.0 - Sprint N)
/// Represents the result of a single question attempt within a Battle Session.
class QuestionOutcome extends Equatable {
  final String questionId;
  final String atomicTopicId;
  final bool isCorrect;
  final int difficulty; // 1-5
  final double responseTimeSeconds;
  final bool isPYQ;

  const QuestionOutcome({
    required this.questionId,
    required this.atomicTopicId,
    required this.isCorrect,
    required this.difficulty,
    required this.responseTimeSeconds,
    this.isPYQ = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'questionId': questionId,
      'atomicTopicId': atomicTopicId,
      'isCorrect': isCorrect,
      'difficulty': difficulty,
      'responseTimeSeconds': responseTimeSeconds,
      'isPYQ': isPYQ,
    };
  }

  factory QuestionOutcome.fromMap(Map<String, dynamic> map) {
    return QuestionOutcome(
      questionId: map['questionId'] ?? '',
      atomicTopicId: map['atomicTopicId'] ?? '',
      isCorrect: map['isCorrect'] ?? false,
      difficulty: map['difficulty'] ?? 3,
      responseTimeSeconds: (map['responseTimeSeconds'] ?? 0.0).toDouble(),
      isPYQ: map['isPYQ'] ?? false,
    );
  }

  @override
  List<Object?> get props => [questionId, atomicTopicId, isCorrect, responseTimeSeconds];
}
