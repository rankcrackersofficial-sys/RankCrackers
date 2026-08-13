import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_engine.dart';

void main() {
  group('Crucible C1 Sovereign Start Law (C1-FIX3)', () {
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

    test('Boundary: 00:00 AM next day -> same day 10:00 AM start', () {
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
    test('End of schedule 6 Micro Test transitions to Rebuild Window 1 on Day 13 10:00 AM', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      // Schedule 6 starts on Day 11 10:00 AM and ends on Day 13 10:00 AM (12 days elapsed)
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 6,
        currentScheduleId: 'sch_jee_main_2027_6',
        status: 'study',
        scheduleStartTime: pStart.add(const Duration(days: 10)),
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(days: 12)),
        isVIP: false,
        isStalled: false,
      );

      final nowEnd = pStart.add(const Duration(days: 12));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowEnd,
        completedMicroIds: ['micro_06'], 
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );

      expect(nextState.status, 'rebuild');
      expect(nextState.currentBoundaryTime, pStart.add(const Duration(days: 13)).subtract(const Duration(hours: 1))); // Day 14, 09:00 AM
    });

    test('Rebuild Day 13 is active, then transitions to Macro at 09:00 AM on Day 14', () {
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
        currentBoundaryTime: pStart.add(const Duration(days: 13)).subtract(const Duration(hours: 1)), // Day 14, 09:00 AM
        isVIP: false,
        isStalled: false,
      );

      // 1. Day 13, 05:00 PM (12d 7h elapsed) is rebuild
      final nowRebuild = pStart.add(const Duration(days: 12, hours: 7));
      var nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowRebuild,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(nextState.status, 'rebuild');

      // 2. Day 14, 09:00 AM (12d 23h elapsed) transitions to macro_test
      final nowMacro = pStart.add(const Duration(days: 12, hours: 23)); 
      nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowMacro,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(nextState.status, 'macro_test');
    });

    test('Day 14 at 11:00 AM close transitions to Phase Transition Recovery block', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 6,
        currentScheduleId: 'sch_jee_main_2027_6',
        status: 'macro_test',
        scheduleStartTime: pStart.add(const Duration(days: 12, hours: 23)),
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(days: 13, hours: 1)), // Day 14, 11:00 AM (13d 1h elapsed)
        isVIP: false,
        isStalled: false,
      );

      // Evaluate past 11:00 AM (13 days 1 hour 1 minute elapsed)
      final nowPast = pStart.add(const Duration(days: 13, hours: 1, minutes: 1));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowPast,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );

      expect(nextState.status, 'phase_transition_recovery');
      expect(nextState.scheduleStartTime, pStart.add(const Duration(days: 13, hours: 1)));
      expect(nextState.currentBoundaryTime, pStart.add(const Duration(days: 14))); // Day 15, 10:00 AM
    });
  });

  group('Crucible C1 Final Sequence & Backlog', () {
    test('Macro 7 concludes on Day 98, Day 99 is Grand Simulation, Day 100 is Major', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);
      
      // Day 98 starts at 97 days elapsed. 09:00 AM is 96d 23h elapsed.
      final nowMacro7 = pStart.add(const Duration(days: 96, hours: 23)); 
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'macro_test',
        scheduleStartTime: pStart.add(const Duration(days: 96, hours: 23)),
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(days: 97, hours: 1)),
        isVIP: false,
        isStalled: false,
      );

      // Complete Macro 7.
      state = CrucibleEngine.evaluateState(
        state: state,
        now: nowMacro7.add(const Duration(hours: 2)), // 11:00 AM Day 98
        completedMicroIds: ['micro_42'],
        completedRebuildIds: [],
        completedMacroIds: ['macro_test_7'], 
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );

      // Verify recovery transition
      expect(state.status, 'phase_transition_recovery');

      // Verify Day 99 Grand Simulation (98 days elapsed)
      final grandSimTime = pStart.add(const Duration(days: 98, hours: 2)); 
      state = CrucibleEngine.evaluateState(
        state: state,
        now: grandSimTime,
        completedMicroIds: ['micro_42'],
        completedRebuildIds: [],
        completedMacroIds: ['macro_test_7'],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(state.status, 'grand_simulation');

      // Verify Day 100 Major Test (99 days elapsed)
      final majorTime = pStart.add(const Duration(days: 99, hours: 2)); 
      state = CrucibleEngine.evaluateState(
        state: state,
        now: majorTime,
        completedMicroIds: ['micro_42'],
        completedRebuildIds: [],
        completedMacroIds: ['macro_test_7'],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(state.status, 'major_test');
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
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );

      // Automatically progressed to Schedule 2
      expect(state.scheduleIndex, 2);
      expect(state.status, 'study');
    });
  });

  group('Crucible C1 Pause Clock Invariance (C1-FIX3)', () {
    test('Pause does not freeze sovereign clock nor shift boundaries', () {
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

      // Pause at 12 hours active
      final pauseTime = pStart.add(const Duration(hours: 12));
      state = CrucibleEngine.pauseProtocol(state, pauseTime);
      expect(state.isPaused, true);

      // Clock continues ticking forward while paused. Let's resume 10 hours later
      final resumeTime = pauseTime.add(const Duration(hours: 10));
      state = CrucibleEngine.resumeProtocol(state, resumeTime);
      expect(state.isPaused, false);

      // Verify that start times and schedule anchors remain UNCHANGED
      expect(state.protocolStartTime, pStart);
      expect(state.scheduleStartTime, pStart);

      // Verify active elapsed time is calculated correctly (not frozen or rounding)
      final elapsed = CrucibleClockEngine.calculateActiveElapsed(state: state, now: resumeTime);
      expect(elapsed.inHours, 22); // Ticked forward by 22h total (12h + 10h)
    });
  });

  group('Crucible 100-Day Temporal Golden Test', () {
    test('Verify complete Phase 1 through Day 100 lifecycle rhythm', () {
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

      // --- PHASE 1 ---
      // Schedule 1: Day 1-2
      expect(CrucibleClockEngine.getProtocolDay(state: state, now: pStart.add(const Duration(hours: 23))), 1);
      state = CrucibleEngine.evaluateState(
        state: state,
        now: pStart.add(const Duration(hours: 48)), // End of Sch 1
        completedMicroIds: ['micro_01'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(state.scheduleIndex, 2);
      expect(state.status, 'study');

      // Schedule 6: Day 11-12
      final sch6Start = pStart.add(const Duration(days: 10));
      state = CrucibleEngine.evaluateState(
        state: state,
        now: sch6Start.add(const Duration(hours: 48)), // End of Sch 6 (Day 13 10:00 AM)
        completedMicroIds: ['micro_01', 'micro_02', 'micro_03', 'micro_04', 'micro_05', 'micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(state.status, 'rebuild');
      expect(state.currentBoundaryTime, pStart.add(const Duration(days: 13)).subtract(const Duration(hours: 1))); // Day 14, 09:00 AM

      // Rebuild ending Day 14, 09:00 AM -> Macro 1
      state = CrucibleEngine.evaluateState(
        state: state,
        now: pStart.add(const Duration(days: 13)).subtract(const Duration(hours: 1)),
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(state.status, 'macro_test');
      expect(state.currentBoundaryTime, pStart.add(const Duration(days: 13, hours: 1))); // Day 14, 11:00 AM

      // Macro 1 ending Day 14, 11:00 AM -> Phase Transition Recovery
      state = CrucibleEngine.evaluateState(
        state: state,
        now: pStart.add(const Duration(days: 13, hours: 1)),
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(state.status, 'phase_transition_recovery');
      expect(state.currentBoundaryTime, pStart.add(const Duration(days: 14))); // Day 15, 10:00 AM

      // --- PHASE 2 sovereign anchor ---
      state = CrucibleEngine.evaluateState(
        state: state,
        now: pStart.add(const Duration(days: 14)), // Day 15, 10:00 AM
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(state.phaseIndex, 2);
      expect(state.scheduleIndex, 7);
      expect(state.status, 'study');

      // --- FINAL SEQUENCE (Phase 7) ---
      // Day 98 Macro 7
      final stateMacro7 = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'macro_test',
        scheduleStartTime: pStart.add(const Duration(days: 96, hours: 23)),
        protocolStartTime: pStart,
        currentBoundaryTime: pStart.add(const Duration(days: 97, hours: 1)),
        isVIP: false,
        isStalled: false,
      );

      final stateRecovery = CrucibleEngine.evaluateState(
        state: stateMacro7,
        now: pStart.add(const Duration(days: 97, hours: 1)), // Day 98, 11:00 AM
        completedMicroIds: ['micro_42'],
        completedRebuildIds: [],
        completedMacroIds: ['macro_test_7'],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(stateRecovery.status, 'phase_transition_recovery');

      // Day 99 Grand Simulation
      final stateSim = CrucibleEngine.evaluateState(
        state: stateRecovery,
        now: pStart.add(const Duration(days: 98, hours: 2)), // Day 99, 12:00 PM
        completedMicroIds: ['micro_42'],
        completedRebuildIds: [],
        completedMacroIds: ['macro_test_7'],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(stateSim.status, 'grand_simulation');

      // Day 100 Major Test
      final stateMajor = CrucibleEngine.evaluateState(
        state: stateSim,
        now: pStart.add(const Duration(days: 99, hours: 2)), // Day 100, 12:00 PM
        completedMicroIds: ['micro_42'],
        completedRebuildIds: [],
        completedMacroIds: ['macro_test_7'],
        isMajorTestSubmitted: false,
        assessmentReadiness: {},
      );
      expect(stateMajor.status, 'major_test');

      // Day 101 Terminal
      final stateCompleted = CrucibleEngine.evaluateState(
        state: stateMajor,
        now: pStart.add(const Duration(days: 100, hours: 2)), // Day 101, 12:00 PM
        completedMicroIds: ['micro_42'],
        completedRebuildIds: [],
        completedMacroIds: ['macro_test_7'],
        isMajorTestSubmitted: true,
        assessmentReadiness: {},
      );
      expect(stateCompleted.status, 'completed');
    });

    test('Micro Factory Readiness: Verify 42/42 temporal micro slots metadata can be resolved', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final pStart = CrucibleClockEngine.getNormalizedStart(enrollment);

      for (int i = 1; i <= 42; i++) {
        final slot = CrucibleEngine.getTemporalSlotMetadata(
          scheduleIndex: i,
          protocolStartTime: pStart,
          assignedAtoms: ['atom_1', 'atom_2'],
        );

        expect(slot['scheduleId'], 'sch_jee_main_2027_$i');
        expect(slot['assignedAtoms'], contains('atom_1'));
        expect(slot['learningStart'], isNotNull);
        expect(slot['microEligibilityStart'], isNotNull);
        expect(slot['microEligibilityEnd'], isNotNull);
        
        final expectedPhase = (i - 1) ~/ 6 + 1;
        expect(slot['phaseId'], 'phase_$expectedPhase');
        expect(slot['macroId'], 'macro_${expectedPhase.toString().padLeft(2, '0')}');
      }
    });
  });
}
