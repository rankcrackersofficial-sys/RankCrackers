import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/canonical_academic_ref.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_engine.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/models/mission_crucible_blueprint.dart';
import 'package:rank_crackers/features/digibook/domain/services/digibook_canonical_bridge_service.dart';

void main() {
  group('RC Unified Syllabus DigiBook Crucible 98-Day Continuous Ring Tests', () {
    final start = DateTime(2026, 1, 1, 10, 0, 0);

    test('1. 98-Day Ring Topology & Day 98 -> Day 1 Continuous Rotation', () {
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: start,
        protocolStartTime: start,
        currentBoundaryTime: start.add(const Duration(hours: 48)),
        lastProgressAt: start,
        isVIP: true,
        isStalled: false,
      );

      // Day 1
      expect(CrucibleClockEngine.getCycleDay(state: state, now: start), equals(1));

      // Day 13: Rebuild Window (Day 13 = 12 elapsed days)
      final day13 = start.add(const Duration(days: 12, hours: 12));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day13), equals(13));
      final evalDay13 = CrucibleEngine.evaluateState(
        state: state,
        now: day13,
        completedMicroIds: [],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(evalDay13.status, equals('rebuild'));

      // Day 14: Macro Window (Day 14 = 13 elapsed days)
      final day14 = start.add(const Duration(days: 13, hours: 10));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day14), equals(14));
      final evalDay14 = CrucibleEngine.evaluateState(
        state: state,
        now: day14,
        completedMicroIds: [],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(evalDay14.status, equals('macro_test'));

      // Day 97: Rebuild Window (Phase 7 Rebuild)
      final day97 = start.add(const Duration(days: 96, hours: 12));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day97), equals(97));

      // Day 98: Final Macro Window of Cycle 1
      final day98 = start.add(const Duration(days: 97, hours: 10));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day98), equals(98));

      // Day 99: Continuous Ring Rotates Back to Day 1 of Cycle 2 (NO DAY 99 / TERMINAL ENDPOINT)
      final day99 = start.add(const Duration(days: 98, hours: 2));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day99), equals(1),
          reason: 'DAY98_TO_DAY1_ROTATION must be YES.');

      final evalDay99 = CrucibleEngine.evaluateState(
        state: state,
        now: day99,
        completedMicroIds: [],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(evalDay99.status, equals('study'),
          reason: 'Day 99 rotates back to study status for Phase 1.');
    });

    test('2. Global Mission Clock & Late Join Safeguard', () {
      final missionStart = DateTime(2026, 1, 1, 10, 0, 0);

      // Student joins on Day 37 (mid-mission)
      final studentJoinTime = missionStart.add(const Duration(days: 36, hours: 4));

      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 3,
        scheduleIndex: 19,
        currentScheduleId: 'sch_jee_main_2027_19',
        status: 'study',
        scheduleStartTime: studentJoinTime,
        protocolStartTime: missionStart, // Global clock start
        currentBoundaryTime: studentJoinTime.add(const Duration(hours: 48)),
        lastProgressAt: studentJoinTime,
        isVIP: true,
        isStalled: false,
      );

      // Student joins global position (Day 37), NOT reset to Day 1
      final currentDay = CrucibleClockEngine.getCycleDay(state: state, now: studentJoinTime);
      expect(currentDay, equals(37),
          reason: 'PER_STUDENT_PRIVATE_CRUCIBLE_DAY1_RESET must be NO.');

      final evalLateJoin = CrucibleEngine.evaluateState(
        state: state,
        now: studentJoinTime,
        completedMicroIds: [],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );

      expect(evalLateJoin.status, equals('study'));
      expect(evalLateJoin.isStalled, isFalse,
          reason: 'LATE_JOIN_PARTIAL_SCHEDULE_FAKE_FAILURE = 0.');
    });

    test('3. Shared DigiBook Route Integration (Zero Title Matching & Zero Hardcoded Revisions)', () {
      final bridge = DigiBookCanonicalBridgeService.instance;
      bridge.initializeFromMap({
        'version': '1.0.0',
        'lessons': [
          {
            'guId': 'GU_JEEMAIN2027_MAT_9BB8FB46',
            'subject': 'Mathematics',
            'canonicalNodeId': 'JEE_MAIN_2026_MAT_U01_T_00000001',
            'topic': 'Sets',
            'lessonRevision': 'REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001',
            'atomicFactIds': ['AF_01', 'AF_02'],
            'factSemantics': 'SOURCE_FACT_COMPLETE',
            'privateLessonAuthorityPath': '',
          }
        ]
      });

      // Crucible resolves via exact canonicalNodeId, NOT title string
      final resolveResult = bridge.resolveCanonicalNode('JEE_MAIN_2026_MAT_U01_T_00000001');
      expect(resolveResult.isMapped, isTrue);
      expect(resolveResult.primaryEntry!.guId, equals('GU_JEEMAIN2027_MAT_9BB8FB46'));

      // Unmapped node fails closed
      final unmappedResult = bridge.resolveCanonicalNode('UNMAPPED_CRUCIBLE_NODE');
      expect(unmappedResult.isMapped, isFalse,
          reason: 'CRUCIBLE_TITLE_MATCH_ROUTE_COUNT = 0.');
    });

    test('4. Blueprint Constitution & Exact 24-Hour Calendar Day Time Allocation', () {
      final bp = MissionCrucibleBlueprint.jeeMain2027Blueprint;
      expect(bp.cycleLengthDays, equals(98),
          reason: 'CRUCIBLE_RING_LENGTH_DAYS = 98.');
      expect(bp.phaseCount, equals(7));
      expect(bp.schedulesPerPhase, equals(6));
      expect(bp.totalSchedules, equals(42),
          reason: 'MICRO_SCHEDULE_COUNT = 42.');
      expect(bp.microPolicy.attemptQuestionCount, equals(25));
      expect(bp.microPolicy.attemptDurationMinutes, equals(60));
      expect(bp.macroPolicy.attemptQuestionCount, equals(50));
      expect(bp.macroPolicy.attemptDurationMinutes, equals(120));

      // Exact 24h calendar day time accounting
      expect(bp.rebuildDurationHours, equals(24),
          reason: 'Rebuild day must be exact 24 calendar hours.');
      expect(bp.macroDurationHours + bp.recoveryDurationHours, equals(24),
          reason: 'Macro test (2h) + non-exclusive recovery buffer (22h) must equal exact 24h.');
    });

    test('5. Diagnostic & Test Arena Fail-Closed Canonical Academic Ref Laws', () {
      // Diagnostic item without explicit GU is NOT routable
      final diagRef = CanonicalAcademicRef.fromDiagnosticItem(
        missionId: 'jee_main_2027',
        domainId: 'physics',
        questionId: 'DIAG_PHY_001',
      );
      expect(diagRef.isRoutable, isFalse,
          reason: 'Diagnostic item without explicit GU must fail closed.');

      // Test Arena Event level is NOT routable
      final eventRef = CanonicalAcademicRef.fromTestArenaEvent(
        examId: 'jee_main_2026',
        paperId: 'PAPER_1',
      );
      expect(eventRef.isRoutable, isFalse,
          reason: 'Test Arena event level cannot alias to a single GU.');
    });
  });
}
