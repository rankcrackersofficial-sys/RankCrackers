import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
import 'package:rank_crackers/features/crucible/models/crucible_schedule.dart';
import 'package:rank_crackers/features/crucible/core/micro_test_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';

void main() {
  setUp(() {
    QuestionTrustRepository.resetForTest();
  });

  group('Crucible C1/C2 Anti-Regression Guard', () {
    test('C1_TEMPORAL_REGRESSION = 0', () {
      expect(CrucibleClockEngine.courseStartHour, 10);
      expect(CrucibleClockEngine.testStartHour, 9);
      expect(CrucibleClockEngine.terminalDaySentinel, 101);
    });

    test('50-Question Count Law is enforced', () {
      final pool = List.generate(49, (i) {
        return QuestionModel(
          id: 'q_${i.toString().padLeft(3, '0')}',
          nodeId: 'node_1',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          question: 'Stem $i',
          options: const ['A', 'B', 'C', 'D'],
          answerIndex: 0,
          difficulty: QuestionDifficulty.medium,
          status: 'published',
          version: 1,
          lastAdminId: 'admin_human_01',
          updatedAt: DateTime(2026, 8, 13),
          verifiedBy: 'admin_human_02',
          verifiedAt: DateTime(2026, 8, 13),
          atomicTopicIds: const ['atom_01'],
          factId: 'fact_01',
          questionType: 'mcq_single',
          solution: 'Verified explanation.',
          questionLineageId: 'lin_${i.toString().padLeft(3, '0')}',
        );
      });

      final verifiedFactIds = {'fact_01'};
      final factSourceDocuments = {'fact_01': 'doc_01'};
      final reviewerAuthorities = {'admin_human_02': 'PRO_REVIEWER'};
      final verifiedAnswerKeys = <String>{};
      final verifiedAnswerKeyValues = <String, String>{};
      final studentReadyQuestionIds = <String>{};
      final activeQuestionVersions = <String, int>{};
      final verifiedSolutions = <String, SolutionVerificationRecord>{};

      for (final q in pool) {
        verifiedAnswerKeys.add(q.id);
        verifiedAnswerKeyValues[q.id] = '0';
        studentReadyQuestionIds.add(q.id);
        activeQuestionVersions[q.questionLineageId!] = 1;
        verifiedSolutions[q.id] = SolutionVerificationRecord(
          questionId: q.id,
          questionLineageId: q.questionLineageId!,
          version: 1,
          solutionStatus: 'verified',
          solutionHash: MicroTestEngine.hashSolution(q.solution),
          reviewingAuthority: 'admin_human_02',
          verifiedAnswerValue: '0',
          verifiedAt: DateTime(2026, 8, 13),
        );
      }

      final trust = QuestionTrustSnapshot(
        verifiedFactIds: verifiedFactIds,
        factSourceDocuments: factSourceDocuments,
        heldFactIds: const {},
        reviewerAuthorities: reviewerAuthorities,
        verifiedAnswerKeys: verifiedAnswerKeys,
        verifiedAnswerKeyValues: verifiedAnswerKeyValues,
        studentReadyQuestionIds: studentReadyQuestionIds,
        pyqPaperEvidence: const {},
        activeQuestionVersions: activeQuestionVersions,
        verifiedSolutions: verifiedSolutions,
      );

      final testCount49 = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 50,
        trustSnapshot: trust,
      );
      expect(testCount49, isEmpty); // Deficit locks assembly

      // Add one more to reach 50
      final pool50 = List<QuestionModel>.from(pool)
        ..add(QuestionModel(
          id: 'q_050',
          nodeId: 'node_1',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          question: 'Stem 50',
          options: const ['A', 'B', 'C', 'D'],
          answerIndex: 0,
          difficulty: QuestionDifficulty.medium,
          status: 'published',
          version: 1,
          lastAdminId: 'admin_human_01',
          updatedAt: DateTime(2026, 8, 13),
          verifiedBy: 'admin_human_02',
          verifiedAt: DateTime(2026, 8, 13),
          atomicTopicIds: const ['atom_01'],
          factId: 'fact_01',
          questionType: 'mcq_single',
          solution: 'Verified explanation.',
          questionLineageId: 'lin_050',
        ));
      
      verifiedAnswerKeys.add('q_050');
      verifiedAnswerKeyValues['q_050'] = '0';
      studentReadyQuestionIds.add('q_050');
      activeQuestionVersions['lin_050'] = 1;
      verifiedSolutions['q_050'] = SolutionVerificationRecord(
        questionId: 'q_050',
        questionLineageId: 'lin_050',
        version: 1,
        solutionStatus: 'verified',
        solutionHash: MicroTestEngine.hashSolution('Verified explanation.'),
        reviewingAuthority: 'admin_human_02',
        verifiedAnswerValue: '0',
        verifiedAt: DateTime(2026, 8, 13),
      );

      final trust50 = QuestionTrustSnapshot(
        verifiedFactIds: verifiedFactIds,
        factSourceDocuments: factSourceDocuments,
        heldFactIds: const {},
        reviewerAuthorities: reviewerAuthorities,
        verifiedAnswerKeys: verifiedAnswerKeys,
        verifiedAnswerKeyValues: verifiedAnswerKeyValues,
        studentReadyQuestionIds: studentReadyQuestionIds,
        pyqPaperEvidence: const {},
        activeQuestionVersions: activeQuestionVersions,
        verifiedSolutions: verifiedSolutions,
      );

      final testCount50 = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool50,
        requiredCount: 50,
        trustSnapshot: trust50,
      );
      expect(testCount50.length, 50);
    });
  });

  group('Crucible C2-FIX4 Trust Hydration & Fail-Closed Behavior', () {
    final validQuestion = QuestionModel(
      id: 'q_001',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: r'A train moves at constant speed $20\text{ m/s}$.',
      options: const ['A', 'B', 'C', 'D'],
      answerIndex: 0,
      difficulty: QuestionDifficulty.easy,
      status: 'published',
      version: 1,
      lastAdminId: 'admin_human_01',
      updatedAt: DateTime(2026, 8, 13),
      verifiedBy: 'admin_human_01',
      verifiedAt: DateTime(2026, 8, 13),
      atomicTopicIds: const ['atom_01'],
      factId: 'fact_01',
      questionType: 'mcq_single',
      solution: 'Explanation.',
      questionLineageId: 'lin_001',
    );

    test('Unhydrated repository fails closed with TRUST_SNAPSHOT_NOT_READY', () {
      expect(QuestionTrustRepository.isHydrated, isFalse);
      
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, equals('TRUST_SNAPSHOT_NOT_READY'));
    });

    test('Hydration succeeds and validates correctly', () {
      final trust = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_001'},
        verifiedAnswerKeyValues: const {'q_001': '0'},
        studentReadyQuestionIds: const {'q_001'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_001': 1},
        verifiedSolutions: {
          'q_001': SolutionVerificationRecord(
            questionId: 'q_001',
            questionLineageId: 'lin_001',
            version: 1,
            solutionStatus: 'verified',
            solutionHash: MicroTestEngine.hashSolution('Explanation.'),
            reviewingAuthority: 'admin_human_01',
            verifiedAnswerValue: '0',
            verifiedAt: DateTime(2026, 8, 13),
          )
        },
      );

      QuestionTrustRepository.initializeAuthoritativeSnapshot(trust);
      expect(QuestionTrustRepository.isHydrated, isTrue);

      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, isNull);
    });
  });

  group('Crucible C2-FIX4 Signed Decimal Numerical Answers', () {
    final validQuestion = QuestionModel(
      id: 'q_num',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: 'Numerical Stem',
      options: const [],
      answerIndex: 0, // answerIndex ignored/placeholder for numerical
      difficulty: QuestionDifficulty.easy,
      status: 'published',
      version: 1,
      lastAdminId: 'admin_human_01',
      updatedAt: DateTime(2026, 8, 13),
      verifiedBy: 'admin_human_01',
      verifiedAt: DateTime(2026, 8, 13),
      atomicTopicIds: const ['atom_01'],
      factId: 'fact_01',
      questionType: 'numerical',
      solution: 'Explanation.',
      questionLineageId: 'lin_num',
      numericalAnswer: -2.5, // Signed decimal answer
    );

    final trust = QuestionTrustSnapshot(
      verifiedFactIds: const {'fact_01'},
      factSourceDocuments: const {'fact_01': 'doc_01'},
      heldFactIds: const {},
      reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
      verifiedAnswerKeys: const {'q_num'},
      verifiedAnswerKeyValues: const {'q_num': '-2.5'},
      studentReadyQuestionIds: const {'q_num'},
      pyqPaperEvidence: const {},
      activeQuestionVersions: const {'lin_num': 1},
      verifiedSolutions: {
        'q_num': SolutionVerificationRecord(
          questionId: 'q_num',
          questionLineageId: 'lin_num',
          version: 1,
          solutionStatus: 'verified',
          solutionHash: MicroTestEngine.hashSolution('Explanation.'),
          reviewingAuthority: 'admin_human_01',
          verifiedAnswerValue: '-2.5',
          verifiedAt: DateTime(2026, 8, 13),
        )
      },
    );

    test('Signed integer and decimals are fully validated without loss', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, isNull);
    });

    test('Specific numerical decimal values (2.5, -2.5, 0.125, -0.125) are supported', () {
      final testCases = [2.5, -2.5, 0.125, -0.125, 0.0, 5.0, -5.0];
      for (final val in testCases) {
        final q = validQuestion.copyWith(numericalAnswer: val);
        final trustVal = QuestionTrustSnapshot(
          verifiedFactIds: const {'fact_01'},
          factSourceDocuments: const {'fact_01': 'doc_01'},
          heldFactIds: const {},
          reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
          verifiedAnswerKeys: const {'q_num'},
          verifiedAnswerKeyValues: { 'q_num': val.toString() },
          studentReadyQuestionIds: const {'q_num'},
          pyqPaperEvidence: const {},
          activeQuestionVersions: const {'lin_num': 1},
          verifiedSolutions: {
            'q_num': SolutionVerificationRecord(
              questionId: 'q_num',
              questionLineageId: 'lin_num',
              version: 1,
              solutionStatus: 'verified',
              solutionHash: MicroTestEngine.hashSolution('Explanation.'),
              reviewingAuthority: 'admin_human_01',
              verifiedAnswerValue: val.toString(),
              verifiedAt: DateTime(2026, 8, 13),
            )
          },
        );

        final err = MicroTestEngine.checkQuestionEligibility(
          q,
          'sch_01',
          const ['atom_01'],
          trustSnapshot: trustVal,
        );
        expect(err, isNull);
      }
    });

    test('Numerical with options is rejected', () {
      final qOpts = validQuestion.copyWith(options: const ['A', 'B']);
      final err = MicroTestEngine.checkQuestionEligibility(
        qOpts,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('numerical options must be empty'));
    });

    test('MCQ without options (empty options list) is rejected', () {
      final qMcqEmpty = validQuestion.copyWith(questionType: 'mcq_single', options: const []);
      final err = MicroTestEngine.checkQuestionEligibility(
        qMcqEmpty,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('MCQ options count must equal 4'));
    });
  });

  group('Crucible C2-FIX4 Solution SHA-256 Hashing', () {
    final validQuestion = QuestionModel(
      id: 'q_001',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: 'Stem MCQ',
      options: const ['A', 'B', 'C', 'D'],
      answerIndex: 0,
      difficulty: QuestionDifficulty.easy,
      status: 'published',
      version: 1,
      lastAdminId: 'admin_human_01',
      updatedAt: DateTime(2026, 8, 13),
      verifiedBy: 'admin_human_01',
      verifiedAt: DateTime(2026, 8, 13),
      atomicTopicIds: const ['atom_01'],
      factId: 'fact_01',
      questionType: 'mcq_single',
      solution: 'Explanation.',
      questionLineageId: 'lin_001',
    );

    test('Rejects if solution text has changed after verification (SHA-256 check)', () {
      final trustHashMismatch = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_001'},
        verifiedAnswerKeyValues: const {'q_001': '0'},
        studentReadyQuestionIds: const {'q_001'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_001': 1},
        verifiedSolutions: {
          'q_001': SolutionVerificationRecord(
            questionId: 'q_001',
            questionLineageId: 'lin_001',
            version: 1,
            solutionStatus: 'verified',
            solutionHash: 'invalid_sha256_hash_here', // Hash mismatch
            reviewingAuthority: 'admin_human_01',
            verifiedAnswerValue: '0',
            verifiedAt: DateTime(2026, 8, 13),
          )
        },
      );

      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustHashMismatch,
      );
      expect(err, contains('solution text hash mismatch'));
    });
  });

  group('Crucible C2-FIX4 Question Model Serialization & Projections', () {
    test('QuestionModel round-trip preserves numericalAnswer and all other fields', () {
      final original = QuestionModel(
        id: 'q_round',
        nodeId: 'node_1',
        examId: 'jee_main_2026',
        subjectId: 'Physics',
        question: 'Stem Question text.',
        options: const ['A', 'B', 'C', 'D'],
        answerIndex: 2,
        difficulty: QuestionDifficulty.hard,
        status: 'published',
        version: 3,
        lastAdminId: 'admin_human_01',
        updatedAt: DateTime.fromMillisecondsSinceEpoch(1723500000000),
        verifiedBy: 'admin_human_02',
        verifiedAt: DateTime.fromMillisecondsSinceEpoch(1723500000000),
        sourceType: 'admin',
        isPYQ: true,
        questionType: 'numerical',
        solution: 'Explanation round-trip.',
        questionLineageId: 'lin_round',
        numericalAnswer: -2.5,
      );

      final map = original.toMap();
      final reconstructed = QuestionModel.fromMap(map);

      expect(reconstructed.id, equals(original.id));
      expect(reconstructed.numericalAnswer, equals(original.numericalAnswer));
      expect(reconstructed.numericalAnswer, equals(-2.5));
    });

    test('toStudentSafeProjection() strips private answers and solutions', () {
      final original = QuestionModel(
        id: 'q_round',
        nodeId: 'node_1',
        examId: 'jee_main_2026',
        subjectId: 'Physics',
        question: 'Stem Question text.',
        options: const ['A', 'B', 'C', 'D'],
        answerIndex: 2,
        difficulty: QuestionDifficulty.hard,
        status: 'published',
        version: 3,
        lastAdminId: 'admin_human_01',
        updatedAt: DateTime.fromMillisecondsSinceEpoch(1723500000000),
        verifiedBy: 'admin_human_02',
        verifiedAt: DateTime.fromMillisecondsSinceEpoch(1723500000000),
        sourceType: 'admin',
        isPYQ: true,
        questionType: 'numerical',
        solution: 'Explanation.',
        questionLineageId: 'lin_round',
        numericalAnswer: -2.5,
      );

      final projection = original.toStudentSafeProjection();
      
      expect(projection.answerIndex, equals(-1));
      expect(projection.numericalAnswer, isNull);
      expect(projection.solution, isNull);
      expect(projection.question, equals(original.question));
    });
  });

  group('Crucible C2 Restored/Merged Semantics Regression', () {
    final validQuestion = QuestionModel(
      id: 'q_001',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: r'A train moves at constant speed $20\text{ m/s}$.',
      options: const ['A', 'B', 'C', 'D'],
      answerIndex: 0,
      difficulty: QuestionDifficulty.easy,
      status: 'published',
      version: 1,
      lastAdminId: 'admin_human_01',
      updatedAt: DateTime(2026, 8, 13),
      verifiedBy: 'admin_human_01',
      verifiedAt: DateTime(2026, 8, 13),
      atomicTopicIds: const ['atom_01'],
      factId: 'fact_01',
      questionType: 'mcq_single',
      solution: 'Explanation.',
      questionLineageId: 'lin_001',
    );

    final trust = QuestionTrustSnapshot(
      verifiedFactIds: const {'fact_01'},
      factSourceDocuments: const {'fact_01': 'doc_01'},
      heldFactIds: const {},
      reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
      verifiedAnswerKeys: const {'q_001'},
      verifiedAnswerKeyValues: const {'q_001': '0'},
      studentReadyQuestionIds: const {'q_001'},
      pyqPaperEvidence: const {},
      activeQuestionVersions: const {'lin_001': 1},
      verifiedSolutions: {
        'q_001': SolutionVerificationRecord(
          questionId: 'q_001',
          questionLineageId: 'lin_001',
          version: 1,
          solutionStatus: 'verified',
          solutionHash: MicroTestEngine.hashSolution('Explanation.'),
          reviewingAuthority: 'admin_human_01',
          verifiedAnswerValue: '0',
          verifiedAt: DateTime(2026, 8, 13),
        )
      },
    );

    test('Valid Question is accepted', () {
      final actualErr = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(actualErr, isNull);
    });

    test('Missing question ID is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(id: ''),
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('schema/type invalid'));
    });

    test('Missing stem is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(question: '  '),
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('schema/type invalid'));
    });

    test('Out of bounds answer index is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(answerIndex: 5),
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('answer schema invalid'));
    });

    test('Status draft is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(status: 'draft'),
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('review authority unresolved'));
    });

    test('Lacking human verification signature is rejected', () {
      final trustSystem = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'system': 'AI'}, // Unverified role
        verifiedAnswerKeys: const {'q_001'},
        verifiedAnswerKeyValues: const {'q_001': '0'},
        studentReadyQuestionIds: const {'q_001'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_001': 1},
        verifiedSolutions: {
          'q_001': SolutionVerificationRecord(
            questionId: 'q_001',
            questionLineageId: 'lin_001',
            version: 1,
            solutionStatus: 'verified',
            solutionHash: MicroTestEngine.hashSolution('Explanation.'),
            reviewingAuthority: 'admin_human_01',
            verifiedAnswerValue: '0',
            verifiedAt: DateTime(2026, 8, 13),
          )
        },
      );
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(verifiedBy: 'system'),
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustSystem,
      );
      expect(err, contains('review authority unresolved'));
    });

    test('Unsafe placeholder text is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(question: 'This is a placeholder stem'),
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('schema/type invalid'));
    });

    test('Rejects atom outside schedule scope (leakage safety)', () {
      final q = validQuestion.copyWith(atomicTopicIds: const ['atom_02']);
      final err = MicroTestEngine.checkQuestionEligibility(
        q,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('atom/source mapping invalid'));
    });

    test('Accepts atom inside schedule scope', () {
      final q = validQuestion.copyWith(atomicTopicIds: const ['atom_01']);
      final err = MicroTestEngine.checkQuestionEligibility(
        q,
        'sch_01',
        const ['atom_01', 'atom_02'],
        trustSnapshot: trust,
      );
      expect(err, isNull);
    });

    test('Deduplication: duplicate question IDs are filtered', () {
      final pool = [validQuestion, validQuestion];
      final test = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 1,
        trustSnapshot: trust,
      );
      expect(test.length, 1);
    });

    test('Verify complete 42-slot manifest mapping', () {
      final List<CrucibleSchedule> schedules = List.generate(42, (i) {
        final idx = i + 1;
        return CrucibleSchedule(
          id: 'sch_jee_main_2027_$idx',
          recruitmentId: 'jee_main_2027',
          scheduleIndex: idx,
          nodeIds: const ['node_1'],
          atomicTopicIds: ['atom_$idx'],
          scheduleType: 'study',
          targetHours: 4.0,
          blueprintId: 'default',
          digibookSessionId: 'default',
        );
      });

      final pool = <QuestionModel>[]; 
      final manifests = MicroTestEngine.build42SlotManifest(
        schedules: schedules,
        pool: pool,
        protocolStartTime: DateTime(2026, 8, 13, 10, 0),
        trustSnapshot: trust,
      );

      expect(manifests.length, 42);

      final slot1 = manifests.first;
      expect(slot1['microTestId'], 'micro_01');
      expect(slot1['deficit'], 50);
      expect(slot1['readinessState'], 'NOT_READY');
    });
  });
}
