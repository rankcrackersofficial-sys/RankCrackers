import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_engine.dart';

void main() {
  group('Crucible C1 Sovereign Start Law (C1-FIX2)', () {
    test('Boundary: 09:59 AM enrollment -> same day 10:00 AM start', () {
      final enrollment = DateTime(2026, 8, 13, 9, 59);
      final start = CrucibleClockEngine.getNormalizedStart(enrollment);
      expect(start, DateTime(2026, 8, 13, 10, 0));
    });

    test('Boundary: 10:00 AM enrollment -> same day 10:00 AM start', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final start = CrucibleClockEngine.getNormalizedStart(enrollment);
      expect(start, DateTime(2026, 8, 13, 10, 0));
    });

    test('Boundary: 09:59 PM enrollment -> same day 10:00 AM start', () {
      final enrollment = DateTime(2026, 8, 13, 21, 59);
      final start = CrucibleClockEngine.getNormalizedStart(enrollment);
      expect(start, DateTime(2026, 8, 13, 10, 0));
    });

    test('Boundary: 10:00 PM enrollment -> next day 10:00 AM start', () {
      final enrollment = DateTime(2026, 8, 13, 22, 0);
      final start = CrucibleClockEngine.getNormalizedStart(enrollment);
      expect(start, DateTime(2026, 8, 14, 10, 0));
    });

    test('Boundary: 11:59 PM enrollment -> next day 10:00 AM start', () {
      final enrollment = DateTime(2026, 8, 13, 23, 59);
      final start = CrucibleClockEngine.getNormalizedStart(enrollment);
      expect(start, DateTime(2026, 8, 14, 10, 0));
    });

    test('Boundary: 00:00 AM next day -> same day (next day relative) 10:00 AM start', () {
      final enrollment = DateTime(2026, 8, 14, 0, 0);
      final start = CrucibleClockEngine.getNormalizedStart(enrollment);
      expect(start, DateTime(2026, 8, 14, 10, 0));
    });

    test('Boundary: 09:59 AM next day -> same day 10:00 AM start', () {
      final enrollment = DateTime(2026, 8, 14, 9, 59);
      final start = CrucibleClockEngine.getNormalizedStart(enrollment);
      expect(start, DateTime(2026, 8, 14, 10, 0));
    });
  });

  group('Crucible C1 Clock Boundaries', () {
    test('Boundary: Before Day 1', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final nowBefore = pStart.subtract(const Duration(hours: 1));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowBefore);
      expect(day, 1);
    });

    test('Boundary: Day 1', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final nowDay1 = pStart.add(const Duration(hours: 5));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowDay1);
      expect(day, 1);
    });

    test('Boundary: Day 100', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final nowDay100 = pStart.add(const Duration(days: 99, hours: 1));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowDay100);
      expect(day, 100);
    });

    test('Boundary: After Day 100 Terminal State (Clamped Sentinel)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final nowAfter = pStart.add(const Duration(days: 105));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowAfter);
      expect(day, CrucibleClockEngine.terminalDaySentinel); // Day 101 terminal sentinel
    });
  });

  group('Crucible C1 Micro Clock & Schedule Lifecycle', () {
    test('Schedule 1 Active (hour 0 to 47)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final lifecycle = CrucibleEngine.getScheduleLifecycleState(
        state: state,
        targetScheduleIndex: 1,
        now: pStart.add(const Duration(hours: 10)),
        completedMicroIds: [],
      );
      expect(lifecycle, 'active');
    });

    test('Schedule 1 Micro Test Required (hour 47 to 48)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final lifecycle = CrucibleEngine.getScheduleLifecycleState(
        state: state,
        targetScheduleIndex: 1,
        now: pStart.add(const Duration(hours: 47, minutes: 30)),
        completedMicroIds: [],
      );
      expect(lifecycle, 'micro-test-required');
    });

    test('Schedule 1 Overdue (hour 48+ before transition)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final lifecycle = CrucibleEngine.getScheduleLifecycleState(
        state: state,
        targetScheduleIndex: 1,
        now: pStart.add(const Duration(hours: 49)),
        completedMicroIds: [],
      );
      expect(lifecycle, 'overdue');
    });
  });

  group('Crucible C1 Phase Transition Clock & Rebuild', () {
    test('End of schedule 6 Micro Test transitions to Rebuild Window 1', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      // Schedule 6 ends at Day 12, 10:00 AM (which is 12 days elapsed)
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 6,
        currentScheduleId: 'sch_jee_main_2027_6',
        status: 'study',
        scheduleStartTime: pStart.add(const Duration(days: 10)), // Sch 6 starts at Day 11, 10:00 AM
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(days: 12)),
        isVIP: false,
        isStalled: false,
      );

      final nowEnd = pStart.add(const Duration(days: 12));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowEnd,
        completedMicroIds: ['micro_06'], // Micro 6 completed
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );

      expect(nextState.status, 'rebuild');
      expect(nextState.currentBoundaryTime, pStart.add(const Duration(days: 13, hours: 9))); // Day 14, 09:00 AM
    });

    test('Rebuild Day 13 and Day 14 morning are active, then transition to Macro at 09:00 AM', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 6,
        currentScheduleId: 'sch_jee_main_2027_6',
        status: 'rebuild',
        scheduleStartTime: pStart.add(const Duration(days: 12)),
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(days: 13, hours: 9)), // Day 14, 09:00 AM
        isVIP: false,
        isStalled: false,
      );

      // 1. Day 13, 05:00 PM is rebuild
      final nowRebuild = pStart.add(const Duration(days: 12, hours: 7));
      var nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowRebuild,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );
      expect(nextState.status, 'rebuild');

      // 2. Day 14, 09:00 AM transitions to macro_test
      final nowMacro = pStart.add(const Duration(days: 13, hours: 9));
      nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowMacro,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );
      expect(nextState.status, 'macro_test');
    });

    test('Day 14 at 11:00 AM close transitions to Phase 2 Schedule 7 automatically (Never-Wait)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 6,
        currentScheduleId: 'sch_jee_main_2027_6',
        status: 'macro_test',
        scheduleStartTime: pStart.add(const Duration(days: 13, hours: 9)),
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(days: 13, hours: 11)), // Day 14, 11:00 AM
        isVIP: false,
        isStalled: false,
      );

      // Evaluate past 11:00 AM without completing Macro Test
      final nowPast = pStart.add(const Duration(days: 13, hours: 11, minutes: 1));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowPast,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [], // Not completed!
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );

      // Never-Wait transitions to Phase 2 study
      expect(nextState.phaseIndex, 2);
      expect(nextState.scheduleIndex, 7);
      expect(nextState.status, 'study');
    });
  });

  group('Crucible C1 Final Sequence & Backlog', () {
    test('Macro 7 concludes on Day 98', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      // Day 98 starts at 97 days elapsed
      final nowMacro7 = pStart.add(const Duration(days: 97, hours: 9)); // Day 98, 09:00 AM
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'macro_test',
        scheduleStartTime: pStart.add(const Duration(days: 97, hours: 9)),
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(days: 97, hours: 11)),
        isVIP: false,
        isStalled: false,
      );

      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowMacro7.add(const Duration(hours: 2)), // After 11:00 AM
        completedMicroIds: ['micro_42'],
        completedRebuildIds: [],
        completedMacroIds: ['macro_test_7'], // Completed
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );

      // Day 99 is Grand Simulation
      final dayOnRecovery = CrucibleClockEngine.getProtocolDay(state: nextState, now: pStart.add(const Duration(days: 98, hours: 5)));
      expect(dayOnRecovery, 99);
    });

    test('Never-Wait Progression does not freeze on overdue micro tests', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);

      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      // Evaluate 60 hours later (past schedule 1 expiry) without completing micro_01
      final nowPast = pStart.add(const Duration(hours: 60));
      state = CrucibleEngine.evaluateState(
        state: state,
        now: nowPast,
        completedMicroIds: [], // Empty!
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );

      // Automatically progressed to Schedule 2
      expect(state.scheduleIndex, 2);
      expect(state.status, 'study');
    });
  });

  group('Crucible C1 Pause Semantic Safety', () {
    test('Regression Case: Pause rounding preserves 10:00 AM clock alignment', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);

      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: pStart,
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      // 1. Pause for 5 hours (rounds to 0 days shift)
      var t = pStart.add(const Duration(hours: 12));
      state = CrucibleEngine.pauseProtocol(state, t);
      t = t.add(const Duration(hours: 5));
      state = CrucibleEngine.resumeProtocol(state, t);

      // Start time remains exactly at 10:00 AM
      expect(state.protocolStartTime.hour, 10);
      expect(state.protocolStartTime.minute, 0);

      // 2. Pause for 24 hours (shifts by exactly 1 day = 24 hours)
      t = t.add(const Duration(hours: 10));
      state = CrucibleEngine.pauseProtocol(state, t);
      t = t.add(const Duration(hours: 24));
      state = CrucibleEngine.resumeProtocol(state, t);

      // Start time STILL remains exactly at 10:00 AM
      expect(state.protocolStartTime.hour, 10);
      expect(state.protocolStartTime.minute, 0);
    });
  });
}
