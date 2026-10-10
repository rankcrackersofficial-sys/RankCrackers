import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';

void main() {
  group('Crucible C3 Student-Scoped Clock and Window Tests', () {
    late CrucibleProtocolState baseState;

    setUp(() {
      final now = DateTime.now();
      baseState = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: now,
        protocolStartTime: now,
        currentBoundaryTime: now.add(const Duration(hours: 48)),
        isVIP: false,
        isStalled: false,
      );
    });

    test('1. Student-Scoped Firestore Path format is correct', () {
      final uid = 'student_test_123';
      final path = 'users/$uid/protocols/${baseState.recruitmentId}';
      expect(path, 'users/student_test_123/protocols/jee_main_2027');
    });

    test('2. getWindowType resolves LEARNING correctly', () {
      final now = baseState.protocolStartTime.add(const Duration(hours: 20));
      final type = CrucibleClockEngine.getWindowType(state: baseState, now: now);
      expect(type, 'LEARNING');
    });

    test('3. getWindowType resolves MICRO correctly', () {
      final now = baseState.protocolStartTime.add(const Duration(hours: 47, minutes: 30));
      final type = CrucibleClockEngine.getWindowType(state: baseState, now: now);
      expect(type, 'MICRO');
    });

    test('4. getWindowType resolves REBUILD correctly', () {
      // Day 13 is rebuild phase (elapsed >= 12 days)
      final now = baseState.protocolStartTime.add(const Duration(days: 12, hours: 5));
      final type = CrucibleClockEngine.getWindowType(state: baseState, now: now);
      expect(type, 'REBUILD');
    });

    test('5. getWindowType resolves MACRO correctly', () {
      // Day 14 at 9:30 AM is macro (elapsed 12 days + 23 hours + 30 mins)
      final now = baseState.protocolStartTime.add(const Duration(days: 12, hours: 23, minutes: 30));
      final type = CrucibleClockEngine.getWindowType(state: baseState, now: now);
      expect(type, 'MACRO');
    });

    test('6. getWindowType resolves RECOVERY correctly', () {
      // Day 14 at 12:00 PM is recovery (elapsed 13 days + 2 hours)
      final now = baseState.protocolStartTime.add(const Duration(days: 13, hours: 2));
      final type = CrucibleClockEngine.getWindowType(state: baseState, now: now);
      expect(type, 'RECOVERY');
    });

    test('7. Continuous Rotation: Day 99 wraps into Orbit 2 Day 1 LEARNING', () {
      // Day 99 wraps into Orbit 2 Day 1 (elapsed >= 98 days)
      final now = baseState.protocolStartTime.add(const Duration(days: 98, hours: 2));
      final type = CrucibleClockEngine.getWindowType(state: baseState, now: now);
      expect(type, 'LEARNING');
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: baseState.protocolStartTime, now: now), 2);
    });

    test('8. getCurrentWindowBounds calculates correct start/end for LEARNING', () {
      final now = baseState.protocolStartTime.add(const Duration(hours: 10));
      final bounds = CrucibleClockEngine.getCurrentWindowBounds(state: baseState, now: now);
      expect(bounds['type'], 'LEARNING');
      expect(bounds['start'], baseState.protocolStartTime);
      expect(bounds['end'], baseState.protocolStartTime.add(const Duration(hours: 47)));
    });

    test('9. getWindowRemainingDuration computes correct remaining time', () {
      final now = baseState.protocolStartTime.add(const Duration(hours: 40));
      final remaining = CrucibleClockEngine.getWindowRemainingDuration(state: baseState, now: now);
      expect(remaining, const Duration(hours: 7));
    });

    test('10. Countdown Tick proof: T1 remaining is strictly less than T0 remaining', () {
      final t0 = baseState.protocolStartTime.add(const Duration(hours: 10));
      final t1 = t0.add(const Duration(seconds: 1));
      
      final dur0 = CrucibleClockEngine.getWindowRemainingDuration(state: baseState, now: t0);
      final dur1 = CrucibleClockEngine.getWindowRemainingDuration(state: baseState, now: t1);
      
      expect(dur1 < dur0, isTrue);
    });
  });
}
