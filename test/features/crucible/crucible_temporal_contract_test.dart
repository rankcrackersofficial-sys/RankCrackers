import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/models/mission_crucible_blueprint.dart';

void main() {
  const bp = MissionCrucibleBlueprint.jeeMain2027Blueprint;
  final start = DateTime(2026, 11, 1, 10);
  final state = CrucibleProtocolState(
    recruitmentId: 'jee_main_2027',
    phaseIndex: 1,
    scheduleIndex: 1,
    currentScheduleId: 's01',
    status: 'study',
    scheduleStartTime: start,
    protocolStartTime: start,
    currentBoundaryTime: start,
    isVIP: false,
    isStalled: false,
  );

  group('Crucible canonical 98-day temporal contract', () {
    test('phase arithmetic is exactly 14 days and orbit is exactly 98 days', () {
      final studyHours = bp.schedulesPerPhase * bp.hoursPerSchedule;
      final phaseHours = studyHours + bp.rebuildDurationHours + bp.macroDurationHours + bp.recoveryDurationHours;
      expect(studyHours, 288);
      expect(phaseHours, 336);
      expect(phaseHours * bp.phaseCount, 2352);
      expect(bp.cycleLengthDays * 24, 2352);
    });

    test('schedule 1 is 47h learning then 1h Micro', () {
      expect(CrucibleClockEngine.getWindowType(state: state, now: start.add(const Duration(hours: 46))), 'LEARNING');
      expect(CrucibleClockEngine.getWindowType(state: state, now: start.add(const Duration(hours: 47))), 'MICRO');
      expect(CrucibleClockEngine.getWindowType(state: state, now: start.add(const Duration(hours: 48))), 'LEARNING');
    });

    test('phase closes with 46h Rebuild then 2h Macro and no recovery gap', () {
      expect(CrucibleClockEngine.getWindowType(state: state, now: start.add(const Duration(hours: 288))), 'REBUILD');
      expect(CrucibleClockEngine.getWindowType(state: state, now: start.add(const Duration(hours: 333))), 'REBUILD');
      expect(CrucibleClockEngine.getWindowType(state: state, now: start.add(const Duration(hours: 334))), 'MACRO');
      expect(CrucibleClockEngine.getWindowType(state: state, now: start.add(const Duration(hours: 336))), 'LEARNING');
    });

    test('final 2h Macro closes exactly at the 98-day orbit boundary', () {
      final phase7Start = start.add(const Duration(days: 84));
      final finalMacroStart = phase7Start.add(const Duration(hours: 334));
      final finalMacroEnd = finalMacroStart.add(const Duration(hours: 2));
      final orbit2Start = start.add(const Duration(days: 98));
      expect(finalMacroStart, start.add(const Duration(days: 97, hours: 22)));
      expect(finalMacroEnd, start.add(const Duration(days: 98)));
      expect(orbit2Start, start.add(const Duration(hours: 2352)));
      expect(finalMacroEnd, orbit2Start);
    });

    test('10 PM cutoff is inclusive; one minute later skips current Micro', () {
      final scheduleStart = DateTime(2026, 11, 1, 10);
      expect(CrucibleClockEngine.microEligibilityState(joinedAt: DateTime(2026, 11, 1, 22), scheduleStart: scheduleStart), 'ELIGIBLE');
      expect(CrucibleClockEngine.microEligibilityState(joinedAt: DateTime(2026, 11, 1, 22, 1), scheduleStart: scheduleStart), 'NOT_ELIGIBLE_LATE_ENTRY');
    });
  });
}
