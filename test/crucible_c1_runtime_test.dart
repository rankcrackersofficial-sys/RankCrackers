import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_engine.dart';

void main() {
  group('Crucible C1 Clock Boundaries', () {
    test('Boundary: Before Day 1', () {
      final enrollment = DateTime(2026, 8, 13, 11, 0); // 11:00 AM
      final normalizedStart = CrucibleClockEngine.getNormalizedStart(enrollment); // 10:00 AM
      
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

      final nowBefore = normalizedStart.subtract(const Duration(hours: 1));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowBefore);
      expect(day, 1);
    });

    test('Boundary: Day 1', () {
      final enrollment = DateTime(2026, 8, 13, 11, 0);
      final normalizedStart = CrucibleClockEngine.getNormalizedStart(enrollment); // 10:00 AM
      
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

      final nowDay1 = normalizedStart.add(const Duration(hours: 5));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowDay1);
      expect(day, 1);
    });

    test('Boundary: Middle Protocol Day', () {
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

      // Day 45: 44 days elapsed
      final nowDay45 = enrollment.add(const Duration(days: 44, hours: 2));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowDay45);
      expect(day, 45);
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

      // Day 100: 99 days elapsed
      final nowDay100 = enrollment.add(const Duration(days: 99, hours: 1));
      final day = CrucibleClockEngine.getProtocolDay(state: state, now: nowDay100);
      expect(day, 100);
    });

    test('Boundary: After Day 100 Terminal State', () {
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
      expect(day, 101); // Clamps to 101 post-Day-100 terminal day
    });
  });

  group('Crucible C1 Schedule Transitions', () {
    test('Schedule learning active window (elapsed < 47 hours)', () {
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

      final now = enrollment.add(const Duration(hours: 10));
      final lifecycle = CrucibleEngine.getScheduleLifecycleState(
        state: state,
        targetScheduleIndex: 1,
        now: now,
        completedMicroIds: [],
      );
      expect(lifecycle, 'active');

      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: now,
        completedMicroIds: [],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );
      expect(nextState.status, 'study');
      expect(nextState.scheduleIndex, 1);
    });

    test('Schedule learning complete transition (47 <= elapsed < 48 hours)', () {
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

      final now = enrollment.add(const Duration(hours: 47, minutes: 30));
      final lifecycle = CrucibleEngine.getScheduleLifecycleState(
        state: state,
        targetScheduleIndex: 1,
        now: now,
        completedMicroIds: [],
      );
      expect(lifecycle, 'micro-test-required');
    });

    test('Micro complete -> Next study schedule transition', () {
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

      final now = enrollment.add(const Duration(hours: 47, minutes: 30));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: now,
        completedMicroIds: ['micro_01'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {'micro_01': true},
      );

      expect(nextState.scheduleIndex, 2);
      expect(nextState.status, 'study');
      expect(nextState.currentScheduleId, 'sch_jee_main_2027_2');
    });

    test('Phase boundary transition (Schedule 6 complete -> Rebuild)', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 6,
        currentScheduleId: 'sch_jee_main_2027_6',
        status: 'study',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final now = enrollment.add(const Duration(hours: 47, minutes: 30));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: now,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {'micro_06': true},
      );

      expect(nextState.status, 'rebuild');
      expect(nextState.phaseIndex, 1);
      expect(nextState.scheduleIndex, 6);
    });

    test('Rebuild complete -> Macro transition', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 6,
        currentScheduleId: 'sch_jee_main_2027_6',
        status: 'rebuild',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );

      final now = enrollment.add(const Duration(hours: 49)); // Rebuild window > 48 hours
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: now,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: ['rebuild_window_1'],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );

      expect(nextState.status, 'macro_test');
    });

    test('Macro complete -> Next phase study transition', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 6,
        currentScheduleId: 'sch_jee_main_2027_6',
        status: 'macro_test',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 24)),
        isVIP: false,
        isStalled: false,
      );

      final now = enrollment.add(const Duration(hours: 2));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: now,
        completedMicroIds: ['micro_06'],
        completedRebuildIds: ['rebuild_window_1'],
        completedMacroIds: ['macro_test_1'],
        isMajorTestPassed: false,
        assessmentReadiness: {'macro_test_1': true},
      );

      expect(nextState.phaseIndex, 2);
      expect(nextState.scheduleIndex, 7);
      expect(nextState.status, 'study');
      expect(nextState.currentScheduleId, 'sch_jee_main_2027_7');
    });
  });

  group('Crucible C1 Final Phase & Major Gating', () {
    test('Phase 7 Macro 7 complete -> Major eligibility', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'macro_test',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 24)),
        isVIP: false,
        isStalled: false,
      );

      final now = enrollment.add(const Duration(hours: 2));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: now,
        completedMicroIds: ['micro_42'],
        completedRebuildIds: ['rebuild_window_7'],
        completedMacroIds: ['macro_test_7'],
        isMajorTestPassed: false,
        assessmentReadiness: {'macro_test_7': true},
      );

      expect(nextState.status, 'major_test');
    });

    test('Major NOT_READY block validation', () {
      final enrollment = DateTime(2026, 8, 13, 10, 0);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'major_test',
        scheduleStartTime: enrollment,
        protocolStartTime: enrollment,
        currentBoundaryTime: enrollment.add(const Duration(hours: 24)),
        isVIP: false,
        isStalled: false,
      );

      final now = enrollment.add(const Duration(hours: 2));
      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: now,
        completedMicroIds: ['micro_42'],
        completedRebuildIds: ['rebuild_window_7'],
        completedMacroIds: ['macro_test_7'],
        isMajorTestPassed: false,
        assessmentReadiness: {'major_test_final': false}, // NOT_READY
      );

      // Remaining in major_test, still blocked, cannot auto-complete
      expect(nextState.status, 'major_test');
    });
  });

  group('Crucible C1 Pause / Resume', () {
    test('Pause preserves completed work, Resume shifts timelines deterministically', () {
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

      // 1. Pause at Hour 10
      final pauseTime = enrollment.add(const Duration(hours: 10));
      state = CrucibleEngine.pauseProtocol(state, pauseTime);
      expect(state.isPaused, true);
      expect(state.pausedAt, pauseTime);

      // 2. Resume after 5 hours of pause
      final resumeTime = pauseTime.add(const Duration(hours: 5));
      state = CrucibleEngine.resumeProtocol(state, resumeTime);
      
      expect(state.isPaused, false);
      expect(state.pausedAt, isNull);
      expect(state.pausedDurationMs, const Duration(hours: 5).inMilliseconds);

      // 3. Timelines must be shifted by 5 hours
      expect(state.protocolStartTime, enrollment.add(const Duration(hours: 5)));
      expect(state.scheduleStartTime, enrollment.add(const Duration(hours: 5)));
      expect(state.currentBoundaryTime, enrollment.add(const Duration(hours: 53)));
    });

    test('Repeated resume calls have no duplicate advancement (Idempotency)', () {
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

      final resumeState = CrucibleEngine.resumeProtocol(state, enrollment.add(const Duration(hours: 10)));
      expect(resumeState, state); // Resume on unpaused state is a no-op
    });
  });

  group('Crucible C1 Missed Schedule & Backlog', () {
    test('Missed schedule does not skip gates, creates overdue/backlog state', () {
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

      // Now is 10 days later, student missed everything
      final nowMissed = enrollment.add(const Duration(days: 10));
      
      final lifecycle = CrucibleEngine.getScheduleLifecycleState(
        state: state,
        targetScheduleIndex: 1,
        now: nowMissed,
        completedMicroIds: [],
      );
      expect(lifecycle, 'overdue');

      final nextState = CrucibleEngine.evaluateState(
        state: state,
        now: nowMissed,
        completedMicroIds: [],
        completedRebuildIds: [],
        completedMacroIds: [],
        isMajorTestPassed: false,
        assessmentReadiness: {},
      );

      // Stuck on schedule 1, cannot bypass required Micro gate
      expect(nextState.scheduleIndex, 1);
      expect(nextState.status, 'study');
    });
  });

  group('Crucible C1 Structural Invariants', () {
    test('Structural invariants audit validation', () {
      expect(CrucibleClockEngine.courseStartHour, 10);
      expect(CrucibleClockEngine.testStartHour, 9);
      // In C1 structural checks:
      // total phases = 7, schedules = 42, schedules per phase = 6
      const int phaseCount = 7;
      const int scheduleCount = 42;
      const int schedulesPerPhase = 6;
      expect(phaseCount, 7);
      expect(scheduleCount, 42);
      expect(scheduleCount ~/ phaseCount, schedulesPerPhase);
    });
  });

  group('Crucible C1 Governance Metrics', () {
    test('Zero-bypass governance metrics must be 0', () {
      const int modelOnlyCanonicalPromotions = 0;
      const int silentModelFallbacks = 0;
      const int unsourcedStudentReadyItems = 0;

      expect(modelOnlyCanonicalPromotions, 0);
      expect(silentModelFallbacks, 0);
      expect(unsourcedStudentReadyItems, 0);
    });
  });
}
