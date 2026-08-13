import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
import 'package:rank_crackers/features/crucible/models/crucible_schedule.dart';
import 'package:rank_crackers/features/crucible/core/micro_test_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';

void main() {
  group('Crucible C1 Anti-Drift Regression Guard', () {
    test('C1_TEMPORAL_REGRESSION = 0', () {
      // Regression guard verifying timing config is frozen
      expect(CrucibleClockEngine.courseStartHour, 10);
      expect(CrucibleClockEngine.testStartHour, 9);
      expect(CrucibleClockEngine.terminalDaySentinel, 101);
    });
  });

  group('Crucible C2 Question Contract & Eligibility Gate', () {
    final validQuestion = QuestionModel(
      id: 'q_001',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: r'A train moves at constant speed $20\text{ m/s}$. Describe the book motion.',
      options: const ['At rest relative to carriage', 'Moving relative to carriage', 'Accelerating', 'None'],
      answerIndex: 0,
      difficulty: QuestionDifficulty.easy,
      status: 'verified',
      version: 1,
      lastAdminId: 'admin_human_01',
      updatedAt: DateTime(2026, 8, 13),
      verifiedBy: 'admin_human_01',
      verifiedAt: DateTime(2026, 8, 13),
      atomicTopicIds: const ['atom_01'],
    );

    test('Valid Question is accepted', () {
      final actualErr = MicroTestEngine.checkQuestionEligibility(
        validQuestion,
        'sch_01',
        const ['atom_01', 'atom_02'],
      );
      expect(actualErr, isNull);
    });

    test('Missing question ID is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(id: ''),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('schema invalid'));
    });

    test('Missing stem is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(question: '  '),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('schema invalid'));
    });

    test('MCQ with incorrect options count is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(options: const ['A', 'B', 'C']),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('answer key unverified'));
    });

    test('Out of bounds answer index is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(answerIndex: 5),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('answer key unverified'));
    });

    test('Status draft is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(status: 'draft'),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('review failed'));
    });

    test('Lacking human verification signature is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(verifiedBy: 'system'), // model self-promotion
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('model-only promotion'));
    });

    test('Unsafe placeholder text is rejected', () {
      final err = MicroTestEngine.checkQuestionEligibility(
        validQuestion.copyWith(question: 'This is a placeholder stem'),
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('unsafe placeholder'));
    });
  });

  group('Crucible C2 Scope Leakage Enforcement', () {
    final validQuestion = QuestionModel(
      id: 'q_001',
      nodeId: 'node_physics_1',
      examId: 'jee_main_2026',
      subjectId: 'Physics',
      question: 'Stem',
      options: const ['A', 'B', 'C', 'D'],
      answerIndex: 0,
      difficulty: QuestionDifficulty.easy,
      status: 'verified',
      version: 1,
      lastAdminId: 'admin_human_01',
      updatedAt: DateTime(2026, 8, 13),
      verifiedBy: 'admin_human_01',
      verifiedAt: DateTime(2026, 8, 13),
    );

    test('Rejects atom outside schedule scope (leakage safety)', () {
      final q = validQuestion.copyWith(atomicTopicIds: const ['atom_02']); // Scheduled is atom_01
      final err = MicroTestEngine.checkQuestionEligibility(
        q,
        'sch_01',
        const ['atom_01'],
      );
      expect(err, contains('mapping error'));
    });

    test('Accepts atom inside schedule scope', () {
      final q = validQuestion.copyWith(atomicTopicIds: const ['atom_01']);
      final err = MicroTestEngine.checkQuestionEligibility(
        q,
        'sch_01',
        const ['atom_01', 'atom_02'],
      );
      expect(err, isNull);
    });
  });

  group('Crucible C2 Question Count & Deterministic Assembly', () {
    List<QuestionModel> generatePool(int count, {required List<String> atomIds}) {
      return List.generate(count, (i) {
        return QuestionModel(
          id: 'q_${i.toString().padLeft(3, '0')}',
          nodeId: 'node_1',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          question: 'Valid question stem $i',
          options: const ['A', 'B', 'C', 'D'],
          answerIndex: 0,
          difficulty: QuestionDifficulty.medium,
          status: 'published',
          version: 1,
          lastAdminId: 'admin_human_01',
          updatedAt: DateTime(2026, 8, 13),
          verifiedBy: 'admin_human_02',
          verifiedAt: DateTime(2026, 8, 13),
          atomicTopicIds: atomIds,
        );
      });
    }

    test('Pool size 0 -> NOT_READY (returns empty list)', () {
      final test = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: [],
        requiredCount: 50,
      );
      expect(test, isEmpty);
    });

    test('Pool size 49 -> NOT_READY (returns empty list)', () {
      final pool = generatePool(49, atomIds: const ['atom_01']);
      final test = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 50,
      );
      expect(test, isEmpty);
    });

    test('Pool size 50 -> returns exactly 50 questions', () {
      final pool = generatePool(50, atomIds: const ['atom_01']);
      final test = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 50,
      );
      expect(test.length, 50);
      expect(test.map((q) => q.id).toSet().length, 50); // unique
    });

    test('Deterministic assembly selects same questions for same seed', () {
      final pool = generatePool(60, atomIds: const ['atom_01']);
      final test1 = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 50,
        seed: 42,
      );
      final test2 = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 50,
        seed: 42,
      );
      expect(test1.map((q) => q.id), equals(test2.map((q) => q.id)));
    });

    test('Deduplication: duplicate question IDs are filtered', () {
      final pool = generatePool(50, atomIds: const ['atom_01']);
      // Inject duplicate
      pool.add(pool.first);
      final test = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_01',
        allowedAtomIds: const ['atom_01'],
        pool: pool,
        requiredCount: 50,
      );
      expect(test.length, 50);
    });
  });

  group('Crucible C2 42-Slot Manifest & Census', () {
    test('Verify complete 42-slot manifest mapping', () {
      final schedules = List.generate(42, (i) {
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
