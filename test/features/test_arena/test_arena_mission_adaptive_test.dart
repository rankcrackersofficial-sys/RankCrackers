import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/authority/mission_exam_contract.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/features/test_arena/core/test_arena_engine.dart';
import 'package:rank_crackers/features/test_arena/models/test_arena_event.dart';
import 'package:rank_crackers/features/test_arena/models/test_arena_result.dart';

void main() {
  group('Test Arena Mission-Adaptive & Standardized Ranking Tests', () {
    final contract = MissionExamContract.jeeMain2027Contract;
    final paper = contract.papers.first;

    QuestionModel createTestQuestion({
      required String id,
      required String subjectId,
      required String questionType,
      int answerIndex = 0,
      double? numericalAnswer,
    }) {
      return QuestionModel(
        id: id,
        questionType: questionType,
        question: 'Standardized stem for $id',
        options: questionType == 'mcq_single' ? const ['A', 'B', 'C', 'D'] : const [],
        answerIndex: answerIndex,
        numericalAnswer: numericalAnswer,
        difficulty: QuestionDifficulty.medium,
        examId: 'jee_main_2027',
        subjectId: subjectId,
        nodeId: 'node_01',
        atomicTopicIds: const ['atom_01'],
        status: 'published',
        verifiedBy: 'pro_reviewer_01',
        verifiedAt: DateTime.now(),
        updatedAt: DateTime.now(),
        solution: 'Step-by-step verified solution.',
      );
    }

    final pool = <QuestionModel>[];
    for (var sub in ['physics', 'chemistry', 'mathematics']) {
      for (int i = 1; i <= 25; i++) {
        pool.add(createTestQuestion(
          id: 'q_${sub}_mcq_$i',
          subjectId: sub,
          questionType: 'mcq_single',
          answerIndex: 1,
        ));
      }
      for (int i = 1; i <= 10; i++) {
        pool.add(createTestQuestion(
          id: 'q_${sub}_num_$i',
          subjectId: sub,
          questionType: 'numerical',
          numericalAnswer: 10.0,
        ));
      }
    }

    final event = TestArenaEvent(
      eventId: 'evt_jee_major_01',
      title: 'JEE Main 2027 Mission Major - Standardized Benchmark',
      examId: 'jee_main_2027',
      paperId: 'paper_1',
      eventType: TestArenaEventType.missionMajor,
      status: TestArenaEventStatus.live,
      examContract: contract,
      paperContract: paper,
      questionIds: pool.take(75).map((q) => q.id).toList(),
      scheduledStart: DateTime.now().subtract(const Duration(hours: 1)),
      scheduledEnd: DateTime.now().add(const Duration(hours: 2)),
      isRankAuthoritative: true,
    );

    test('1. Standardized Major paper assembly matches official exam contract (75 questions, 20 MCQ + 5 Num per subject)', () {
      final majorQuestions = TestArenaEngine.assembleMajorPaper(
        contract: contract,
        paper: paper,
        pool: pool,
      );

      expect(majorQuestions.length, equals(75));

      for (var sub in ['physics', 'chemistry', 'mathematics']) {
        final subQuestions = majorQuestions.where((q) => q.subjectId == sub).toList();
        expect(subQuestions.length, equals(25));
        expect(subQuestions.where((q) => q.questionType == 'mcq_single').length, equals(20));
        expect(subQuestions.where((q) => q.questionType == 'numerical').length, equals(5));
      }
    });

    test('2. Attempt scoring applies official marking scheme (+4 correct, -1 incorrect, 0 unanswered)', () {
      final responses = <StudentPaperResponse>[
        // 10 correct MCQs = +40
        for (int i = 0; i < 10; i++)
          StudentPaperResponse(
            questionId: 'q_phy_mcq_$i',
            domainId: 'physics',
            questionType: 'mcq_single',
            studentAnswer: 1,
            verifiedCorrectAnswer: 1,
            isAnswered: true,
            timeSpent: const Duration(minutes: 2),
          ),
        // 2 incorrect MCQs = -2
        for (int i = 10; i < 12; i++)
          StudentPaperResponse(
            questionId: 'q_phy_mcq_$i',
            domainId: 'physics',
            questionType: 'mcq_single',
            studentAnswer: 2,
            verifiedCorrectAnswer: 1,
            isAnswered: true,
            timeSpent: const Duration(minutes: 2),
          ),
        // 13 unanswered = 0
        for (int i = 12; i < 25; i++)
          StudentPaperResponse(
            questionId: 'q_phy_mcq_$i',
            domainId: 'physics',
            questionType: 'mcq_single',
            studentAnswer: null,
            verifiedCorrectAnswer: 1,
            isAnswered: false,
            timeSpent: Duration.zero,
          ),
      ];

      final result = TestArenaEngine.scoreAttempt(
        event: event,
        uid: 'student_warrior_01',
        responses: responses,
        isLiveAttempt: true,
      );

      // Score: 10 * 4 + 2 * (-1) = 38
      expect(result.rawScore, equals(38));
      expect(result.domainScores['physics'], equals(38));
    });

    test('3. Event rankings law: live participants receive event rank and percentile; late historical attempt receives benchmark percentile without mutating live rank', () {
      final liveResultA = TestArenaResult(
        eventId: event.eventId,
        uid: 'student_a',
        rawScore: 240,
        domainScores: const {'physics': 80, 'chemistry': 80, 'mathematics': 80},
        isLiveAttempt: true,
        completedAt: DateTime.now(),
      );

      final liveResultB = TestArenaResult(
        eventId: event.eventId,
        uid: 'student_b',
        rawScore: 180,
        domainScores: const {'physics': 60, 'chemistry': 60, 'mathematics': 60},
        isLiveAttempt: true,
        completedAt: DateTime.now(),
      );

      final liveResultC = TestArenaResult(
        eventId: event.eventId,
        uid: 'student_c',
        rawScore: 120,
        domainScores: const {'physics': 40, 'chemistry': 40, 'mathematics': 40},
        isLiveAttempt: true,
        completedAt: DateTime.now(),
      );

      // Late historical attempt (after live window closed)
      final historicalResult = TestArenaResult(
        eventId: event.eventId,
        uid: 'student_late',
        rawScore: 200,
        domainScores: const {'physics': 70, 'chemistry': 70, 'mathematics': 60},
        isLiveAttempt: false,
        completedAt: DateTime.now().add(const Duration(days: 5)),
      );

      final ranked = TestArenaEngine.computeEventRankings(
        eventId: event.eventId,
        results: [liveResultA, liveResultB, liveResultC, historicalResult],
      );

      final studentA = ranked.firstWhere((r) => r.uid == 'student_a');
      final studentB = ranked.firstWhere((r) => r.uid == 'student_b');
      final studentC = ranked.firstWhere((r) => r.uid == 'student_c');
      final studentLate = ranked.firstWhere((r) => r.uid == 'student_late');

      expect(studentA.eventRank, equals(1));
      expect(studentA.percentile, equals(100.0));
      expect(studentB.eventRank, equals(2));
      expect(studentB.percentile, equals(50.0));
      expect(studentC.eventRank, equals(3));
      expect(studentC.percentile, equals(0.0));

      // Late attempt does NOT receive fake live rank, but gets historical benchmark percentile
      expect(studentLate.eventRank, isNull);
      expect(studentLate.historicalBenchmarkPercentile, isNotNull);
      // Raw score 200 is above 2 out of 3 live participants => 66.67%
      expect(studentLate.historicalBenchmarkPercentile, closeTo(66.67, 0.1));
    });

    test('4. Test Arena feedback generation provides diagnostic signals without mutating ranking record', () {
      final result = TestArenaResult(
        eventId: event.eventId,
        uid: 'student_a',
        rawScore: 160,
        domainScores: const {'physics': 80, 'chemistry': 20, 'mathematics': 60},
        isLiveAttempt: true,
        eventRank: 1,
        percentile: 95.0,
        completedAt: DateTime.now(),
      );

      final responses = List.generate(
        75,
        (i) => StudentPaperResponse(
          questionId: 'q_$i',
          domainId: i < 25 ? 'physics' : (i < 50 ? 'chemistry' : 'mathematics'),
          questionType: 'mcq_single',
          studentAnswer: (i < 40) ? 1 : 2,
          verifiedCorrectAnswer: 1,
          isAnswered: i < 50,
          timeSpent: const Duration(minutes: 2),
        ),
      );

      final feedback = TestArenaEngine.generateCrucibleFeedback(
        result: result,
        responses: responses,
      );

      expect(feedback['rawScore'], equals(160));
      expect(feedback['weakDomains'], contains('chemistry'));
      expect(feedback['requiresTimedExecutionDrill'], isTrue);
    });
  });
}
