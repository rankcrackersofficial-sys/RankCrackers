import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
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
        );
      });

      // Populate trust gate registries to pass eligibility
      MicroTestEngine.clearRegistries();
      MicroTestEngine.verifiedFactIds.add('fact_01');
      MicroTestEngine.factSourceDocuments['fact_01'] = 'doc_01';
      MicroTestEngine.reviewerAuthorities['admin_human_02'] = 'PRO_REVIEWER';
      for (final q in pool) {
        MicroTestEngine.verifiedAnswerKeys.add(q.id);
        MicroTestEngine.studentReadyQuestionIds.add(q.id);
      }

      final testCount49 = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 50,
      );
      expect(testCount49, isEmpty); // Deficit locks the assembly

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
        ));
      MicroTestEngine.verifiedAnswerKeys.add('q_050');
      MicroTestEngine.studentReadyQuestionIds.add('q_050');

      final testCount50 = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool50,
        requiredCount: 50,
      );
      expect(testCount50.length, 50);
    });
  });

  group('Crucible C2-FIX1 Eligibility Hardening Gates', () {
    final validQuestion = QuestionModel(
      id: 'q_001',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: r'A train moves at constant speed $20\text{ m/s}$. Describe the book motion.',
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
    );

    setUp(() {
      MicroTestEngine.clearRegistries();
      MicroTestEngine.verifiedFactIds.add('fact_01');
      MicroTestEngine.factSourceDocuments['fact_01'] = 'doc_01';
      MicroTestEngine.reviewerAuthorities['admin_human_01'] = 'PRO_REVIEWER';
      MicroTestEngine.verifiedAnswerKeys.add('q_001');
      MicroTestEngine.studentReadyQuestionIds.add('q_001');
    });

    test('Valid MCQ is fully accepted', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, isNull);
    });

    test('Source Provenance: Missing factId is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(factId: ''),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('source provenance unresolved'));
    });

    test('Source Provenance: Unregistered factId is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(factId: 'fact_unregistered'),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('source provenance unresolved'));
    });

    test('Source Provenance: Academically held factId is rejected', () {
      MicroTestEngine.heldFactIds.add('fact_01');
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('source provenance unresolved'));
    });

    test('Reviewer Authority: Unregistered reviewer is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(verifiedBy: 'unknown_admin'),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('review authority unresolved'));
    });

    test('Reviewer Authority: System/AI reviewer role is rejected', () {
      MicroTestEngine.reviewerAuthorities['system'] = 'AI';
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(verifiedBy: 'system'),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('review authority unresolved'));
    });

    test('Question Type: Valid MCQ passes schema checks', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, isNull);
    });

    test('Question Type: MCQ with incorrect option length is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(options: const ['A', 'B', 'C']),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('answer schema invalid'));
    });

    test('Question Type: Valid supported numerical question is accepted without 4 options', () {
      final numerical = validQuestion.copyWith(
        id: 'q_num_01',
        options: const [], // Empty options for numeric response
      );
      MicroTestEngine.verifiedAnswerKeys.add('q_num_01');
      MicroTestEngine.studentReadyQuestionIds.add('q_num_01');

      final err = MicroTestEngine.checkQuestionEligibility(
        numerical,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, isNull);
    });

    test('Answer: Key unverified in verifiedAnswerKeys is rejected', () {
      MicroTestEngine.verifiedAnswerKeys.remove('q_001');
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('answer key academically unverified'));
    });

    test('PYQ Claim: Mismatched PYQ evidence is rejected', () {
      final pyq = validQuestion.copyWith(isPYQ: true);
      final err = MicroTestEngine.checkQuestionEligibility(
        pyq,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('unproven PYQ claim'));
    });

    test('PYQ Claim: Proven PYQ with paper proof is accepted', () {
      final pyq = validQuestion.copyWith(isPYQ: true);
      MicroTestEngine.pyqPaperEvidence['q_001'] = 'JEE_MAIN_2024_PHY_P1';
      final err = MicroTestEngine.checkQuestionEligibility(
        pyq,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, isNull);
    });

    test('Publication: Verification without studentReady publication gate is rejected', () {
      MicroTestEngine.studentReadyQuestionIds.remove('q_001');
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('student publication gate false'));
    });

    test('Versioning: Superseded versions are rejected', () {
      MicroTestEngine.activeQuestionVersions['q_001'] = 2; // Active version is 2
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(version: 1), // Question is version 1
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('superseded/conflicting version'));
    });
  });

  group('Crucible C2-FIX1 Determinism & Manifest', () {
    test('Seeded assembly is deterministically reproducible', () {
      MicroTestEngine.clearRegistries();
      MicroTestEngine.verifiedFactIds.add('fact_01');
      MicroTestEngine.factSourceDocuments['fact_01'] = 'doc_01';
      MicroTestEngine.reviewerAuthorities['admin_human_01'] = 'PRO_REVIEWER';

      final pool = List.generate(60, (i) {
        final qId = 'q_${i.toString().padLeft(3, '0')}';
        MicroTestEngine.verifiedAnswerKeys.add(qId);
        MicroTestEngine.studentReadyQuestionIds.add(qId);
        return QuestionModel(
          id: qId,
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
          verifiedBy: 'admin_human_01',
          verifiedAt: DateTime(2026, 8, 13),
          atomicTopicIds: const ['atom_01'],
          factId: 'fact_01',
        );
      });

      final test1 = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        seed: 100,
      );
      final test2 = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        seed: 100,
      );
      expect(test1.map((q) => q.id), equals(test2.map((q) => q.id)));
    });
  });
}
