import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
import 'package:rank_crackers/features/crucible/models/crucible_schedule.dart';
import 'package:rank_crackers/features/crucible/core/micro_test_engine.dart';
import 'package:rank_crackers/features/crucible/core/macro_test_engine.dart';

void main() {
  setUp(() {
    QuestionTrustRepository.resetForTest();
  });

  group('Crucible C5 Macro Test Engine Assembly Laws', () {
    test('100-Question Target Assembly Law is enforced', () {
      final pool = List.generate(99, (i) {
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

      final testCount99 = MacroTestEngine.assembleMacroTest(
        macroTestId: 'macro_01',
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 100,
        trustSnapshot: trust,
      );
      expect(testCount99, isEmpty); // Deficit locks assembly

      // Add 1 more to reach 100 questions
      final pool100 = List<QuestionModel>.from(pool)
        ..add(QuestionModel(
          id: 'q_100',
          nodeId: 'node_1',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          question: 'Stem 100',
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
          questionLineageId: 'lin_100',
        ));
      
      verifiedAnswerKeys.add('q_100');
      verifiedAnswerKeyValues['q_100'] = '0';
      studentReadyQuestionIds.add('q_100');
      activeQuestionVersions['lin_100'] = 1;
      verifiedSolutions['q_100'] = SolutionVerificationRecord(
        questionId: 'q_100',
        questionLineageId: 'lin_100',
        version: 1,
        solutionStatus: 'verified',
        solutionHash: MicroTestEngine.hashSolution('Verified explanation.'),
        reviewingAuthority: 'admin_human_02',
        verifiedAnswerValue: '0',
        verifiedAt: DateTime(2026, 8, 13),
      );

      final trust100 = QuestionTrustSnapshot(
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

      final testCount100 = MacroTestEngine.assembleMacroTest(
        macroTestId: 'macro_01',
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool100,
        requiredCount: 100,
        trustSnapshot: trust100,
      );
      expect(testCount100.length, 100);
    });

    test('Deterministic exact 100 selection when pool > 100 and seed stability', () {
      final pool = List.generate(120, (i) {
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

      // Run assembly 1
      final assembled1 = MacroTestEngine.assembleMacroTest(
        macroTestId: 'macro_01',
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 100,
        trustSnapshot: trust,
        manualSeed: 12345,
      );

      // Run assembly 2 with same seed
      final assembled2 = MacroTestEngine.assembleMacroTest(
        macroTestId: 'macro_01',
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 100,
        trustSnapshot: trust,
        manualSeed: 12345,
      );

      expect(assembled1.length, 100);
      expect(assembled2.length, 100);
      for (int i = 0; i < 100; i++) {
        expect(assembled1[i].id, assembled2[i].id);
      }

      // Run assembly 3 with different seed
      final assembled3 = MacroTestEngine.assembleMacroTest(
        macroTestId: 'macro_01',
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 100,
        trustSnapshot: trust,
        manualSeed: 54321,
      );

      bool orderDiffers = false;
      for (int i = 0; i < 100; i++) {
        if (assembled1[i].id != assembled3[i].id) {
          orderDiffers = true;
          break;
        }
      }
      expect(orderDiffers, isTrue); // Demonstrates deterministic seed stability variations
    });

    test('Macro seed derivation is reproducible and stable', () {
      final seed1 = MacroTestEngine.deriveSeed(
        macroTestId: 'macro_01',
        scheduleId: 'sch_06',
        poolVersion: '1.0.0',
        assemblyVersion: '1.0.0',
        attemptOrdinal: 1,
      );
      final seed2 = MacroTestEngine.deriveSeed(
        macroTestId: 'macro_01',
        scheduleId: 'sch_06',
        poolVersion: '1.0.0',
        assemblyVersion: '1.0.0',
        attemptOrdinal: 1,
      );
      expect(seed1, equals(seed2));
    });
  });

  group('Crucible C5 Macro Engine Security & Policy Matrix', () {
    final baseQuestion = QuestionModel(
      id: 'q_valid_01',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: r'Valid stem question text',
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
      questionLineageId: 'lin_01',
    );

    final trust = QuestionTrustSnapshot(
      verifiedFactIds: const {'fact_01'},
      factSourceDocuments: const {'fact_01': 'doc_01'},
      heldFactIds: const {},
      reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
      verifiedAnswerKeys: const {'q_valid_01'},
      verifiedAnswerKeyValues: const {'q_valid_01': '0'},
      studentReadyQuestionIds: const {'q_valid_01'},
      pyqPaperEvidence: const {},
      activeQuestionVersions: const {'lin_01': 1},
      verifiedSolutions: {
        'q_valid_01': SolutionVerificationRecord(
          questionId: 'q_valid_01',
          questionLineageId: 'lin_01',
          version: 1,
          solutionStatus: 'verified',
          solutionHash: MicroTestEngine.hashSolution('Explanation.'),
          reviewingAuthority: 'admin_human_01',
          verifiedAnswerValue: '0',
          verifiedAt: DateTime(2026, 8, 13),
        )
      },
    );

    test('Duplicate Question IDs are filtered out from Macro assembly', () {
      final poolWithDuplicates = [baseQuestion, baseQuestion];
      final assembled = MacroTestEngine.assembleMacroTest(
        macroTestId: 'macro_01',
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: poolWithDuplicates,
        requiredCount: 1,
        trustSnapshot: trust,
      );
      expect(assembled.length, 1);
    });

    test('Lineage Collision is blocked (only active version is used)', () {
      final oldVersion = baseQuestion.copyWith(id: 'q_old_01', version: 1);
      final newVersion = baseQuestion.copyWith(id: 'q_new_01', version: 2);
      
      final trustWithLineageCollision = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_old_01', 'q_new_01'},
        verifiedAnswerKeyValues: const {'q_old_01': '0', 'q_new_01': '0'},
        studentReadyQuestionIds: const {'q_old_01', 'q_new_01'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_01': 2}, // Active is 2
        verifiedSolutions: {
          'q_old_01': SolutionVerificationRecord(
            questionId: 'q_old_01',
            questionLineageId: 'lin_01',
            version: 1,
            solutionStatus: 'verified',
            solutionHash: MicroTestEngine.hashSolution('Explanation.'),
            reviewingAuthority: 'admin_human_01',
            verifiedAnswerValue: '0',
            verifiedAt: DateTime(2026, 8, 13),
          ),
          'q_new_01': SolutionVerificationRecord(
            questionId: 'q_new_01',
            questionLineageId: 'lin_01',
            version: 2,
            solutionStatus: 'verified',
            solutionHash: MicroTestEngine.hashSolution('Explanation.'),
            reviewingAuthority: 'admin_human_01',
            verifiedAnswerValue: '0',
            verifiedAt: DateTime(2026, 8, 13),
          )
        },
      );

      final errOld = MicroTestEngine.checkQuestionEligibility(
        oldVersion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustWithLineageCollision,
      );
      expect(errOld, contains('version is superseded'));

      final errNew = MicroTestEngine.checkQuestionEligibility(
        newVersion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustWithLineageCollision,
      );
      expect(errNew, isNull);
    });

    test('Future/Wrong Phase atom leakage is blocked', () {
      final qWrongAtom = baseQuestion.copyWith(atomicTopicIds: const ['atom_future_01']);
      final err = MicroTestEngine.checkQuestionEligibility(
        qWrongAtom,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('atom atom_future_01 is outside schedule scope'));
    });

    test('Unknown atom rejection', () {
      final qWrongAtom = baseQuestion.copyWith(atomicTopicIds: const ['atom_unknown_999']);
      final err = MicroTestEngine.checkQuestionEligibility(
        qWrongAtom,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('outside schedule scope'));
    });

    test('Missing exam ID rejection', () {
      final qWrongMission = baseQuestion.copyWith(examId: '');
      final err = MicroTestEngine.checkQuestionEligibility(
        qWrongMission,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('schema/type invalid: missing basic fields'));
    });

    test('Valid-but-wrong mission / recruitment ID rejection', () {
      final qWrongMission = baseQuestion.copyWith(examId: 'neet_2026');
      final pool = [qWrongMission];
      final assembled = MacroTestEngine.assembleMacroTest(
        macroTestId: 'macro_01',
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 1,
        trustSnapshot: trust,
        recruitmentId: 'jee_main_2026',
      );
      expect(assembled, isEmpty);
    });

    test('Fixture questions isolation from production inventory', () {
      final pool = [baseQuestion];
      final assembled = MacroTestEngine.assembleMacroTest(
        macroTestId: 'macro_01',
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 1,
        trustSnapshot: trust,
        recruitmentId: 'jee_main_2026',
      );
      expect(assembled.length, 1);
      // Verify that QuestionTrustRepository and local snapshots remain purely memory-based
      // and do not invoke any cloud DB persistent mutation routines.
      expect(QuestionTrustRepository.isHydrated, isFalse);
    });

    test('Source unresolved / missing fact ID or held fact rejection', () {
      final qNoFact = baseQuestion.copyWith(factId: '');
      final errNoFact = MicroTestEngine.checkQuestionEligibility(
        qNoFact,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(errNoFact, contains('missing factId'));

      final qUnregisteredFact = baseQuestion.copyWith(factId: 'fact_unregistered');
      final errUnregistered = MicroTestEngine.checkQuestionEligibility(
        qUnregisteredFact,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(errUnregistered, contains('unverified or unregistered'));

      final trustHeld = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {'fact_01'}, // Fact is held
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_valid_01'},
        verifiedAnswerKeyValues: const {'q_valid_01': '0'},
        studentReadyQuestionIds: const {'q_valid_01'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_01': 1},
        verifiedSolutions: trust.verifiedSolutions,
      );

      final errHeld = MicroTestEngine.checkQuestionEligibility(
        baseQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustHeld,
      );
      expect(errHeld, contains('academically held/rejected'));
    });

    test('Answer key unverified or value conflict rejection', () {
      final trustNoKey = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {}, // No keys
        verifiedAnswerKeyValues: const {},
        studentReadyQuestionIds: const {'q_valid_01'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_01': 1},
        verifiedSolutions: trust.verifiedSolutions,
      );

      final errNoKey = MicroTestEngine.checkQuestionEligibility(
        baseQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustNoKey,
      );
      expect(errNoKey, contains('key lacks professional verification'));

      final trustConflictingKey = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_valid_01'},
        verifiedAnswerKeyValues: const {'q_valid_01': '3'}, // Conflicting answer
        studentReadyQuestionIds: const {'q_valid_01'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_01': 1},
        verifiedSolutions: trust.verifiedSolutions,
      );

      final errConflict = MicroTestEngine.checkQuestionEligibility(
        baseQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustConflictingKey,
      );
      expect(errConflict, contains('answer key value conflict'));
    });

    test('Solution unverified or hash mismatch rejection', () {
      final trustNoSolution = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_valid_01'},
        verifiedAnswerKeyValues: const {'q_valid_01': '0'},
        studentReadyQuestionIds: const {'q_valid_01'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_01': 1},
        verifiedSolutions: const {}, // Missing solutions
      );

      final errNoSolution = MicroTestEngine.checkQuestionEligibility(
        baseQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustNoSolution,
      );
      expect(errNoSolution, contains('solution verification record is missing'));

      final trustHashMismatch = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_valid_01'},
        verifiedAnswerKeyValues: const {'q_valid_01': '0'},
        studentReadyQuestionIds: const {'q_valid_01'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_01': 1},
        verifiedSolutions: {
          'q_valid_01': SolutionVerificationRecord(
            questionId: 'q_valid_01',
            questionLineageId: 'lin_01',
            version: 1,
            solutionStatus: 'verified',
            solutionHash: 'wrong_sha256_hash', // Conflicting hash
            reviewingAuthority: 'admin_human_01',
            verifiedAnswerValue: '0',
            verifiedAt: DateTime(2026, 8, 13),
          )
        },
      );

      final errHash = MicroTestEngine.checkQuestionEligibility(
        baseQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustHashMismatch,
      );
      expect(errHash, contains('solution text hash mismatch'));
    });

    test('Unhydrated repository fails closed with TRUST_SNAPSHOT_NOT_READY', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        baseQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: null, // Forces fail-closed
      );
      expect(err, equals('TRUST_SNAPSHOT_NOT_READY'));
    });

    test('Inactive/Unapproved/Draft status question is rejected', () {
      final qDraft = baseQuestion.copyWith(status: 'draft');
      final err = MicroTestEngine.checkQuestionEligibility(
        qDraft,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('review authority unresolved'));
    });

    test('Lacking human verification or AI verifier is rejected', () {
      final qAiVerified = baseQuestion.copyWith(verifiedBy: 'ai_normalizer');
      final trustAi = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'ai_normalizer': 'AI'}, // Unverified role
        verifiedAnswerKeys: const {'q_valid_01'},
        verifiedAnswerKeyValues: const {'q_valid_01': '0'},
        studentReadyQuestionIds: const {'q_valid_01'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_01': 1},
        verifiedSolutions: trust.verifiedSolutions,
      );

      final err = MicroTestEngine.checkQuestionEligibility(
        qAiVerified,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustAi,
      );
      expect(err, contains('review authority unresolved'));
    });
  });

  group('Crucible C5 7-Slot Macro Manifest Mapping', () {
    test('Verify complete 7-slot temporal manifest mapping', () {
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
      final protocolStartTime = DateTime(2026, 8, 13, 10, 0);

      final manifests = MacroTestEngine.build7SlotMacroManifest(
        schedules: schedules,
        pool: pool,
        protocolStartTime: protocolStartTime,
      );

      expect(manifests.length, 7);

      // Verify slot 1 details
      final slot1 = manifests.first;
      expect(slot1['macroTestId'], 'macro_01');
      expect(slot1['phaseId'], 'phase_1');
      expect(slot1['requiredQuestionCount'], 100);
      expect(slot1['deficit'], 100);
      expect(slot1['readinessState'], 'NOT_READY');

      // Verify temporal boundaries for Phase 1 Macro
      // Day 14 09:00 AM to Day 14 11:00 AM (12 days 23 hours to 13 days 1 hour)
      final expectedStart1 = protocolStartTime.add(const Duration(days: 12, hours: 23));
      final expectedEnd1 = protocolStartTime.add(const Duration(days: 13, hours: 1));
      expect(slot1['temporalEligibilityStart'], expectedStart1);
      expect(slot1['temporalEligibilityEnd'], expectedEnd1);

      // Verify temporal boundaries for Phase 2 Macro (Phase start = protocolStartTime + 14 days)
      final slot2 = manifests[1];
      final phase2Start = protocolStartTime.add(const Duration(days: 14));
      final expectedStart2 = phase2Start.add(const Duration(days: 12, hours: 23));
      final expectedEnd2 = phase2Start.add(const Duration(days: 13, hours: 1));
      expect(slot2['macroTestId'], 'macro_02');
      expect(slot2['temporalEligibilityStart'], expectedStart2);
      expect(slot2['temporalEligibilityEnd'], expectedEnd2);
    });
  });
}
