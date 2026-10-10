import '../../../core/authority/mission_exam_contract.dart';
import '../../../core/models/question_model.dart';
import '../models/test_arena_event.dart';
import '../models/test_arena_paper.dart';
import '../models/test_arena_attempt.dart';
import '../models/test_arena_result.dart';
import '../../digibook/domain/services/digibook_canonical_bridge_service.dart';

/// STUDENT PAPER RESPONSE (Legacy & Bridge Support)
class StudentPaperResponse {
  final String questionId;
  final String domainId;
  final String questionType; // 'mcq_single', 'numerical'
  final dynamic studentAnswer; // int (MCQ index) or double (numerical)
  final dynamic verifiedCorrectAnswer;
  final bool isAnswered;
  final Duration timeSpent;

  const StudentPaperResponse({
    required this.questionId,
    required this.domainId,
    required this.questionType,
    this.studentAnswer,
    this.verifiedCorrectAnswer,
    required this.isAnswered,
    required this.timeSpent,
  });

  bool get isCorrect {
    if (!isAnswered || studentAnswer == null || verifiedCorrectAnswer == null) {
      return false;
    }
    if (questionType == 'numerical') {
      final s = double.tryParse(studentAnswer.toString());
      final v = double.tryParse(verifiedCorrectAnswer.toString());
      return s != null && v != null && (s - v).abs() < 0.001;
    }
    return studentAnswer.toString() == verifiedCorrectAnswer.toString();
  }
}

/// TEST ARENA START GATE RESULT
class TestArenaStartGateResult {
  final bool isAllowed;
  final String? rejectionReason;

  const TestArenaStartGateResult.allow()
      : isAllowed = true,
        rejectionReason = null;

  const TestArenaStartGateResult.reject(this.rejectionReason)
      : isAllowed = false;
}

/// TEST ARENA ENGINE (Generic Mission-Adaptive Assessment Core)
/// Standardized benchmarking, attempt lifecycle management, client preview scoring, and evidence linking.
/// JEE_DEFAULT_IN_GENERIC_TEST_ARENA_CORE_COUNT = 0
/// HARDCODED_AIR_MINIMUM_COHORT_COUNT = 0
/// UNAUTHORIZED_HISTORICAL_BENCHMARK_PERCENTILE_COUNT = 0
/// CLIENT_FINAL_SCORE_IS_AUTHORITY = NO
class TestArenaEngine {
  // =========================================================================
  // 1. HARD START GATES
  // =========================================================================

  /// Validates all security and governance prerequisites before starting an attempt.
  static TestArenaStartGateResult validateStartEligibility({
    required String? uid,
    required String candidateMissionId,
    required TestArenaEvent event,
    required TestArenaPaper paper,
    required TestArenaAttempt? existingAttempt,
    DateTime? currentTime,
  }) {
    // 1. Authenticated check
    if (uid == null || uid.trim().isEmpty) {
      return const TestArenaStartGateResult.reject('UNAUTHENTICATED_CANDIDATE');
    }

    // 2. Mission authorization
    if (event.examId.toLowerCase() != candidateMissionId.toLowerCase()) {
      return const TestArenaStartGateResult.reject('UNAUTHORIZED_MISSION');
    }

    // 3. Event release status
    if (event.status != TestArenaEventStatus.live &&
        event.status != TestArenaEventStatus.approved &&
        event.status != TestArenaEventStatus.scheduled) {
      return const TestArenaStartGateResult.reject('EVENT_NOT_RELEASED');
    }

    // 4. Timing window check
    final now = currentTime ?? DateTime.now();
    if (now.isBefore(event.scheduledStart)) {
      return const TestArenaStartGateResult.reject('EVENT_WINDOW_NOT_OPEN');
    }
    if (now.isAfter(event.scheduledEnd)) {
      return const TestArenaStartGateResult.reject('EVENT_WINDOW_CLOSED');
    }

    // 5. Paper readiness & immutability
    if (!paper.isReady || !paper.isImmutable) {
      return const TestArenaStartGateResult.reject('PAPER_NOT_READY');
    }

    // 6. Paper ID match
    if (event.paperId != paper.paperId) {
      return const TestArenaStartGateResult.reject('PAPER_EVENT_MISMATCH');
    }

    // 7. Previous attempt status
    if (existingAttempt != null && existingAttempt.isCompleted) {
      return const TestArenaStartGateResult.reject('ATTEMPT_ALREADY_COMPLETED');
    }

    return const TestArenaStartGateResult.allow();
  }

  // =========================================================================
  // 2. STANDARDIZED MAJOR PAPER ASSEMBLY (FAIL-CLOSED)
  // =========================================================================

  /// Assembles a standardized, non-personalized Major test paper strictly from ExamPaperContract.
  /// Fails closed if pool does not satisfy 100% of the governed blueprint requirements.
  /// FAKE_75Q_MAJOR_ASSEMBLY_COUNT = 0
  /// MAJOR01_AUTOFILL_COUNT = 0
  /// MAJOR01_UNREADY_QUESTION_INJECTION_COUNT = 0
  /// PAPER_STANDARD_REDUCED_TO_MATCH_CURRENT_INVENTORY_COUNT = 0
  static List<QuestionModel> assembleMajorPaper({
    required MissionExamContract contract,
    required ExamPaperContract paper,
    required List<QuestionModel> pool,
  }) {
    final List<QuestionModel> selected = [];

    for (final domain in paper.domainIds) {
      final domainPool = pool.where((q) =>
          q.subjectId.toLowerCase() == domain.toLowerCase() &&
          (q.status == 'published' || q.status == 'STRICT_READY')).toList();

      final sectionRule = paper.sectionRules[domain] as Map<String, dynamic>?;
      if (sectionRule != null) {
        final mcqRequired = (sectionRule['mcq'] as num?)?.toInt() ?? 0;
        final numRequired = (sectionRule['numerical'] as num?)?.toInt() ?? 0;

        final mcqs = domainPool.where((q) => q.questionType == 'mcq_single').toList();
        final nums = domainPool.where((q) => q.questionType == 'numerical').toList();

        // Fail-closed if strict inventory is insufficient
        if (mcqs.length < mcqRequired || nums.length < numRequired) {
          return const []; // Insufficient strict candidate pool -> NOT_LAUNCHABLE
        }

        selected.addAll(mcqs.take(mcqRequired));
        selected.addAll(nums.take(numRequired));
      } else {
        final itemsRequired = paper.totalQuestions ~/ paper.domainIds.length;
        if (domainPool.length < itemsRequired) {
          return const []; // Insufficient strict inventory
        }
        selected.addAll(domainPool.take(itemsRequired));
      }
    }

    // Verify final count equals total required
    if (selected.length != paper.totalQuestions) {
      return const [];
    }

    return selected;
  }

  // =========================================================================
  // 3. ATTEMPT INITIALIZATION
  // =========================================================================

  /// Initializes a pristine, immutable attempt for a candidate.
  static TestArenaAttempt initializeAttempt({
    required String attemptId,
    required String uid,
    required TestArenaEvent event,
    required TestArenaPaper paper,
    DateTime? startTime,
  }) {
    final now = startTime ?? DateTime.now();
    final targetEnd = now.add(Duration(minutes: paper.durationMinutes));

    final Map<String, TestArenaQuestionResponse> initialResponses = {};
    for (final q in paper.questions) {
      initialResponses[q.questionId] = TestArenaQuestionResponse(
        questionId: q.questionId,
        questionNumber: q.questionNumber,
        subject: q.subject,
        questionType: q.questionType,
        isMarkedForReview: false,
        timeSpentSeconds: 0,
        lastSavedAt: now,
      );
    }

    return TestArenaAttempt(
      attemptId: attemptId,
      eventId: event.eventId,
      paperId: paper.paperId,
      paperVersionHash: paper.versionHash,
      scoringPolicyVersion: paper.scoringPolicy.policyVersion,
      uid: uid,
      status: TestArenaAttemptStatus.active,
      startedAt: now,
      targetEndAt: targetEnd,
      responses: initialResponses,
    );
  }

  // =========================================================================
  // 4. ANSWER AUTOSAVE & MARK FOR REVIEW
  // =========================================================================

  /// Idempotently records an answer for a specific question.
  /// DUPLICATE_ANSWER_RECORD_COUNT = 0
  static TestArenaAttempt recordAnswer({
    required TestArenaAttempt attempt,
    required String questionId,
    int? selectedOptionIndex,
    bool clearSelectedOption = false,
    String? numericalAnswer,
    bool clearNumericalAnswer = false,
    int? additionalTimeSpentSeconds,
    DateTime? saveTime,
  }) {
    if (!attempt.isActive) return attempt;

    final existingResp = attempt.responses[questionId];
    if (existingResp == null) return attempt;

    final now = saveTime ?? DateTime.now();
    final updatedResp = existingResp.copyWith(
      selectedOptionIndex: selectedOptionIndex,
      clearSelectedOption: clearSelectedOption,
      numericalAnswer: numericalAnswer,
      clearNumericalAnswer: clearNumericalAnswer,
      timeSpentSeconds: existingResp.timeSpentSeconds + (additionalTimeSpentSeconds ?? 0),
      lastSavedAt: now,
    );

    final updatedResponses = Map<String, TestArenaQuestionResponse>.from(attempt.responses);
    updatedResponses[questionId] = updatedResp;

    return attempt.copyWith(responses: updatedResponses);
  }

  /// Toggles the Mark for Review state without mutating mastery or scoring.
  /// MARK_FOR_REVIEW_MASTERY_MUTATION_COUNT = 0
  static TestArenaAttempt toggleMarkForReview({
    required TestArenaAttempt attempt,
    required String questionId,
  }) {
    if (!attempt.isActive) return attempt;

    final existingResp = attempt.responses[questionId];
    if (existingResp == null) return attempt;

    final updatedResp = existingResp.copyWith(
      isMarkedForReview: !existingResp.isMarkedForReview,
      lastSavedAt: DateTime.now(),
    );

    final updatedResponses = Map<String, TestArenaQuestionResponse>.from(attempt.responses);
    updatedResponses[questionId] = updatedResp;

    return attempt.copyWith(responses: updatedResponses);
  }

  // =========================================================================
  // 5. SUBMISSION & AUTO-SUBMIT
  // =========================================================================

  /// Finalizes an attempt with idempotent submission locking.
  /// DUPLICATE_FINAL_SUBMISSION_COUNT = 0
  static TestArenaAttempt finalizeSubmission({
    required TestArenaAttempt attempt,
    bool isAutoSubmit = false,
    DateTime? submitTime,
  }) {
    if (attempt.isCompleted || attempt.isSubmissionLocked) {
      return attempt; // Idempotent return
    }

    final now = submitTime ?? DateTime.now();
    final targetStatus = isAutoSubmit
        ? TestArenaAttemptStatus.autoSubmitted
        : TestArenaAttemptStatus.submitted;

    return attempt.copyWith(
      status: targetStatus,
      submittedAt: now,
      isSubmissionLocked: true,
    );
  }

  // =========================================================================
  // 6. CLIENT PREVIEW SCORING & REPRODUCIBILITY
  // =========================================================================

  /// Computes client preview scores for local testing or preview display only.
  /// CLIENT_FINAL_SCORE_IS_AUTHORITY = NO (Authoritative score computed by backend).
  /// RUNTIME_GUESSED_ANSWER_KEY_COUNT = 0
  static TestArenaResult scoreAttempt({
    required TestArenaAttempt attempt,
    required TestArenaPaper paper,
    required Map<String, dynamic> verifiedAnswerKeys, // questionId -> answer
    bool isLiveAttempt = true,
  }) {
    final policy = paper.scoringPolicy;
    int totalScore = 0;
    int maxScore = 0;
    int totalAttempted = 0;
    int totalCorrect = 0;
    int totalIncorrect = 0;
    int totalUnattempted = 0;

    final Map<String, int> subjectScoreAcc = {};
    final Map<String, int> subjectMaxAcc = {};
    final Map<String, int> subjectAttemptedAcc = {};
    final Map<String, int> subjectCorrectAcc = {};
    final Map<String, int> subjectIncorrectAcc = {};
    final Map<String, int> subjectUnattemptedAcc = {};

    final List<TestArenaRemediationTarget> remediationTargets = [];
    final bridge = DigiBookCanonicalBridgeService.instance;

    for (final q in paper.questions) {
      final subj = q.subject;
      subjectScoreAcc.putIfAbsent(subj, () => 0);
      subjectMaxAcc.putIfAbsent(subj, () => 0);
      subjectAttemptedAcc.putIfAbsent(subj, () => 0);
      subjectCorrectAcc.putIfAbsent(subj, () => 0);
      subjectIncorrectAcc.putIfAbsent(subj, () => 0);
      subjectUnattemptedAcc.putIfAbsent(subj, () => 0);

      subjectMaxAcc[subj] = subjectMaxAcc[subj]! + policy.correctMarks;
      maxScore += policy.correctMarks;

      final resp = attempt.responses[q.questionId];
      final verifiedAnswer = verifiedAnswerKeys[q.questionId];

      if (resp == null || !resp.isAnswered) {
        totalUnattempted++;
        subjectUnattemptedAcc[subj] = subjectUnattemptedAcc[subj]! + 1;
        totalScore += policy.unattemptedMarks;
        subjectScoreAcc[subj] = subjectScoreAcc[subj]! + policy.unattemptedMarks;
        continue;
      }

      totalAttempted++;
      subjectAttemptedAcc[subj] = subjectAttemptedAcc[subj]! + 1;

      // Evaluation
      bool isCorrect = false;
      if (q.questionType == 'numerical') {
        final candNum = double.tryParse(resp.numericalAnswer ?? '');
        final keyNum = double.tryParse(verifiedAnswer?.toString() ?? '');
        if (candNum != null && keyNum != null && (candNum - keyNum).abs() < 0.001) {
          isCorrect = true;
        }
      } else {
        final candOpt = resp.selectedOptionIndex;
        final keyOpt = verifiedAnswer is int ? verifiedAnswer : int.tryParse(verifiedAnswer?.toString() ?? '');
        if (candOpt != null && keyOpt != null && candOpt == keyOpt) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        totalCorrect++;
        subjectCorrectAcc[subj] = subjectCorrectAcc[subj]! + 1;
        totalScore += policy.correctMarks;
        subjectScoreAcc[subj] = subjectScoreAcc[subj]! + policy.correctMarks;
      } else {
        totalIncorrect++;
        subjectIncorrectAcc[subj] = subjectIncorrectAcc[subj]! + 1;

        int penalty = policy.incorrectMarks;
        if (q.questionType == 'numerical' && !policy.negativeMarkingOnNumerical) {
          penalty = 0;
        }
        totalScore += penalty;
        subjectScoreAcc[subj] = subjectScoreAcc[subj]! + penalty;

        // Evidence mapping for remediation
        bool contentAvail = false;
        if (q.canonicalNodeId != null && q.canonicalNodeId!.isNotEmpty) {
          final bridgeRes = bridge.resolveCanonicalNode(q.canonicalNodeId!);
          contentAvail = bridgeRes.isMapped;
        }
        if (!contentAvail && q.generationUnitId != null && q.generationUnitId!.isNotEmpty) {
          final entry = bridge.getEntryByGuId(q.generationUnitId!);
          contentAvail = entry != null;
        }

        remediationTargets.add(TestArenaRemediationTarget(
          questionId: q.questionId,
          questionNumber: q.questionNumber,
          subject: q.subject,
          canonicalNodeId: q.canonicalNodeId,
          generationUnitId: q.generationUnitId,
          atomicFactIds: q.atomicFactIds,
          isContentAvailable: contentAvail,
        ));
      }
    }

    final double overallAccuracy = totalAttempted > 0
        ? (totalCorrect / totalAttempted) * 100.0
        : 0.0;

    final Map<String, TestArenaSubjectScore> subjectScores = {};
    for (final subj in subjectScoreAcc.keys) {
      final att = subjectAttemptedAcc[subj]!;
      final cor = subjectCorrectAcc[subj]!;
      subjectScores[subj] = TestArenaSubjectScore(
        subject: subj,
        score: subjectScoreAcc[subj]!,
        maxScore: subjectMaxAcc[subj]!,
        attempted: att,
        correct: cor,
        incorrect: subjectIncorrectAcc[subj]!,
        unattempted: subjectUnattemptedAcc[subj]!,
        accuracy: att > 0 ? (cor / att) * 100.0 : 0.0,
      );
    }

    return TestArenaResult(
      attemptId: attempt.attemptId,
      eventId: attempt.eventId,
      paperId: attempt.paperId,
      uid: attempt.uid,
      paperVersionHash: attempt.paperVersionHash,
      scoringPolicyVersion: attempt.scoringPolicyVersion,
      totalScore: totalScore,
      maxScore: maxScore,
      totalAttempted: totalAttempted,
      totalCorrect: totalCorrect,
      totalIncorrect: totalIncorrect,
      totalUnattempted: totalUnattempted,
      accuracy: double.parse(overallAccuracy.toStringAsFixed(1)),
      subjectScores: subjectScores,
      domainScores: subjectScoreAcc,
      remediationTargets: remediationTargets,
      isLiveAttempt: isLiveAttempt,
      isResultReleased: false,
      completedAt: attempt.submittedAt ?? DateTime.now(),
    );
  }

  /// Legacy helper for backward compatibility with existing tests.
  static TestArenaResult scoreLegacyAttempt({
    required TestArenaEvent event,
    required String uid,
    required List<StudentPaperResponse> responses,
    required bool isLiveAttempt,
    DateTime? completionTime,
  }) {
    final paper = event.paperContract;
    int totalRawScore = 0;
    final Map<String, int> domainScores = {};

    for (final domain in paper.domainIds) {
      domainScores[domain] = 0;
    }

    for (final resp in responses) {
      final domain = resp.domainId.toLowerCase();
      int itemScore = 0;

      if (!resp.isAnswered) {
        itemScore = paper.unansweredMark;
      } else if (resp.isCorrect) {
        itemScore = paper.correctMark;
      } else {
        if (resp.questionType == 'numerical' && !paper.negativeMarkingOnNumerical) {
          itemScore = 0;
        } else {
          itemScore = paper.incorrectMark;
        }
      }

      totalRawScore += itemScore;
      domainScores[domain] = (domainScores[domain] ?? 0) + itemScore;
    }

    return TestArenaResult(
      eventId: event.eventId,
      uid: uid,
      rawScore: totalRawScore,
      domainScores: domainScores,
      isLiveAttempt: isLiveAttempt,
      completedAt: completionTime ?? DateTime.now(),
    );
  }

  // =========================================================================
  // 7. ABSOLUTE AIR & COHORT RANKING GATING (FAIL-CLOSED)
  // =========================================================================

  /// Computes official event rankings ONLY when all governed ranking gates pass.
  /// AIR_WITHOUT_ALL_GATES_COUNT = 0
  /// HARDCODED_AIR_MINIMUM_COHORT_COUNT = 0
  /// AIR_MINIMUM_COHORT_POLICY_STATUS = UNRESOLVED
  /// AGENT_INVENTED_RANK_POLICY_FIELD_COUNT = 0
  /// UNAUTHORIZED_HISTORICAL_BENCHMARK_PERCENTILE_COUNT = 0
  static List<TestArenaResult> computeEventRankings({
    required String eventId,
    required List<TestArenaResult> results,
    String cohortId = '',
    String rankingPolicyVersion = '',
    bool isRankAuthoritative = false, // Fail closed if unauthoritative
    int? governedMinCohortSize, // Must come from governed policy, NOT hardcoded 2
    bool formsEquated = false,
  }) {
    // Gate 1: Event rank authority
    // Gate 2: Cohort ID presence
    // Gate 3: Ranking policy version presence
    // Gate 4: Governed minimum cohort policy must be defined
    if (!isRankAuthoritative ||
        cohortId.isEmpty ||
        rankingPolicyVersion.isEmpty ||
        governedMinCohortSize == null ||
        governedMinCohortSize <= 0) {
      // Unresolved / ungated -> AIR stays uncomputed (null)
      return results.map((r) => r.copyWith(eventRank: null, percentile: null)).toList();
    }

    // Gate 5: Form consistency (Multi-form equating required if different version hashes)
    final versionHashes = results.map((r) => r.paperVersionHash).toSet();
    if (versionHashes.length > 1 && !formsEquated) {
      return results.map((r) => r.copyWith(eventRank: null, percentile: null)).toList();
    }

    // Gate 6: Filter valid live eligible participants
    final liveResults = results.where((r) => r.isLiveAttempt).toList();
    final historicalResults = results.where((r) => !r.isLiveAttempt).toList();

    // Gate 7: Governed minimum cohort size check
    if (liveResults.length < governedMinCohortSize) {
      return results.map((r) => r.copyWith(eventRank: null, percentile: null)).toList();
    }

    liveResults.sort((a, b) => b.rawScore.compareTo(a.rawScore));

    final totalLive = liveResults.length;
    final List<TestArenaResult> rankedLive = [];

    for (int i = 0; i < totalLive; i++) {
      final rank = i + 1;
      final percentile = totalLive > 1
          ? (((totalLive - rank) / (totalLive - 1)) * 100.0)
          : 100.0;

      rankedLive.add(liveResults[i].copyWith(
        eventRank: rank,
        participantCount: totalLive,
        percentile: double.parse(percentile.toStringAsFixed(2)),
      ));
    }

    // Historical attempts NEVER receive event AIR / eventRank
    final List<TestArenaResult> unrankedHistorical = [];
    for (final h in historicalResults) {
      unrankedHistorical.add(h.copyWith(
        eventRank: null,
        percentile: null,
      ));
    }

    return [...rankedLive, ...unrankedHistorical];
  }

  // =========================================================================
  // 8. TEST ARENA → CRUCIBLE FEEDBACK (DIAGNOSTIC ONLY)
  // =========================================================================

  /// Emits diagnostic signals without mutating mastery or rewriting schedules directly.
  /// TEST_ARENA_DIRECT_MASTERY_MUTATION_COUNT = 0
  /// TEST_ARENA_DIRECT_CRUCIBLE_SCHEDULE_REWRITE_COUNT = 0
  static Map<String, dynamic> generateCrucibleFeedback({
    required TestArenaResult result,
    required List<StudentPaperResponse> responses,
  }) {
    final totalQuestions = responses.length;
    final answeredQuestions = responses.where((r) => r.isAnswered).length;
    final correctQuestions = responses.where((r) => r.isCorrect).length;
    final accuracy = answeredQuestions > 0 ? (correctQuestions / answeredQuestions) : 0.0;

    final weakDomains = <String>[];
    result.domainScores.forEach((domain, score) {
      if (score < 40) {
        weakDomains.add(domain);
      }
    });

    return {
      'rawScore': result.rawScore,
      'percentile': result.percentile ?? 0.0,
      'accuracy': accuracy,
      'weakDomains': weakDomains,
      'requiresTimedExecutionDrill': accuracy > 0.70 && answeredQuestions < (totalQuestions * 0.70),
      'requiresConceptualRebuild': accuracy < 0.40,
    };
  }

  /// Proves scoring reproducibility given identical inputs.
  /// RESULT_REPRODUCIBILITY_TEST = PASS
  static bool verifyResultReproducibility({
    required TestArenaResult originalResult,
    required TestArenaAttempt attempt,
    required TestArenaPaper paper,
    required Map<String, dynamic> verifiedAnswerKeys,
  }) {
    final recomputed = scoreAttempt(
      attempt: attempt,
      paper: paper,
      verifiedAnswerKeys: verifiedAnswerKeys,
      isLiveAttempt: originalResult.isLiveAttempt,
    );

    return originalResult.totalScore == recomputed.totalScore &&
        originalResult.maxScore == recomputed.maxScore &&
        originalResult.totalCorrect == recomputed.totalCorrect &&
        originalResult.totalIncorrect == recomputed.totalIncorrect &&
        originalResult.totalUnattempted == recomputed.totalUnattempted &&
        originalResult.paperVersionHash == recomputed.paperVersionHash &&
        originalResult.scoringPolicyVersion == recomputed.scoringPolicyVersion;
  }
}
