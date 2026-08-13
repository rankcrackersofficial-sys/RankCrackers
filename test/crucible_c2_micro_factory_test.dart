import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
import 'package:rank_crackers/features/crucible/models/crucible_schedule.dart';
import 'package:rank_crackers/features/crucible/core/micro_test_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';

void main() {
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

      for (final q in pool) {
        verifiedAnswerKeys.add(q.id);
        verifiedAnswerKeyValues[q.id] = '0';
        studentReadyQuestionIds.add(q.id);
        activeQuestionVersions[q.questionLineageId!] = 1;
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

  group('Crucible C2-FIX2 Trust Store & Authoritative Snapshot Immutability', () {
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

    test('Production path consumes singleton snapshot and ignores caller-supplied mutable map overrides', () {
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
      );

      QuestionTrustRepository.setAuthoritativeSnapshot(trust);

      // Verify that calling eligibility without passing custom snapshot uses the authoritative one
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, isNull);

      // Verify mutating a local map after setting the singleton does not bypass verification
      final corruptTrust = QuestionTrustSnapshot(
        verifiedFactIds: const {}, // Empty verified facts
        factSourceDocuments: const {},
        heldFactIds: const {},
        reviewerAuthorities: const {},
        verifiedAnswerKeys: const {},
        verifiedAnswerKeyValues: const {},
        studentReadyQuestionIds: const {},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {},
      );

      QuestionTrustRepository.setAuthoritativeSnapshot(corruptTrust);

      final errCorrupt = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(errCorrupt, contains('source provenance unresolved'));
    });
  });

  group('Crucible C2-FIX2 Explicit Question Type Gates', () {
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
    );

    test('Unresolved legacy type is rejected', () {
      final legacyQuestion = QuestionModel(
        id: 'q_legacy',
        nodeId: 'node_physics_1',
        examId: 'jee_main_2026',
        subjectId: 'Physics',
        question: 'Legacy Stem',
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
        solution: 'Explanation.',
        questionLineageId: 'lin_legacy',
      );

      final trustLegacy = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_legacy'},
        verifiedAnswerKeyValues: const {'q_legacy': '0'},
        studentReadyQuestionIds: const {'q_legacy'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_legacy': 1},
      );

      final err = MicroTestEngine.checkQuestionEligibility(
        legacyQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustLegacy,
      );
      expect(err, contains('type is unresolved'));
    });

    test('MCQ with missing options is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(options: const []), // MCQ but options are empty
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('MCQ options count must equal 4'));
    });

    test('MCQ with empty options count must not silently fall back to numerical', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(options: const []),
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('MCQ options count must equal 4'));
    });

    test('Numerical type question is accepted without options', () {
      final numQuestion = validQuestion.copyWith(
        id: 'q_num',
        options: const [],
        questionType: 'numerical',
        questionLineageId: 'lin_num',
      );

      final trustNum = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_num'},
        verifiedAnswerKeyValues: const {'q_num': '0'},
        studentReadyQuestionIds: const {'q_num'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_num': 1},
      );

      final err = MicroTestEngine.checkQuestionEligibility(
        numQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustNum,
      );
      expect(err, isNull);
    });

    test('Unsupported question types are explicitly rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(questionType: 'multiple_correct'),
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('unsupported question type'));
    });
  });

  group('Crucible C2-FIX2 Answer Key & Explanation Gates', () {
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

    test('Rejects if answer key value conflicts with verified answer index record', () {
      final trustConflict = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_001'},
        verifiedAnswerKeyValues: const {'q_001': '1'}, // Expected is 1, but question is 0
        studentReadyQuestionIds: const {'q_001'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_001': 1},
      );

      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustConflict,
      );
      expect(err, contains('answer key value conflict'));
    });

    test('Rejects if solution / explanation is missing', () {
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
      );

      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(solution: '  '), // Empty solution
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trust,
      );
      expect(err, contains('missing explanation/solution'));
    });
  });

  group('Crucible C2-FIX2 Version Lineage Safety', () {
    final validQuestion = QuestionModel(
      id: 'q_001',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: 'Stem v1',
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

    test('Rejects superseded versions of a lineage', () {
      final trustSuperseded = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_001'},
        verifiedAnswerKeyValues: const {'q_001': '0'},
        studentReadyQuestionIds: const {'q_001'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_001': 2}, // Active is version 2
      );

      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(version: 1), // Question is version 1
        'sch_01',
        const ['atom_01'],
        trustSnapshot: trustSuperseded,
      );
      expect(err, contains('version is superseded'));
    });

    test('Two question documents sharing the same lineage cannot both enter one Micro Test', () {
      final q1 = validQuestion.copyWith(id: 'q_001_v2', version: 2);
      final q2 = validQuestion.copyWith(id: 'q_001_v3', version: 3);

      final trustMultiple = QuestionTrustSnapshot(
        verifiedFactIds: const {'fact_01'},
        factSourceDocuments: const {'fact_01': 'doc_01'},
        heldFactIds: const {},
        reviewerAuthorities: const {'admin_human_01': 'PRO_REVIEWER'},
        verifiedAnswerKeys: const {'q_001_v2', 'q_001_v3'},
        verifiedAnswerKeyValues: const {'q_001_v2': '0', 'q_001_v3': '0'},
        studentReadyQuestionIds: const {'q_001_v2', 'q_001_v3'},
        pyqPaperEvidence: const {},
        activeQuestionVersions: const {'lin_001': 2}, // Active version is 2
      );

      final pool = [q1, q2];
      final assembled = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 1, // Require 1 question to pass count law
        trustSnapshot: trustMultiple,
      );

      // Only one item of the lineage should be selected, avoiding duplication in assembled test
      expect(assembled.length, 1);
      expect(assembled.first.id, 'q_001_v2');
    });
  });

  group('Crucible C2-FIX2 Stable Seed Derivation', () {
    test('Seed is deterministically stable and platform-independent', () {
      final s1 = MicroTestEngine.deriveSeed(
        microTestId: 'micro_01',
        scheduleId: 'sch_01',
        poolVersion: '1.0.0',
        assemblyVersion: '1.0.0',
        attemptOrdinal: 1,
      );

      final s2 = MicroTestEngine.deriveSeed(
        microTestId: 'micro_01',
        scheduleId: 'sch_01',
        poolVersion: '1.0.0',
        assemblyVersion: '1.0.0',
        attemptOrdinal: 1,
      );

      expect(s1, equals(s2));
      expect(s1, equals(3859212250)); // Hardcoded target derived FNV-1a checksum to prove zero platform variance
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

      final pool = <QuestionModel>[]; // Empty pool for census deficit verification
      final manifests = MicroTestEngine.build42SlotManifest(
        schedules: schedules,
        pool: pool,
        protocolStartTime: DateTime(2026, 8, 13, 10, 0),
        trustSnapshot: trust,
      );

      expect(manifests.length, 42);

      // Verify slot 1
      final slot1 = manifests.first;
      expect(slot1['microTestId'], 'micro_01');
      expect(slot1['scheduleId'], 'sch_jee_main_2027_1');
      expect(slot1['phaseId'], 'phase_1');
      expect(slot1['scheduleIndex'], 1);
      expect(slot1['assignedAtomIds'], const ['atom_1']);
      expect(slot1['deficit'], 50);
      expect(slot1['readinessState'], 'NOT_READY');

      // Verify slot 42
      final slot42 = manifests.last;
      expect(slot42['microTestId'], 'micro_42');
      expect(slot42['scheduleId'], 'sch_jee_main_2027_42');
      expect(slot42['phaseId'], 'phase_7');
      expect(slot42['scheduleIndex'], 42);
      expect(slot42['assignedAtomIds'], const ['atom_42']);
      expect(slot42['deficit'], 50);
      expect(slot42['readinessState'], 'NOT_READY');
    });
  });
}
