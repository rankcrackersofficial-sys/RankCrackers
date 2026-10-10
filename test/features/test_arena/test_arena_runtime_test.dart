import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/core/authority/mission_exam_contract.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/features/test_arena/models/test_arena_event.dart';
import 'package:rank_crackers/features/test_arena/models/test_arena_paper.dart';
import 'package:rank_crackers/features/test_arena/models/test_arena_attempt.dart';
import 'package:rank_crackers/features/test_arena/models/test_arena_result.dart';
import 'package:rank_crackers/features/test_arena/core/test_arena_engine.dart';
import 'package:rank_crackers/features/test_arena/core/test_arena_fixture_harness.dart';
import 'package:rank_crackers/features/test_arena/presentation/screens/test_arena_screen.dart';
import 'package:rank_crackers/features/test_arena/presentation/screens/test_arena_active_test_screen.dart';
import 'package:rank_crackers/features/digibook/domain/services/digibook_canonical_bridge_service.dart';

void main() {
  group('Test Arena Strict41 Authority Hardening, Server Truth & Rank Gating Tests', () {
    setUp(() {
      DigiBookCanonicalBridgeService.instance.initializeFromMap({
        'version': '1.0.0',
        'lessons': [
          {
            'guId': 'GU_JEEMAIN2027_PHY_057CEE13',
            'subject': 'Physics',
            'canonicalNodeId': 'JEE_MAIN_2026_PHY_U02_T_057cee13',
            'topic': 'Position, Velocity & Speed',
            'lessonRevision': 'REV_01',
            'atomicFactIds': ['AF_01', 'AF_02'],
            'factSemantics': 'SOURCE_FACT_COMPLETE',
            'privateLessonAuthorityPath': '',
          },
          {
            'guId': 'GU_JEEMAIN2027_CHE_910B0B49',
            'subject': 'Chemistry',
            'canonicalNodeId': 'JEE_MAIN_2026_CHE_U01_T_00000001',
            'topic': 'Some Basic Concepts of Chemistry',
            'lessonRevision': 'REV_01',
            'atomicFactIds': ['AF_03', 'AF_04'],
            'factSemantics': 'SOURCE_FACT_COMPLETE',
            'privateLessonAuthorityPath': '',
          },
        ],
      });
    });

    // =========================================================================
    // 1. HARD START GATES & SECURITY
    // =========================================================================
    test('1. Start Gate: Rejects unauthenticated candidate', () {
      final event = TestArenaFixtureHarness.createStagingEvent();
      final paper = TestArenaFixtureHarness.createStagingPaper();

      final res = TestArenaEngine.validateStartEligibility(
        uid: null,
        candidateMissionId: 'jee_main_2027',
        event: event,
        paper: paper,
        existingAttempt: null,
      );

      expect(res.isAllowed, isFalse);
      expect(res.rejectionReason, equals('UNAUTHENTICATED_CANDIDATE'));
    });

    test('2. Start Gate: Rejects unauthorized mission mismatch', () {
      final event = TestArenaFixtureHarness.createStagingEvent();
      final paper = TestArenaFixtureHarness.createStagingPaper();

      final res = TestArenaEngine.validateStartEligibility(
        uid: 'STUDENT_123',
        candidateMissionId: 'neet_ug_2027',
        event: event,
        paper: paper,
        existingAttempt: null,
      );

      expect(res.isAllowed, isFalse);
      expect(res.rejectionReason, equals('UNAUTHORIZED_MISSION'));
    });

    test('3. Start Gate: Rejects unreleased or closed event', () {
      final now = DateTime.now();
      final closedEvent = TestArenaFixtureHarness.createStagingEvent(
        startTime: now.subtract(const Duration(hours: 5)),
        endTime: now.subtract(const Duration(hours: 1)),
      );
      final paper = TestArenaFixtureHarness.createStagingPaper();

      final res = TestArenaEngine.validateStartEligibility(
        uid: 'STUDENT_123',
        candidateMissionId: 'jee_main_2027',
        event: closedEvent,
        paper: paper,
        existingAttempt: null,
        currentTime: now,
      );

      expect(res.isAllowed, isFalse);
      expect(res.rejectionReason, equals('EVENT_WINDOW_CLOSED'));
    });

    test('4. Start Gate: Allows valid candidate within open event window', () {
      final event = TestArenaFixtureHarness.createStagingEvent();
      final paper = TestArenaFixtureHarness.createStagingPaper();

      final res = TestArenaEngine.validateStartEligibility(
        uid: 'STUDENT_123',
        candidateMissionId: 'jee_main_2027',
        event: event,
        paper: paper,
        existingAttempt: null,
      );

      expect(res.isAllowed, isTrue);
      expect(res.rejectionReason, isNull);
    });

    // =========================================================================
    // 2. ATTEMPT RUNTIME, AUTOSAVE & MARK FOR REVIEW
    // =========================================================================
    test('5. Attempt Initialization & Idempotent Answer Autosave', () {
      final event = TestArenaFixtureHarness.createStagingEvent();
      final paper = TestArenaFixtureHarness.createStagingPaper();

      final attempt = TestArenaEngine.initializeAttempt(
        attemptId: 'ATT_TEST_01',
        uid: 'STUDENT_123',
        event: event,
        paper: paper,
      );

      expect(attempt.status, equals(TestArenaAttemptStatus.active));
      expect(attempt.responses.length, equals(6));
      expect(attempt.summary.answeredCount, equals(0));
      expect(attempt.summary.unansweredCount, equals(6));

      // Record answer for Q1
      final updated = TestArenaEngine.recordAnswer(
        attempt: attempt,
        questionId: 'FIXTURE_Q_PHY_01',
        selectedOptionIndex: 1,
      );

      expect(updated.responses['FIXTURE_Q_PHY_01']?.isAnswered, isTrue);
      expect(updated.responses['FIXTURE_Q_PHY_01']?.selectedOptionIndex, equals(1));
      expect(updated.summary.answeredCount, equals(1));

      // Overwrite answer for Q1 (last-write consistency)
      final overwritten = TestArenaEngine.recordAnswer(
        attempt: updated,
        questionId: 'FIXTURE_Q_PHY_01',
        selectedOptionIndex: 2,
      );

      expect(overwritten.responses['FIXTURE_Q_PHY_01']?.selectedOptionIndex, equals(2));
      expect(overwritten.summary.answeredCount, equals(1)); // No duplicate records
    });

    test('6. Mark for Review does NOT mutate scoring or mastery', () {
      final event = TestArenaFixtureHarness.createStagingEvent();
      final paper = TestArenaFixtureHarness.createStagingPaper();

      final attempt = TestArenaEngine.initializeAttempt(
        attemptId: 'ATT_TEST_02',
        uid: 'STUDENT_123',
        event: event,
        paper: paper,
      );

      final marked = TestArenaEngine.toggleMarkForReview(
        attempt: attempt,
        questionId: 'FIXTURE_Q_PHY_01',
      );

      expect(marked.responses['FIXTURE_Q_PHY_01']?.isMarkedForReview, isTrue);
      expect(marked.summary.markedForReviewCount, equals(1));

      final unmarked = TestArenaEngine.toggleMarkForReview(
        attempt: marked,
        questionId: 'FIXTURE_Q_PHY_01',
      );

      expect(unmarked.responses['FIXTURE_Q_PHY_01']?.isMarkedForReview, isFalse);
      expect(unmarked.summary.markedForReviewCount, equals(0));
    });

    // =========================================================================
    // 3. SUBMISSION IDEMPOTENCY & AUTO-SUBMIT
    // =========================================================================
    test('7. Submission Idempotency: Multiple submits return one logical submission', () {
      final event = TestArenaFixtureHarness.createStagingEvent();
      final paper = TestArenaFixtureHarness.createStagingPaper();

      final attempt = TestArenaEngine.initializeAttempt(
        attemptId: 'ATT_TEST_03',
        uid: 'STUDENT_123',
        event: event,
        paper: paper,
      );

      final submit1 = TestArenaEngine.finalizeSubmission(attempt: attempt);
      expect(submit1.isCompleted, isTrue);
      expect(submit1.status, equals(TestArenaAttemptStatus.submitted));

      final submit2 = TestArenaEngine.finalizeSubmission(attempt: submit1);
      expect(submit2.submittedAt, equals(submit1.submittedAt));
      expect(submit2.status, equals(TestArenaAttemptStatus.submitted));
    });

    // =========================================================================
    // 4. SCORING REPRODUCIBILITY & REMEDIATION ROUTING
    // =========================================================================
    test('8. Scoring Reproducibility & Canonical Evidence Linking', () {
      final event = TestArenaFixtureHarness.createStagingEvent();
      final paper = TestArenaFixtureHarness.createStagingPaper();

      var attempt = TestArenaEngine.initializeAttempt(
        attemptId: 'ATT_TEST_04',
        uid: 'STUDENT_123',
        event: event,
        paper: paper,
      );

      // Q1: Correct (+4)
      attempt = TestArenaEngine.recordAnswer(
        attempt: attempt,
        questionId: 'FIXTURE_Q_PHY_01',
        selectedOptionIndex: 1, // Correct
      );
      // Q2: Incorrect (-1)
      attempt = TestArenaEngine.recordAnswer(
        attempt: attempt,
        questionId: 'FIXTURE_Q_PHY_02',
        numericalAnswer: '10.0', // Wrong (Correct is 4.9)
      );
      // Q3: Correct (+4)
      attempt = TestArenaEngine.recordAnswer(
        attempt: attempt,
        questionId: 'FIXTURE_Q_CHE_01',
        selectedOptionIndex: 1, // Correct
      );

      final finalized = TestArenaEngine.finalizeSubmission(attempt: attempt);

      final result = TestArenaEngine.scoreAttempt(
        attempt: finalized,
        paper: paper,
        verifiedAnswerKeys: TestArenaFixtureHarness.stagingAnswerKeys,
      );

      // Total Score: +4 -1 +4 +0 +0 +0 = 7
      expect(result.totalScore, equals(7));
      expect(result.maxScore, equals(24));
      expect(result.totalAttempted, equals(3));
      expect(result.totalCorrect, equals(2));
      expect(result.totalIncorrect, equals(1));
      expect(result.totalUnattempted, equals(3));

      // Subject Breakdown
      expect(result.subjectScores['Physics']?.score, equals(3)); // +4 - 1
      expect(result.subjectScores['Chemistry']?.score, equals(4)); // +4 + 0

      // Remediation targets: Q2 is incorrect
      expect(result.remediationTargets.length, equals(1));
      expect(result.remediationTargets.first.questionId, equals('FIXTURE_Q_PHY_02'));

      // Test reproducibility
      final isReproducible = TestArenaEngine.verifyResultReproducibility(
        originalResult: result,
        attempt: finalized,
        paper: paper,
        verifiedAnswerKeys: TestArenaFixtureHarness.stagingAnswerKeys,
      );
      expect(isReproducible, isTrue);
    });

    // =========================================================================
    // 5. STRICT 41 INVENTORY & MAJOR01 READINESS TEST
    // =========================================================================
    test('9. Strict 41 Inventory: Mathematics deficit fails closed (MAJOR01_FALSE_READY_TEST = PASS)', () {
      final contract = MissionExamContract.jeeMain2027Contract;
      final paper = contract.papers.first;

      // Create a pool of 41 strict candidates (20 Physics, 20 Chemistry, 1 Mathematics)
      final pool41 = <QuestionModel>[];
      for (int i = 1; i <= 20; i++) {
        pool41.add(QuestionModel(
          id: 'q_phy_$i',
          questionType: i <= 15 ? 'mcq_single' : 'numerical',
          question: 'Physics $i',
          options: const ['A', 'B', 'C', 'D'],
          answerIndex: 0,
          difficulty: QuestionDifficulty.medium,
          examId: 'jee_main_2027',
          subjectId: 'physics',
          nodeId: 'node_phy',
          atomicTopicIds: const ['af_phy'],
          status: 'published',
          verifiedBy: 'rev_1',
          verifiedAt: DateTime.now(),
          updatedAt: DateTime.now(),
          solution: 'Sol',
        ));
      }
      for (int i = 1; i <= 20; i++) {
        pool41.add(QuestionModel(
          id: 'q_che_$i',
          questionType: i <= 15 ? 'mcq_single' : 'numerical',
          question: 'Chemistry $i',
          options: const ['A', 'B', 'C', 'D'],
          answerIndex: 0,
          difficulty: QuestionDifficulty.medium,
          examId: 'jee_main_2027',
          subjectId: 'chemistry',
          nodeId: 'node_che',
          atomicTopicIds: const ['af_che'],
          status: 'published',
          verifiedBy: 'rev_1',
          verifiedAt: DateTime.now(),
          updatedAt: DateTime.now(),
          solution: 'Sol',
        ));
      }
      // Only 1 Mathematics question
      pool41.add(QuestionModel(
        id: 'q_mat_1',
        questionType: 'mcq_single',
        question: 'Mathematics 1',
        options: const ['A', 'B', 'C', 'D'],
        answerIndex: 0,
        difficulty: QuestionDifficulty.medium,
        examId: 'jee_main_2027',
        subjectId: 'mathematics',
        nodeId: 'node_mat',
        atomicTopicIds: const ['af_mat'],
        status: 'published',
        verifiedBy: 'rev_1',
        verifiedAt: DateTime.now(),
        updatedAt: DateTime.now(),
        solution: 'Sol',
      ));

      expect(pool41.length, equals(41));

      // Attempt to assemble Major01 paper (requires 75 total: 25 Phy, 25 Che, 25 Mat)
      final assembled = TestArenaEngine.assembleMajorPaper(
        contract: contract,
        paper: paper,
        pool: pool41,
      );

      // Fails closed: empty list returned (NOT_LAUNCHABLE)
      expect(assembled.isEmpty, isTrue);
    });

    // =========================================================================
    // 6. ABSOLUTE AIR GATING TEST MATRIX (NO HARDCODED MINIMUM COHORT)
    // =========================================================================
    test('10. AIR Gate Test Matrix: Gated cohort receives AIR; missing gates or unranked cohort receive null AIR', () {
      final now = DateTime.now();

      final r1 = TestArenaResult(
        attemptId: 'ATT_1',
        eventId: 'EVT_1',
        paperId: 'PAP_1',
        paperVersionHash: 'HASH_A',
        scoringPolicyVersion: 'V1',
        uid: 'user_1',
        totalScore: 240,
        isLiveAttempt: true,
        completedAt: now,
      );

      final r2 = TestArenaResult(
        attemptId: 'ATT_2',
        eventId: 'EVT_1',
        paperId: 'PAP_1',
        paperVersionHash: 'HASH_A',
        scoringPolicyVersion: 'V1',
        uid: 'user_2',
        totalScore: 180,
        isLiveAttempt: true,
        completedAt: now,
      );

      final rHist = TestArenaResult(
        attemptId: 'ATT_HIST',
        eventId: 'EVT_1',
        paperId: 'PAP_1',
        paperVersionHash: 'HASH_A',
        scoringPolicyVersion: 'V1',
        uid: 'user_late',
        totalScore: 200,
        isLiveAttempt: false, // Late/historical attempt
        completedAt: now.add(const Duration(days: 1)),
      );

      // Case A: Governed cohort with explicit policy minimum
      final ranked = TestArenaEngine.computeEventRankings(
        eventId: 'EVT_1',
        results: [r1, r2, rHist],
        cohortId: 'COHORT_2027_STAGE1',
        rankingPolicyVersion: 'AIR_POLICY_V1',
        isRankAuthoritative: true,
        governedMinCohortSize: 2,
      );

      final rankedLive1 = ranked.firstWhere((r) => r.uid == 'user_1');
      final rankedLive2 = ranked.firstWhere((r) => r.uid == 'user_2');
      final rankedLate = ranked.firstWhere((r) => r.uid == 'user_late');

      // Live participants receive event rank and percentile
      expect(rankedLive1.eventRank, equals(1));
      expect(rankedLive1.percentile, equals(100.0));
      expect(rankedLive2.eventRank, equals(2));
      expect(rankedLive2.percentile, equals(0.0));

      // Historical attempts NEVER receive event AIR / eventRank
      expect(rankedLate.eventRank, isNull);
      expect(rankedLate.percentile, isNull);

      // Case B: Unresolved minimum cohort policy (null) -> AIR disabled
      final unResolvedCohort = TestArenaEngine.computeEventRankings(
        eventId: 'EVT_1',
        results: [r1, r2],
        cohortId: 'COHORT_2027_STAGE1',
        rankingPolicyVersion: 'AIR_POLICY_V1',
        isRankAuthoritative: true,
        governedMinCohortSize: null, // UNRESOLVED
      );

      expect(unResolvedCohort.every((r) => r.eventRank == null && r.percentile == null), isTrue);

      // Case C: Missing ranking policy version -> all AIR stays null
      final unGated = TestArenaEngine.computeEventRankings(
        eventId: 'EVT_1',
        results: [r1, r2],
        cohortId: 'COHORT_2027_STAGE1',
        rankingPolicyVersion: '', // MISSING
        governedMinCohortSize: 2,
      );

      expect(unGated.every((r) => r.eventRank == null && r.percentile == null), isTrue);
    });

    // =========================================================================
    // 7. UI RENDERING & ISOLATION
    // =========================================================================
    testWidgets('11. TestArenaScreen renders clean student copy without internal jargon or Founder staging controls', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: TestArenaScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('TEST ARENA'), findsOneWidget);
      expect(find.text('JEE MAIN 2027'), findsOneWidget);
      expect(find.text('No Test Arena event is ready yet.'), findsOneWidget);
      expect(find.text('Check back when a new event is available.'), findsOneWidget);
      expect(find.text('STANDARDIZED MAJOR SPECIFICATION'), findsOneWidget);

      // Verify ZERO internal operational terms exist in student tree
      expect(find.textContaining('Question pool eligibility reconciliation'), findsNothing);
      expect(find.textContaining('Provisional Major pool (75Q)'), findsNothing);
      expect(find.textContaining('strict'), findsNothing);

      // Verify ZERO Founder staging controls exist in student tree
      expect(find.text('LAUNCH STAGING TEST HARNESS'), findsNothing);
      expect(find.text('FOUNDER TEST STAGING HARNESS'), findsNothing);
    });

    testWidgets('12. TestArenaActiveTestScreen renders questions and timer', (tester) async {
      final stagingEvent = TestArenaFixtureHarness.createStagingEvent();
      final stagingPaper = TestArenaFixtureHarness.createStagingPaper();

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: TestArenaActiveTestScreen(
              event: stagingEvent,
              paper: stagingPaper,
              uid: 'TEST_CANDIDATE_01',
              isFixtureMode: true,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('STAGING'), findsOneWidget);
      expect(find.text('Q 1 of 6'), findsOneWidget);
      expect(find.text('PHYSICS'), findsOneWidget);
      expect(find.text('REVIEW'), findsOneWidget);
      expect(find.text('NEXT'), findsOneWidget);
      expect(find.text('SUBMIT'), findsOneWidget);
    });
  });
}
