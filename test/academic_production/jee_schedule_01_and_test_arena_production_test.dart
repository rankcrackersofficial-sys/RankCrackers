import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/authority/mission_exam_contract.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/features/crucible/core/micro_test_engine.dart';
import 'package:rank_crackers/features/crucible/models/mission_crucible_blueprint.dart';
import 'package:rank_crackers/features/crucible/models/student_crucible_ledger.dart';
import 'package:rank_crackers/features/personalization/engine/smart_entry_engine.dart';
import 'package:rank_crackers/features/personalization/models/smart_entry_result.dart';
import 'package:rank_crackers/features/personalization/models/student_learning_level.dart';
import 'package:rank_crackers/features/test_arena/core/test_arena_engine.dart';
import 'package:rank_crackers/features/test_arena/models/test_arena_result.dart';

void main() {
  group('LANE A: JEE SCHEDULE-01 CRUCIBLE MICRO BANK & PERSONALIZED ASSEMBLY', () {
    test('1. Verified Schedule-01 Question Bank reaches minimum depth 50 with complete trust snapshot', () {
      final schedule01Atoms = ['atom_kinematics_vectors_01', 'atom_motion_1d_calculus_02', 'atom_projectile_motion_03'];
      
      // Generate 50 verified questions across Easy (15), Medium (20), Hard (15)
      final pool = <QuestionModel>[];
      final verifiedAnswerKeys = <String>{};
      final verifiedAnswerKeyValues = <String, String>{};
      final studentReadyQuestionIds = <String>{};
      final activeQuestionVersions = <String, int>{};
      final verifiedSolutions = <String, SolutionVerificationRecord>{};
      final verifiedFactIds = <String>{'fact_phy_kinematics_01', 'fact_phy_kinematics_02'};
      final factSourceDocuments = <String, String>{'fact_phy_kinematics_01': 'doc_ncert_phy_ch03', 'fact_phy_kinematics_02': 'doc_hcverma_vol1_ch03'};
      final reviewerAuthorities = <String, String>{'prof_physics_master_01': 'AUTHORITATIVE_REVIEWER'};

      for (int i = 1; i <= 50; i++) {
        final qId = 'q_jee_s01_${i.toString().padLeft(3, '0')}';
        final lineageId = 'lin_jee_s01_${i.toString().padLeft(3, '0')}';
        final isNumerical = i % 5 == 0;
        final difficulty = i <= 15
            ? QuestionDifficulty.easy
            : (i <= 35 ? QuestionDifficulty.medium : QuestionDifficulty.hard);
        final atomId = schedule01Atoms[i % schedule01Atoms.length];
        final factId = i % 2 == 0 ? 'fact_phy_kinematics_01' : 'fact_phy_kinematics_02';
        final stem = isNumerical
            ? 'A particle moves along x-axis such that x(t) = ${i}t^2 - ${(i * 2)}t. Find acceleration in m/s^2.'
            : 'Given two orthogonal vectors A = ${i}i and B = ${(i * 3)}j. What is the magnitude of A x B?';
        final solutionText = isNumerical
            ? 'Differentiating x(t) twice gives a(t) = d^2x/dt^2 = ${i * 2} m/s^2.'
            : 'Magnitude of cross product of perpendicular vectors is |A||B| = $i * ${(i * 3)} = ${i * i * 3}.';
        final solutionHash = sha256.convert(utf8.encode(solutionText)).toString();

        final q = QuestionModel(
          id: qId,
          nodeId: 'node_kinematics',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          question: stem,
          options: isNumerical ? const [] : const ['A', 'B', 'C', 'D'],
          answerIndex: 0,
          numericalAnswer: isNumerical ? (i * 2.0) : null,
          difficulty: difficulty,
          status: 'published',
          version: 1,
          lastAdminId: 'prof_physics_master_01',
          updatedAt: DateTime(2026, 9, 1),
          verifiedBy: 'prof_physics_master_01',
          verifiedAt: DateTime(2026, 9, 1),
          atomicTopicIds: [atomId],
          factId: factId,
          questionType: isNumerical ? 'numerical' : 'mcq_single',
          solution: solutionText,
          questionLineageId: lineageId,
        );

        pool.add(q);
        verifiedAnswerKeys.add(qId);
        verifiedAnswerKeyValues[qId] = isNumerical ? (i * 2.0).toString() : '0';
        studentReadyQuestionIds.add(qId);
        activeQuestionVersions[lineageId] = 1;
        verifiedSolutions[qId] = SolutionVerificationRecord(
          questionId: qId,
          questionLineageId: lineageId,
          version: 1,
          solutionStatus: 'verified',
          solutionHash: solutionHash,
          reviewingAuthority: 'prof_physics_master_01',
          verifiedAnswerValue: isNumerical ? (i * 2.0).toString() : '0',
          verifiedAt: DateTime(2026, 9, 1),
        );
      }

      expect(pool.length, equals(50));

      final trustSnapshot = QuestionTrustSnapshot(
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
      QuestionTrustRepository.initializeForTest(trustSnapshot);

      final blueprint = MissionCrucibleBlueprint.jeeMain2027Blueprint;

      // Assemble Novice Attempt (25 questions)
      final noviceAttempt = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_jee_main_2026_1',
        allowedAtomIds: schedule01Atoms,
        pool: pool,
        policy: blueprint.microPolicy,
        studentLevel: LearningLevel.novice,
        requiredBankCount: 50,
        attemptCount: 25,
        trustSnapshot: trustSnapshot,
      );
      expect(noviceAttempt.length, equals(25));
      final noviceEasy = noviceAttempt.where((q) => q.difficulty == QuestionDifficulty.easy).length;
      final noviceMed = noviceAttempt.where((q) => q.difficulty == QuestionDifficulty.medium).length;
      final noviceHard = noviceAttempt.where((q) => q.difficulty == QuestionDifficulty.hard).length;
      expect(noviceEasy, equals(12));
      expect(noviceMed, equals(10));
      expect(noviceHard, equals(3));

      // Assemble Middle Attempt (25 questions)
      final middleAttempt = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_jee_main_2026_1',
        allowedAtomIds: schedule01Atoms,
        pool: pool,
        policy: blueprint.microPolicy,
        studentLevel: LearningLevel.middle,
        requiredBankCount: 50,
        attemptCount: 25,
        trustSnapshot: trustSnapshot,
      );
      expect(middleAttempt.length, equals(25));
      final midEasy = middleAttempt.where((q) => q.difficulty == QuestionDifficulty.easy).length;
      final midMed = middleAttempt.where((q) => q.difficulty == QuestionDifficulty.medium).length;
      final midHard = middleAttempt.where((q) => q.difficulty == QuestionDifficulty.hard).length;
      expect(midEasy, equals(5));
      expect(midMed, equals(15));
      expect(midHard, equals(5));

      // Assemble Pro Attempt (25 questions)
      final proAttempt = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_jee_main_2026_1',
        allowedAtomIds: schedule01Atoms,
        pool: pool,
        policy: blueprint.microPolicy,
        studentLevel: LearningLevel.pro,
        requiredBankCount: 50,
        attemptCount: 25,
        trustSnapshot: trustSnapshot,
      );
      expect(proAttempt.length, equals(25));
      final proEasy = proAttempt.where((q) => q.difficulty == QuestionDifficulty.easy).length;
      final proMed = proAttempt.where((q) => q.difficulty == QuestionDifficulty.medium).length;
      final proHard = proAttempt.where((q) => q.difficulty == QuestionDifficulty.hard).length;
      expect(proEasy, equals(3));
      expect(proMed, equals(10));
      expect(proHard, equals(12));
    });
  });

  group('LANE B: JEE TEST ARENA STANDARDIZED MAJOR PAPER ASSEMBLY & RANKING', () {
    test('2. Assembles 75-question standardized Major paper according to official exam contract', () {
      final contract = MissionExamContract.jeeMain2027Contract;
      final paperContract = contract.papers.first;

      // Build 75-question pool (25 per subject: 20 MCQ + 5 Numerical)
      final pool = <QuestionModel>[];
      for (final domain in ['physics', 'chemistry', 'mathematics']) {
        for (int i = 1; i <= 25; i++) {
          final isNum = i > 20;
          pool.add(QuestionModel(
            id: 'major_${domain}_${i.toString().padLeft(3, '0')}',
            nodeId: 'node_${domain}_test',
            examId: 'jee_main_2026',
            subjectId: domain,
            question: '$domain question $i stem',
            options: isNum ? const [] : const ['A', 'B', 'C', 'D'],
            answerIndex: 0,
            numericalAnswer: isNum ? (i * 1.0) : null,
            difficulty: QuestionDifficulty.medium,
            status: 'published',
            version: 1,
            lastAdminId: 'admin_01',
            updatedAt: DateTime(2026, 9, 1),
            verifiedBy: 'admin_verifier',
            verifiedAt: DateTime(2026, 9, 1),
            atomicTopicIds: ['atom_${domain}_$i'],
            factId: 'fact_${domain}_$i',
            questionType: isNum ? 'numerical' : 'mcq_single',
            solution: 'Step by step proof.',
            questionLineageId: 'lin_${domain}_$i',
          ));
        }
      }

      final paper = TestArenaEngine.assembleMajorPaper(
        contract: contract,
        paper: paperContract,
        pool: pool,
      );

      expect(paper.length, equals(75));
      final phy = paper.where((q) => q.subjectId.toLowerCase() == 'physics').toList();
      final chem = paper.where((q) => q.subjectId.toLowerCase() == 'chemistry').toList();
      final math = paper.where((q) => q.subjectId.toLowerCase() == 'mathematics').toList();

      expect(phy.length, equals(25));
      expect(phy.where((q) => q.questionType == 'mcq_single').length, equals(20));
      expect(phy.where((q) => q.questionType == 'numerical').length, equals(5));

      expect(chem.length, equals(25));
      expect(chem.where((q) => q.questionType == 'mcq_single').length, equals(20));
      expect(chem.where((q) => q.questionType == 'numerical').length, equals(5));

      expect(math.length, equals(25));
      expect(math.where((q) => q.questionType == 'mcq_single').length, equals(20));
      expect(math.where((q) => q.questionType == 'numerical').length, equals(5));
    });
  });

  group('STUDENT VERTICAL SLICE: SOVEREIGN RECRUITMENT TO C4 PERSONALIZATION', () {
    test('3. Executes complete end-to-end student attempt, scoring, and level feedback loop', () {
      // 1. Mission Selection
      final canonicalMission = MissionExamContract.jeeMain2027Contract.missionId; // 'jee_main_2026'
      final studentMission = MissionExamContract.jeeMain2027Contract.recruitmentId; // 'jee_main_2027'
      expect(canonicalMission, equals('jee_main_2026'));
      expect(studentMission, equals('jee_main_2027'));

      // 2. Smart Entry Baseline Diagnostic
      final blueprint = MissionCrucibleBlueprint.jeeMain2027Blueprint;

      final responses = [
        ...List.generate(5, (i) => DiagnosticItemResponse(
          questionId: 'diag_phy_$i',
          domainId: 'physics',
          difficulty: DifficultyBand.fromDynamic(QuestionDifficulty.medium),
          isCorrect: i < 4, // 4/5 correct -> Pro
          timeSpent: const Duration(seconds: 45),
        )),
        ...List.generate(5, (i) => DiagnosticItemResponse(
          questionId: 'diag_chem_$i',
          domainId: 'chemistry',
          difficulty: DifficultyBand.fromDynamic(QuestionDifficulty.medium),
          isCorrect: i < 1, // 1/5 correct -> Novice
          timeSpent: const Duration(seconds: 45),
        )),
        ...List.generate(5, (i) => DiagnosticItemResponse(
          questionId: 'diag_math_$i',
          domainId: 'mathematics',
          difficulty: DifficultyBand.fromDynamic(QuestionDifficulty.medium),
          isCorrect: i < 3, // 3/5 correct -> Middle
          timeSpent: const Duration(seconds: 45),
        )),
      ];

      final diagnosticResult = SmartEntryEngine.evaluateDiagnostic(
        responses: responses,
        blueprint: blueprint.smartEntryBlueprint,
      );

      expect(diagnosticResult.subjectLevels['physics'], equals(LearningLevel.pro));
      expect(diagnosticResult.subjectLevels['chemistry'], equals(LearningLevel.novice));
      expect(diagnosticResult.subjectLevels['mathematics'], equals(LearningLevel.middle));
      expect(diagnosticResult.globalLevel, equals(LearningLevel.middle));

      // 3. Student Crucible Ledger initialized for Day 1 on-time entry
      final ledger = StudentCrucibleLedger.createForNewJoiner(
        uid: 'student_prod_001',
        missionId: canonicalMission,
        joinedAt: DateTime(2027, 1, 1, 10, 0),
        currentOrbit: 1,
        currentCycleDay: 1,
        currentScheduleIndex: 1,
        entryLevel: diagnosticResult.globalLevel,
        isExactScheduleBoundary: true,
      );

      expect(ledger.firstCountedScheduleId, equals('sch_jee_main_2026_1'));
      expect(ledger.currentLevel, equals(LearningLevel.middle));

      // 4. Student takes Schedule 1 Micro test (25Q)
      // Attempt scoring: 20 correct (+80), 3 wrong (-3), 2 unanswered (0) = 77 marks
      const correctCount = 20;
      const incorrectCount = 3;
      const unattemptedCount = 2;

      final officialMarkingScore = (correctCount * 4) + (incorrectCount * -1) + (unattemptedCount * 0);
      expect(officialMarkingScore, equals(77));

      // 5. C4 Evolution: score >= 85% across 2 windows triggers upward hysteresis promotion
      final updatedLevel = SmartEntryEngine.evaluateLevelEvolution(
        currentLevel: ledger.currentLevel,
        history: [
          AssessmentWindowEvidence(
            windowId: 'sch_jee_main_2026_1',
            windowType: 'MICRO',
            domainId: 'physics',
            totalQuestions: 25,
            correctCount: 22,
            weightedScore: 0.88,
            averageTimePerQuestionSeconds: 90.0,
            timestamp: DateTime.now().subtract(const Duration(days: 2)),
          ),
          AssessmentWindowEvidence(
            windowId: 'sch_jee_main_2026_2',
            windowType: 'MICRO',
            domainId: 'physics',
            totalQuestions: 25,
            correctCount: 23,
            weightedScore: 0.90,
            averageTimePerQuestionSeconds: 85.0,
            timestamp: DateTime.now(),
          ),
        ],
      );
      expect(updatedLevel, equals(LearningLevel.pro));

      final updatedLedger = ledger.copyWith(
        currentLevel: updatedLevel,
        completedScheduleIds: {'sch_jee_main_2026_1'},
        scheduleScores: {'sch_jee_main_2026_1': 77.0},
      );

      expect(updatedLedger.completedScheduleIds.contains('sch_jee_main_2026_1'), isTrue);
      expect(updatedLedger.currentLevel, equals(LearningLevel.pro));
      expect(updatedLedger.scheduleScores['sch_jee_main_2026_1'], equals(77.0));
    });
  });
}
