import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/authority/mission_exam_contract.dart';
import 'package:rank_crackers/core/models/question_difficulty.dart';
import 'package:rank_crackers/core/models/question_model.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/core/micro_test_engine.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/models/mission_crucible_blueprint.dart';
import 'package:rank_crackers/features/crucible/models/student_crucible_ledger.dart';
import 'package:rank_crackers/features/personalization/engine/smart_entry_engine.dart';
import 'package:rank_crackers/features/personalization/models/student_learning_level.dart';

void main() {
  group('Mission-Adaptive Architecture & Configuration Boundary Tests', () {
    // Custom non-JEE blueprint (e.g. 60-day cycle, 5 phases, 4 schedules/phase = 20 schedules, 15Q Micro / 30 bank)
    const customBlueprint = MissionCrucibleBlueprint(
      missionId: 'custom_state_service_2027',
      recruitmentId: 'custom_state_recruitment_2027',
      blueprintVersion: '1.0.0',
      cycleLengthDays: 60,
      phaseCount: 5,
      schedulesPerPhase: 4,
      hoursPerSchedule: 48,
      learningHoursPerSchedule: 44,
      microHoursPerSchedule: 4,
      rebuildDurationHours: 48,
      macroDurationHours: 4,
      recoveryDurationHours: 44,
      smartEntryBlueprint: SmartEntryBlueprint(
        domainIds: ['history', 'geography', 'polity', 'reasoning'],
        calibrationItemsPerDomain: 4,
        maxAdaptiveTargetItems: 8,
        maxTotalQuestions: 24,
        durationMinutes: 45,
        confidenceThreshold: 0.80,
      ),
      microPolicy: MicroPolicy(
        attemptQuestionCount: 15,
        attemptDurationMinutes: 30,
        minimumVerifiedBankDepth: 30,
      ),
      macroPolicy: MacroPolicy(
        attemptQuestionCount: 40,
        attemptDurationMinutes: 90,
        minimumVerifiedPhaseBankDepth: 80,
        schedulesIntegrated: 4,
      ),
    );

    final baseTime = DateTime(2027, 1, 1, 10, 0, 0);

    CrucibleProtocolState createTestState({
      String recruitmentId = 'jee_main_2027',
      DateTime? startTime,
      int phaseIndex = 1,
      int scheduleIndex = 1,
      String status = 'study',
    }) {
      final start = startTime ?? baseTime;
      return CrucibleProtocolState(
        recruitmentId: recruitmentId,
        phaseIndex: phaseIndex,
        scheduleIndex: scheduleIndex,
        currentScheduleId: 'sch_${recruitmentId}_$scheduleIndex',
        status: status,
        scheduleStartTime: start,
        protocolStartTime: start,
        currentBoundaryTime: start.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );
    }

    QuestionModel createTestQuestion({
      required String id,
      String subjectId = 'physics',
      QuestionDifficulty difficulty = QuestionDifficulty.medium,
      String questionType = 'mcq_single',
      String factId = 'fact_01',
      String lineageId = 'lin_01',
      int version = 1,
      String atomId = 'atom_01',
      int answerIndex = 0,
    }) {
      return QuestionModel(
        id: id,
        questionLineageId: lineageId,
        version: version,
        questionType: questionType,
        question: 'Test question stem for $id',
        options: const ['Option A', 'Option B', 'Option C', 'Option D'],
        answerIndex: answerIndex,
        difficulty: difficulty,
        examId: 'jee_main_2027',
        subjectId: subjectId,
        nodeId: 'node_01',
        atomicTopicIds: [atomId],
        status: 'published',
        verifiedBy: 'pro_reviewer_01',
        verifiedAt: DateTime.now(),
        updatedAt: DateTime.now(),
        solution: 'Step-by-step solution derivation.',
        factId: factId,
      );
    }

    QuestionTrustSnapshot createFullyHydratedSnapshot({
      required List<QuestionModel> questions,
    }) {
      final factIds = questions.map((q) => q.factId!).toSet();
      final factDocs = {for (var q in questions) q.factId!: 'doc_source_01'};
      final revAuth = {'pro_reviewer_01': 'Senior Reviewer'};
      final ansKeys = questions.map((q) => q.id).toSet();
      final ansValues = {for (var q in questions) q.id: q.answerIndex.toString()};
      final readyIds = questions.map((q) => q.id).toSet();
      final activeVer = {for (var q in questions) (q.questionLineageId ?? q.id): q.version};
      final verSols = {
        for (var q in questions)
          q.id: SolutionVerificationRecord(
            questionId: q.id,
            questionLineageId: q.questionLineageId ?? q.id,
            version: q.version,
            solutionStatus: 'verified',
            solutionHash: MicroTestEngine.hashSolution(q.solution),
            reviewingAuthority: 'pro_reviewer_01',
            verifiedAnswerValue: q.answerIndex.toString(),
            verifiedAt: DateTime.now(),
          )
      };

      return QuestionTrustSnapshot(
        verifiedFactIds: factIds,
        factSourceDocuments: factDocs,
        heldFactIds: const {},
        reviewerAuthorities: revAuth,
        verifiedAnswerKeys: ansKeys,
        verifiedAnswerKeyValues: ansValues,
        studentReadyQuestionIds: readyIds,
        pyqPaperEvidence: const {},
        activeQuestionVersions: activeVer,
        verifiedSolutions: verSols,
      );
    }

    test('1. Generic Clock Engine supports custom cycle length (60 days) and wraps correctly', () {
      final state = createTestState(recruitmentId: 'custom_state_service_2027');

      // Day 1
      expect(CrucibleClockEngine.getCycleDay(state: state, now: baseTime, blueprint: customBlueprint), equals(1));
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: baseTime, now: baseTime, blueprint: customBlueprint), equals(1));

      // Day 60 (last day of Orbit 1)
      final day60 = baseTime.add(const Duration(days: 59));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day60, blueprint: customBlueprint), equals(60));
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: baseTime, now: day60, blueprint: customBlueprint), equals(1));

      // Day 61 (wraps to Day 1 of Orbit 2)
      final day61 = baseTime.add(const Duration(days: 60));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day61, blueprint: customBlueprint), equals(1));
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: baseTime, now: day61, blueprint: customBlueprint), equals(2));
    });

    test('2. JEE Main 2027 Profile resolves 98-day cycle, 7 phases, and 42 schedules', () {
      final state = createTestState(recruitmentId: 'jee_main_2027');

      // Day 1
      expect(CrucibleClockEngine.getCycleDay(state: state, now: baseTime), equals(1));
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: baseTime, now: baseTime), equals(1));

      // Day 98
      final day98 = baseTime.add(const Duration(days: 97));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day98), equals(98));

      // Day 99 wraps to Day 1 of Orbit 2
      final day99 = baseTime.add(const Duration(days: 98));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day99), equals(1));
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: baseTime, now: day99), equals(2));
    });

    test('3. Unconfigured mission fails closed (JEE_PROFILE_FALLBACK_TO_OTHER_MISSIONS = 0)', () {
      final unconfiguredBlueprint = MissionCrucibleBlueprintRegistry.getBlueprint('unknown_mission_2027');
      expect(unconfiguredBlueprint, isNull);

      final unconfiguredContract = MissionExamContractRegistry.getContract('unknown_mission_2027');
      expect(unconfiguredContract, isNull);
    });

    test('4. Generic Smart Entry Engine supports custom multi-domain blueprint', () {
      final questions = <QuestionModel>[];
      final domains = ['history', 'geography', 'polity', 'reasoning'];

      for (var d in domains) {
        for (int i = 1; i <= 10; i++) {
          final diff = i <= 4 ? QuestionDifficulty.easy : (i <= 8 ? QuestionDifficulty.medium : QuestionDifficulty.hard);
          questions.add(createTestQuestion(
            id: 'q_${d}_$i',
            subjectId: d,
            difficulty: diff,
            atomId: 'atom_${d}_$i',
          ));
        }
      }

      final paper = SmartEntryEngine.assembleSmartEntryPaper(
        pool: questions,
        blueprint: customBlueprint.smartEntryBlueprint,
      );

      // 4 domains x 4 items = 16 calibration items
      expect(paper.length, equals(16));
      for (var d in domains) {
        expect(paper.where((q) => q.subjectId == d).length, equals(4));
      }

      // Evaluate responses
      final responses = paper.map((q) => DiagnosticItemResponse(
        questionId: q.id,
        domainId: q.subjectId,
        difficulty: DifficultyBand.fromDynamic(q.difficulty),
        isCorrect: true,
        timeSpent: const Duration(seconds: 45),
      )).toList();

      final result = SmartEntryEngine.evaluateDiagnostic(
        responses: responses,
        blueprint: customBlueprint.smartEntryBlueprint,
      );

      expect(result.globalLevel, equals(LearningLevel.pro));
      expect(result.subjectLevels.keys.toSet(), equals(domains.toSet()));
    });

    test('5. Generic Micro Factory enforces policy bank depth and attempt counts', () {
      final questions = List.generate(
        35,
        (i) => createTestQuestion(
          id: 'q_micro_$i',
          atomId: 'atom_01',
          lineageId: 'lin_micro_$i',
        ),
      );
      final snapshot = createFullyHydratedSnapshot(questions: questions);

      // Custom policy requires bank >= 30, attempt = 15
      final attempt = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_custom_01',
        allowedAtomIds: ['atom_01'],
        pool: questions,
        policy: customBlueprint.microPolicy,
        requiredBankCount: customBlueprint.microPolicy.minimumVerifiedBankDepth,
        attemptCount: customBlueprint.microPolicy.attemptQuestionCount,
        trustSnapshot: snapshot,
      );

      expect(attempt.length, equals(15));

      // If bank has only 25 questions (< 30 required), assembly fails closed with []
      final deficitAttempt = MicroTestEngine.assembleMicroTest(
        scheduleId: 'sch_custom_01',
        allowedAtomIds: ['atom_01'],
        pool: questions.take(25).toList(),
        policy: customBlueprint.microPolicy,
        requiredBankCount: customBlueprint.microPolicy.minimumVerifiedBankDepth,
        attemptCount: customBlueprint.microPolicy.attemptQuestionCount,
        trustSnapshot: snapshot,
      );
      expect(deficitAttempt, isEmpty);
    });

    test('6. Student Crucible Ledger enforces PARTIAL_ENTRY_PUNISHMENT = 0 for late joiners', () {
      // Case A: Exact start of Phase 2 (Day 15 10:00 -> Schedule 7 exact boundary)
      final exactLedger = StudentCrucibleLedger.createForNewJoiner(
        uid: 'student_exact_01',
        missionId: 'jee_main_2026',
        joinedAt: DateTime(2027, 1, 15, 10, 0),
        currentOrbit: 1,
        currentCycleDay: 15,
        currentScheduleIndex: 7,
        entryLevel: LearningLevel.middle,
        isExactScheduleBoundary: true,
      );
      expect(exactLedger.joinedOrbit, equals(1));
      expect(exactLedger.joinedCycleDay, equals(15));
      expect(exactLedger.firstCountedScheduleId, equals('sch_jee_main_2026_7'));

      // Case B: Mid-Schedule 7 join (Day 15 16:00 -> Schedule 7 in progress)
      final midLedger = StudentCrucibleLedger.createForNewJoiner(
        uid: 'student_mid_01',
        missionId: 'jee_main_2026',
        joinedAt: DateTime(2027, 1, 15, 16, 0),
        currentOrbit: 1,
        currentCycleDay: 15,
        currentScheduleIndex: 7,
        entryLevel: LearningLevel.middle,
        isExactScheduleBoundary: false,
      );
      // Schedule 7 is immediately open for unpenalized practice; first formally counted is Schedule 8
      expect(midLedger.firstCountedScheduleId, equals('sch_jee_main_2026_8'));
      expect(midLedger.completedScheduleIds, isEmpty);
      expect(midLedger.isMissionReady, isFalse);
    });
  });
}
