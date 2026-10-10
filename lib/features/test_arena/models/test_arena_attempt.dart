import 'package:equatable/equatable.dart';

/// TEST ARENA ATTEMPT STATUS
enum TestArenaAttemptStatus {
  notStarted,
  active,
  submitted,
  autoSubmitted,
  expired,
  invalidated,
  resultPending,
  resultReady,
}

/// TEST ARENA QUESTION RESPONSE
/// Per-question response tracking within an active attempt.
class TestArenaQuestionResponse extends Equatable {
  final String questionId;
  final int questionNumber;
  final String subject;
  final String questionType; // 'mcq_single', 'numerical'
  final int? selectedOptionIndex;
  final String? numericalAnswer;
  final bool isMarkedForReview;
  final int timeSpentSeconds;
  final DateTime lastSavedAt;

  const TestArenaQuestionResponse({
    required this.questionId,
    required this.questionNumber,
    required this.subject,
    required this.questionType,
    this.selectedOptionIndex,
    this.numericalAnswer,
    this.isMarkedForReview = false,
    this.timeSpentSeconds = 0,
    required this.lastSavedAt,
  });

  bool get isAnswered =>
      selectedOptionIndex != null ||
      (numericalAnswer != null && numericalAnswer!.trim().isNotEmpty);

  TestArenaQuestionResponse copyWith({
    int? selectedOptionIndex,
    bool clearSelectedOption = false,
    String? numericalAnswer,
    bool clearNumericalAnswer = false,
    bool? isMarkedForReview,
    int? timeSpentSeconds,
    DateTime? lastSavedAt,
  }) {
    return TestArenaQuestionResponse(
      questionId: questionId,
      questionNumber: questionNumber,
      subject: subject,
      questionType: questionType,
      selectedOptionIndex: clearSelectedOption ? null : (selectedOptionIndex ?? this.selectedOptionIndex),
      numericalAnswer: clearNumericalAnswer ? null : (numericalAnswer ?? this.numericalAnswer),
      isMarkedForReview: isMarkedForReview ?? this.isMarkedForReview,
      timeSpentSeconds: timeSpentSeconds ?? this.timeSpentSeconds,
      lastSavedAt: lastSavedAt ?? this.lastSavedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'questionId': questionId,
      'questionNumber': questionNumber,
      'subject': subject,
      'questionType': questionType,
      'selectedOptionIndex': selectedOptionIndex,
      'numericalAnswer': numericalAnswer,
      'isMarkedForReview': isMarkedForReview,
      'timeSpentSeconds': timeSpentSeconds,
      'lastSavedAt': lastSavedAt.millisecondsSinceEpoch,
    };
  }

  factory TestArenaQuestionResponse.fromMap(Map<String, dynamic> map) {
    return TestArenaQuestionResponse(
      questionId: map['questionId'] ?? '',
      questionNumber: map['questionNumber'] ?? 1,
      subject: map['subject'] ?? '',
      questionType: map['questionType'] ?? 'mcq_single',
      selectedOptionIndex: map['selectedOptionIndex'],
      numericalAnswer: map['numericalAnswer'],
      isMarkedForReview: map['isMarkedForReview'] ?? false,
      timeSpentSeconds: map['timeSpentSeconds'] ?? 0,
      lastSavedAt: DateTime.fromMillisecondsSinceEpoch(map['lastSavedAt'] ?? 0),
    );
  }

  @override
  List<Object?> get props => [
        questionId,
        questionNumber,
        subject,
        questionType,
        selectedOptionIndex,
        numericalAnswer,
        isMarkedForReview,
        timeSpentSeconds,
        lastSavedAt,
      ];
}

/// TEST ARENA SUBMISSION SUMMARY
class TestArenaSubmissionSummary extends Equatable {
  final int totalQuestions;
  final int answeredCount;
  final int unansweredCount;
  final int markedForReviewCount;
  final int answeredAndMarkedCount;

  const TestArenaSubmissionSummary({
    required this.totalQuestions,
    required this.answeredCount,
    required this.unansweredCount,
    required this.markedForReviewCount,
    required this.answeredAndMarkedCount,
  });

  @override
  List<Object?> get props => [
        totalQuestions,
        answeredCount,
        unansweredCount,
        markedForReviewCount,
        answeredAndMarkedCount,
      ];
}

/// TEST ARENA ATTEMPT
/// Governed candidate paper attempt state.
class TestArenaAttempt extends Equatable {
  final String attemptId;
  final String eventId;
  final String paperId;
  final String paperVersionHash;
  final String scoringPolicyVersion;
  final String uid;
  final TestArenaAttemptStatus status;
  final DateTime startedAt;
  final DateTime targetEndAt;
  final DateTime? submittedAt;
  final Map<String, TestArenaQuestionResponse> responses;
  final bool isSubmissionLocked;

  const TestArenaAttempt({
    required this.attemptId,
    required this.eventId,
    required this.paperId,
    required this.paperVersionHash,
    required this.scoringPolicyVersion,
    required this.uid,
    required this.status,
    required this.startedAt,
    required this.targetEndAt,
    this.submittedAt,
    required this.responses,
    this.isSubmissionLocked = false,
  });

  bool get isActive =>
      status == TestArenaAttemptStatus.active &&
      !isSubmissionLocked &&
      DateTime.now().isBefore(targetEndAt);

  bool get isCompleted =>
      status == TestArenaAttemptStatus.submitted ||
      status == TestArenaAttemptStatus.autoSubmitted ||
      status == TestArenaAttemptStatus.expired ||
      status == TestArenaAttemptStatus.resultReady;

  Duration get remainingDuration {
    final now = DateTime.now();
    if (now.isAfter(targetEndAt)) return Duration.zero;
    return targetEndAt.difference(now);
  }

  TestArenaSubmissionSummary get summary {
    int answered = 0;
    int marked = 0;
    int ansAndMarked = 0;

    for (final resp in responses.values) {
      if (resp.isAnswered) answered++;
      if (resp.isMarkedForReview) marked++;
      if (resp.isAnswered && resp.isMarkedForReview) ansAndMarked++;
    }

    final unanswered = responses.length - answered;

    return TestArenaSubmissionSummary(
      totalQuestions: responses.length,
      answeredCount: answered,
      unansweredCount: unanswered,
      markedForReviewCount: marked,
      answeredAndMarkedCount: ansAndMarked,
    );
  }

  TestArenaAttempt copyWith({
    TestArenaAttemptStatus? status,
    DateTime? submittedAt,
    Map<String, TestArenaQuestionResponse>? responses,
    bool? isSubmissionLocked,
  }) {
    return TestArenaAttempt(
      attemptId: attemptId,
      eventId: eventId,
      paperId: paperId,
      paperVersionHash: paperVersionHash,
      scoringPolicyVersion: scoringPolicyVersion,
      uid: uid,
      status: status ?? this.status,
      startedAt: startedAt,
      targetEndAt: targetEndAt,
      submittedAt: submittedAt ?? this.submittedAt,
      responses: responses ?? this.responses,
      isSubmissionLocked: isSubmissionLocked ?? this.isSubmissionLocked,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'attemptId': attemptId,
      'eventId': eventId,
      'paperId': paperId,
      'paperVersionHash': paperVersionHash,
      'scoringPolicyVersion': scoringPolicyVersion,
      'uid': uid,
      'status': status.name,
      'startedAt': startedAt.millisecondsSinceEpoch,
      'targetEndAt': targetEndAt.millisecondsSinceEpoch,
      'submittedAt': submittedAt?.millisecondsSinceEpoch,
      'responses': responses.map((k, v) => MapEntry(k, v.toMap())),
      'isSubmissionLocked': isSubmissionLocked,
    };
  }

  factory TestArenaAttempt.fromMap(Map<String, dynamic> map) {
    return TestArenaAttempt(
      attemptId: map['attemptId'] ?? '',
      eventId: map['eventId'] ?? '',
      paperId: map['paperId'] ?? '',
      paperVersionHash: map['paperVersionHash'] ?? '',
      scoringPolicyVersion: map['scoringPolicyVersion'] ?? '',
      uid: map['uid'] ?? '',
      status: TestArenaAttemptStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => TestArenaAttemptStatus.notStarted,
      ),
      startedAt: DateTime.fromMillisecondsSinceEpoch(map['startedAt'] ?? 0),
      targetEndAt: DateTime.fromMillisecondsSinceEpoch(map['targetEndAt'] ?? 0),
      submittedAt: map['submittedAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['submittedAt'])
          : null,
      responses: (map['responses'] as Map<String, dynamic>?)?.map(
            (k, v) => MapEntry(k, TestArenaQuestionResponse.fromMap(v)),
          ) ??
          {},
      isSubmissionLocked: map['isSubmissionLocked'] ?? false,
    );
  }

  @override
  List<Object?> get props => [
        attemptId,
        eventId,
        paperId,
        paperVersionHash,
        scoringPolicyVersion,
        uid,
        status,
        startedAt,
        targetEndAt,
        submittedAt,
        responses,
        isSubmissionLocked,
      ];
}
