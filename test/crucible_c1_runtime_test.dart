import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_engine.dart';

void main() {
  group('Crucible C1 Clock Boundaries (C1-FIX1)', () {
    test('Boundary: Before Day 1', () {
      final enrollment = DateTime(2026, 8, 13, 11, 0); // 11:00 AM
      
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final nowBefore = enrollment.subtract(const Duration(hours: 1));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowBefore);
      expect(day, 1);
    });

    test('Boundary: Day 1', () {
      final enrollment = DateTime(2026, 8, 13, 11, 0);
      
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final nowDay1 = enrollment.add(const Duration(hours: 5));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowDay1);
      expect(day, 1);
    });

    test('Boundary: Day 100', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      // Day 100 occurs at 99 days elapsed
      final nowDay100 = enrollment.add(const Duration(days: 99, hours: 1));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowDay100);
      expect(day, 100);
    });

    test('Boundary: After Day 100 Terminal State (Clamped Sentinel)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final nowAfter = enrollment.add(const Duration(days: 105));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowAfter);
      expect(day, CrucibleClockEngine.terminalDaySentinel); // Day 101 terminal sentinel
    });
  });

  group('Crucible C1 Pause / Resume Accounting & Regression Tests', () {
    test('Regression Case: Single Pause (12h active -> 24h pause -> 12h active = 24h total)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      // 1. Run for 12 hours active
      final pauseTime = enrollment.add(const Duration(hours: 12));
      state = CrucibleEngine.pauseProtocol(state, pauseTime);
      expect(state.isPaused, true);
      expect(state.pausedAt, pauseTime);

      // 2. Pause for 24 hours
      final resumeTime = pauseTime.add(const Duration(hours: 24));
      state = CrucibleEngine.resumeProtocol(state, resumeTime);
      expect(state.isPaused, false);
      expect(state.pausedAt, isNull);
      expect(state.pausedDurationMs, const Duration(hours: 24).inMilliseconds);

      // 3. Run for another 12 hours active
      final finalTime = resumeTime.add(const Duration(hours: 12));
      final activeElapsed = CrucibleClockEngine.calculateActiveElapsed(state: state, now: finalTime);
      expect(activeElapsed.inHours, 24); // Exactly 24h active, not 0h or 48h
    });

    test('Regression Case: Multiple Pauses (10h active -> 5h pause -> 10h active -> 7h pause -> 10h active = 30h total)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      // 1. 10 hours active, then pause 5 hours
      var t = enrollment.add(const Duration(hours: 10));
      state = CrucibleEngine.pauseProtocol(state, t);
      t = t.add(const Duration(hours: 5));
      state = CrucibleEngine.resumeProtocol(state, t);

      // 2. 10 hours active, then pause 7 hours
      t = t.add(const Duration(hours: 10));
      state = CrucibleEngine.pauseProtocol(state, t);
      t = t.add(const Duration(hours: 7));
      state = CrucibleEngine.resumeProtocol(state, t);

      // 3. 10 hours active
      t = t.add(const Duration(hours: 10));
      
      final activeElapsed = CrucibleClockEngine.calculateActiveElapsed(state: state, now: t);
      expect(activeElapsed.inHours, 30); // Exactly 30h active
      expect(state.pausedDurationMs, const Duration(hours: 12).inMilliseconds);
    });

    test('Regression Case: Resume Idempotency', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final state2 = CrucibleEngine.resumeProtocol(state, enrollment.add(const Duration(hours: 10)));
      expect(state2, state); // Resume when not paused is a no-op
    });

    test('Regression Case: Schedule boundary frozen during pause', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      // Pause at 10 hours active
      state = CrucibleEngine.pauseProtocol(state, enrollment.add(const Duration(hours: 10)));
      
      // Fast-forward clock 100 hours later while paused
      final futureTime = enrollment.add(const Duration(hours: 110));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: futureTime,
        completedMicroIds: [],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );

      // Must remain frozen on schedule 1
      expect(nextState.scheduleIndex, 1);
      expect(nextState.status, 'study');
    });
  });

  group('Crucible C1 Timeline & Day-99/100 Semantics', () {
    test('Phase 7 Macro Test Gating on Day 99 at 09:00 AM', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0); // Day 1
      
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'rebuild',
        scheduleStartTime: enrollment.add(const Duration(days: 96)), // Rebuild start Day 97
        protocolStartTime: enrollment,
        currentBoundaryTime: DateTime(enrollment.year, enrollment.month, enrollment.day + 98, 9, 0, 0), // Day 99, 09:00 AM
        isVIP: false,
        isStalled: false,
      );

      // Evaluate at Day 99, 09:00 AM
      final day99MacroStart = DateTime(enrollment.year, enrollment.month, enrollment.day + 98, 9, 0, 0);
      
      state = CrucibleEngine.evaluateState(
        state: state,
        now: day99MacroStart,
        completedMicroIds: ['micro_42'],
        completedRebuildIds: ['rebuild_window_7'],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );

      expect(state.status, 'macro_test');
      expect(state.currentBoundaryTime, DateTime(enrollment.year, enrollment.month, enrollment.day + 98, 11, 0, 0)); // Day 99, 11:00 AM
    });

    test('Macro completion on Day 99 transitions to recovery, not direct Major', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'macro_test',
        scheduleStartTime: enrollment.add(const Duration(days: 96)),
        protocolStartTime: enrollment,
        currentBoundaryTime: DateTime(enrollment.year, enrollment.month, enrollment.day + 98, 11, 0, 0),
        isVIP: false,
        isStalled: false,
      );

      // Complete Macro 7 at 10:00 AM on Day 99
      final now = DateTime(enrollment.year, enrollment.month, enrollment.day + 98, 10, 0, 0);
      state = CrucibleEngine.evaluateState(
        state: state,
        now: now,
        completedMicroIds: ['micro_42'],
        completedRebuildIds: ['rebuild_window_7'],
        completedMacroIds: ['macro_test_7'],
        isMajorTestPassed: false,
        assessmentReadiness: {'macro_test_7': true},
      );

      expect(state.status, 'major_test');
      expect(state.currentBoundaryTime, DateTime(enrollment.year, enrollment.month, enrollment.day + 99, 10, 0, 0)); // Day 100, 10:00 AM
    });

    test('Day 100 Major Test is due and blocked on readiness', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'major_test',
        scheduleStartTime: enrollment.add(const Duration(days: 98, hours: 10)),
        protocolStartTime: enrollment,
        currentBoundaryTime: DateTime(enrollment.year, enrollment.month, enrollment.day + 99, 10, 0, 0), // Day 100, 10:00 AM
        isVIP: false,
        isStalled: false,
      );

      // Try evaluating on Day 100
      final day100 = enrollment.add(const Duration(days: 99, hours: 2));
      state = CrucibleEngine.evaluateState(
        state: state,
        now: day100,
        completedMicroIds: ['micro_42'],
        completedRebuildIds: ['rebuild_window_7'],
        completedMacroIds: ['macro_test_7'],
        isMajorTestPassed: false,
        assessmentReadiness: {'major_test_final': false}, // NOT_READY
      );

      // Remaining in major_test status, blocked
      expect(state.status, 'major_test');
    });

    test('READY Major Test may execute and complete the protocol', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      var state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'major_test',
        scheduleStartTime: enrollment.add(const Duration(days: 98, hours: 10)),
        protocolStartTime: enrollment,
        currentBoundaryTime: DateTime(enrollment.year, enrollment.month, enrollment.day + 99, 10, 0, 0),
        isVIP: false,
        isStalled: false,
      );

      final day100 = enrollment.add(const Duration(days: 99, hours: 2));
      state = CrucibleEngine.evaluateState(
        state: state,
        now: day100,
        completedMicroIds: ['micro_42'],
        completedRebuildIds: ['rebuild_window_7'],
        completedMacroIds: ['macro_test_7'],
        isMajorTestPassed: true, // Passed
        assessmentReadiness: {'major_test_final': true},
      );

      expect(state.status, 'completed');
    });
  });
}
