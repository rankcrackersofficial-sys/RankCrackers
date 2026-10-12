import '../models/crucible_protocol_state.dart';
import '../models/mission_crucible_blueprint.dart';

/// CRUCIBLE CLOCK ENGINE (Generic Mission-Agnostic Core)
/// Sovereign authority for time arithmetic and continuous rotating mission orbits.
/// Consumes MissionCrucibleBlueprint for mission-specific cycle lengths, phases, and schedule boundaries.
class CrucibleClockEngine {
  static const int courseStartHour = 10;
  static const int lateJoinCutoffHours = 12;

  // ===================================================
  // BLUEPRINT RESOLVER UTILITY
  // ===================================================

  static MissionCrucibleBlueprint _resolveBlueprint({
    String? missionId,
    MissionCrucibleBlueprint? explicitBlueprint,
  }) {
    if (explicitBlueprint != null) {
      return explicitBlueprint;
    }
    if (missionId != null && missionId.isNotEmpty) {
      final bp = MissionCrucibleBlueprintRegistry.getBlueprint(missionId);
      if (bp != null) return bp;
    }
    // Default to registered baseline profile for backward compatibility
    return MissionCrucibleBlueprint.jeeMain2027Blueprint;
  }

  // ===================================================
  // GET SOVEREIGN NORMALIZED START
  // ===================================================

  static DateTime getNormalizedStart(DateTime enrollmentTime) {
    final hour = enrollmentTime.hour;
    if (hour >= 10 && hour < 22) {
      return DateTime(
        enrollmentTime.year,
        enrollmentTime.month,
        enrollmentTime.day,
        10, 0, 0,
      );
    } else {
      final targetDate = hour >= 22
          ? enrollmentTime.add(const Duration(days: 1))
          : enrollmentTime;
      return DateTime(
        targetDate.year,
        targetDate.month,
        targetDate.day,
        10, 0, 0,
      );
    }
  }

  // ===================================================
  // GET CURRENT TACTICAL START
  // ===================================================

  static DateTime getCurrentCycleStart() {
    final now = DateTime.now();
    return DateTime(
      now.year,
      now.month,
      now.day,
      courseStartHour,
    );
  }

  // ===================================================
  // CALCULATE ACTIVE ELAPSED DURATION
  // ===================================================

  static Duration calculateActiveElapsed({
    required dynamic state, // Supports CrucibleProtocolState
    required DateTime now,
  }) {
    final start = state.protocolStartTime as DateTime;
    if (now.isBefore(start)) {
      return Duration.zero;
    }
    // SOVEREIGN_PROTOCOL_CLOCK_DOES_NOT_PAUSE
    // Global mission clock ticks continuously forward.
    return now.difference(start);
  }

  // ===================================================
  // CALCULATE ORBIT NUMBER (1, 2, 3...)
  // ===================================================

  static int getOrbitNumber({
    required DateTime protocolStartTime,
    required DateTime now,
    MissionCrucibleBlueprint? blueprint,
    int? cycleLengthDays,
  }) {
    if (now.isBefore(protocolStartTime)) return 1;
    final cycleDays = cycleLengthDays ?? blueprint?.cycleLengthDays ?? MissionCrucibleBlueprint.jeeMain2027Blueprint.cycleLengthDays;
    final elapsed = now.difference(protocolStartTime);
    return (elapsed.inSeconds ~/ (cycleDays * 24 * 3600)) + 1;
  }

  // ===================================================
  // CALCULATE CURRENT CYCLE DAY (1 to N Continuous Ring)
  // ===================================================

  static int getCycleDay({
    required dynamic state,
    required DateTime now,
    MissionCrucibleBlueprint? blueprint,
  }) {
    final bp = _resolveBlueprint(
      missionId: (state is CrucibleProtocolState) ? state.recruitmentId : null,
      explicitBlueprint: blueprint,
    );
    final elapsed = calculateActiveElapsed(state: state, now: now);
    final day = ((elapsed.inSeconds ~/ (24 * 3600)) % bp.cycleLengthDays) + 1;
    return day;
  }

  /// Alias for backward compatibility with existing callers.
  static int getProtocolDay({
    required dynamic state,
    required DateTime now,
    MissionCrucibleBlueprint? blueprint,
  }) {
    return getCycleDay(state: state, now: now, blueprint: blueprint);
  }

  // ===================================================
  // GET ACTIVE SCHEDULE INDEX (0 to totalSchedules - 1)
  // ===================================================

  static int getScheduleIndex({
    required DateTime enrollmentTime,
    MissionCrucibleBlueprint? blueprint,
    String? missionId,
  }) {
    final bp = _resolveBlueprint(missionId: missionId, explicitBlueprint: blueprint);
    final now = DateTime.now();
    final normalizedStart = getNormalizedStart(enrollmentTime);
    final difference = now.difference(normalizedStart);
    final totalDays = difference.inDays;
    final cycleDays = totalDays % bp.cycleLengthDays;
    final daysPerPhase = bp.cycleLengthDays ~/ bp.phaseCount;
    final phaseDay = cycleDays % daysPerPhase;

    final phaseIndex = (cycleDays ~/ daysPerPhase).clamp(0, bp.phaseCount - 1);
    final studyDaysLimit = bp.schedulesPerPhase * (bp.hoursPerSchedule ~/ 24);
    int studyDayOffset = phaseDay;
    if (phaseDay >= studyDaysLimit) {
      studyDayOffset = studyDaysLimit - 1; // Caps index during rebuild/macro
    }

    final scheduleIdx = (phaseIndex * bp.schedulesPerPhase) + (studyDayOffset ~/ (bp.hoursPerSchedule ~/ 24));
    return scheduleIdx.clamp(0, bp.totalSchedules - 1);
  }

  // ===================================================
  // IS REBUILD PHASE
  // ===================================================

  static bool isRebuildPhase({
    required DateTime enrollmentTime,
    MissionCrucibleBlueprint? blueprint,
    String? missionId,
  }) {
    final bp = _resolveBlueprint(missionId: missionId, explicitBlueprint: blueprint);
    final normalizedStart = getNormalizedStart(enrollmentTime);
    final difference = DateTime.now().difference(normalizedStart);
    final cycleDays = difference.inDays % bp.cycleLengthDays;
    final daysPerPhase = bp.cycleLengthDays ~/ bp.phaseCount;
    final phaseDay = cycleDays % daysPerPhase;
    final rebuildDayStart = (bp.schedulesPerPhase * bp.hoursPerSchedule) ~/ 24;
    return phaseDay >= rebuildDayStart;
  }

  // ===================================================
  // IS MACRO TEST ACTIVE
  // ===================================================

  static bool isMacroTestWindow({
    required DateTime enrollmentTime,
    MissionCrucibleBlueprint? blueprint,
    String? missionId,
  }) {
    final bp = _resolveBlueprint(missionId: missionId, explicitBlueprint: blueprint);
    final now = DateTime.now();
    final normalizedStart = getNormalizedStart(enrollmentTime);
    final difference = now.difference(normalizedStart);
    if (difference.isNegative) return false;
    final cycleHours = bp.cycleLengthDays * 24;
    final phaseHours = (bp.cycleLengthDays ~/ bp.phaseCount) * 24;
    final elapsedCycleSeconds = difference.inSeconds % (cycleHours * 3600);
    final elapsedPhase = Duration(seconds: elapsedCycleSeconds % (phaseHours * 3600));
    final macroStart = Duration(
      hours: (bp.schedulesPerPhase * bp.hoursPerSchedule) + bp.rebuildDurationHours,
    );
    final macroEnd = macroStart + Duration(hours: bp.macroDurationHours);
    return elapsedPhase >= macroStart && elapsedPhase < macroEnd;
  }

  // ===================================================
  // GET SOVEREIGN WINDOW TYPE
  // ===================================================

  static String getWindowType({
    required CrucibleProtocolState state,
    required DateTime now,
    MissionCrucibleBlueprint? blueprint,
  }) {
    if (now.isBefore(state.protocolStartTime)) {
      return 'LEARNING';
    }
    final bp = _resolveBlueprint(
      missionId: state.recruitmentId,
      explicitBlueprint: blueprint,
    );

    final elapsed = now.difference(state.protocolStartTime);
    final elapsedWithinCycle = Duration(seconds: elapsed.inSeconds % (bp.cycleLengthDays * 24 * 3600));

    final daysPerPhase = bp.cycleLengthDays ~/ bp.phaseCount;
    final phaseIndex = (elapsedWithinCycle.inSeconds ~/ (daysPerPhase * 24 * 3600)) + 1;
    final phaseStartDuration = Duration(days: (phaseIndex - 1) * daysPerPhase);
    final elapsedWithinPhase = elapsedWithinCycle - phaseStartDuration;

    final studyDuration = Duration(hours: bp.schedulesPerPhase * bp.hoursPerSchedule);
    final rebuildStart = studyDuration; // Day 13 start (288 hours)
    final macroStart = rebuildStart + Duration(hours: bp.rebuildDurationHours);
    final macroEnd = macroStart + Duration(hours: bp.macroDurationHours);
    final phaseEnd = Duration(days: daysPerPhase);

    if (elapsedWithinPhase < rebuildStart) {
      final elapsedWithinSchedule = elapsedWithinPhase.inHours % bp.hoursPerSchedule;
      if (elapsedWithinSchedule >= bp.learningHoursPerSchedule) {
        return 'MICRO';
      }
      return 'LEARNING';
    } else if (elapsedWithinPhase < macroStart) {
      return 'REBUILD';
    } else if (elapsedWithinPhase < macroEnd) {
      return 'MACRO';
    } else {
      // No recovery window: phase boundary advances directly into next schedule.
      return 'LEARNING';
    }
  }

  // ===================================================
  // GET SOVEREIGN WINDOW BOUNDS
  // ===================================================

  static Map<String, dynamic> getCurrentWindowBounds({
    required CrucibleProtocolState state,
    required DateTime now,
    MissionCrucibleBlueprint? blueprint,
  }) {
    final type = getWindowType(state: state, now: now, blueprint: blueprint);
    final bp = _resolveBlueprint(
      missionId: state.recruitmentId,
      explicitBlueprint: blueprint,
    );

    final elapsed = now.difference(state.protocolStartTime);
    final currentOrbit = (elapsed.inSeconds ~/ (bp.cycleLengthDays * 24 * 3600));
    final orbitStart = state.protocolStartTime.add(Duration(days: currentOrbit * bp.cycleLengthDays));
    final elapsedWithinCycle = Duration(seconds: elapsed.inSeconds % (bp.cycleLengthDays * 24 * 3600));

    final daysPerPhase = bp.cycleLengthDays ~/ bp.phaseCount;
    final phaseIndex = (elapsedWithinCycle.inSeconds ~/ (daysPerPhase * 24 * 3600)) + 1;
    final phaseStart = orbitStart.add(Duration(days: (phaseIndex - 1) * daysPerPhase));
    final elapsedWithinPhase = elapsedWithinCycle - Duration(days: (phaseIndex - 1) * daysPerPhase);

    final studyDuration = Duration(hours: bp.schedulesPerPhase * bp.hoursPerSchedule);
    final rebuildStart = studyDuration;
    final macroStart = rebuildStart + Duration(hours: bp.rebuildDurationHours);
    final macroEnd = macroStart + Duration(hours: bp.macroDurationHours);
    final phaseEnd = Duration(days: daysPerPhase);

    if (elapsedWithinPhase < rebuildStart) {
      final scheduleOffset = elapsedWithinPhase.inHours ~/ bp.hoursPerSchedule;
      final scheduleHoursOffset = scheduleOffset * bp.hoursPerSchedule;
      final learningStart = phaseStart.add(Duration(hours: scheduleHoursOffset));
      if (type == 'MICRO') {
        return {
          'type': 'MICRO',
          'start': learningStart.add(Duration(hours: bp.learningHoursPerSchedule)),
          'end': learningStart.add(Duration(hours: bp.hoursPerSchedule)),
        };
      }
      return {
        'type': 'LEARNING',
        'start': learningStart,
        'end': learningStart.add(Duration(hours: bp.learningHoursPerSchedule)),
      };
    } else if (elapsedWithinPhase < macroStart) {
      return {
        'type': 'REBUILD',
        'start': phaseStart.add(rebuildStart),
        'end': phaseStart.add(macroStart),
      };
    } else if (elapsedWithinPhase < macroEnd) {
      return {
        'type': 'MACRO',
        'start': phaseStart.add(macroStart),
        'end': phaseStart.add(macroEnd),
      };
    } else {
      return {
        'type': 'LEARNING',
        'start': phaseStart.add(phaseEnd),
        'end': phaseStart.add(phaseEnd).add(Duration(hours: bp.learningHoursPerSchedule)),
      };
    }
  }

  // ===================================================
  // GET SOVEREIGN WINDOW REMAINING DURATION
  // ===================================================

  static Duration getWindowRemainingDuration({
    required CrucibleProtocolState state,
    required DateTime now,
    MissionCrucibleBlueprint? blueprint,
  }) {
    final bounds = getCurrentWindowBounds(state: state, now: now, blueprint: blueprint);
    final end = bounds['end'] as DateTime;
    if (end.isBefore(now)) {
      return Duration.zero;
    }
    return end.difference(now);
  }

  // ===================================================
  // LATE-ENTRY / MICRO ELIGIBILITY
  // ===================================================

  /// Founder-locked late-entry law for a 48-hour Crucible schedule.
  /// A learner joining from schedule start through +12h (10:00-22:00
  /// for a 10:00 schedule start) may attempt that schedule's Micro.
  /// Joining after the cutoff never restarts or shifts the global ring;
  /// the current Micro is skipped without fail/absence penalty and the
  /// learner becomes eligible from the next schedule's Micro.
  static bool isEligibleForCurrentMicro({
    required DateTime joinedAt,
    required DateTime scheduleStart,
  }) {
    if (joinedAt.isBefore(scheduleStart)) return true;
    final cutoff = scheduleStart.add(const Duration(hours: lateJoinCutoffHours));
    return !joinedAt.isAfter(cutoff);
  }

  /// Canonical non-punitive state for a learner who missed the entry cutoff.
  static String microEligibilityState({
    required DateTime joinedAt,
    required DateTime scheduleStart,
  }) {
    return isEligibleForCurrentMicro(joinedAt: joinedAt, scheduleStart: scheduleStart)
        ? 'ELIGIBLE'
        : 'NOT_ELIGIBLE_LATE_ENTRY';
  }

  // ===================================================
  // GET NEXT MICRO TEST (Helper for UI Countdown)
  // ===================================================

  static DateTime getNextMicroTest({
    required DateTime enrollmentTime,
    MissionCrucibleBlueprint? blueprint,
    String? missionId,
  }) {
    final bp = _resolveBlueprint(missionId: missionId, explicitBlueprint: blueprint);
    final now = DateTime.now();
    final normalizedStart = getNormalizedStart(enrollmentTime);
    if (now.isBefore(normalizedStart)) {
      return normalizedStart.add(Duration(hours: bp.learningHoursPerSchedule));
    }
    final difference = now.difference(normalizedStart);
    final totalHours = difference.inHours;
    final cycleHours = bp.cycleLengthDays * 24;
    final currentCycleHours = totalHours % cycleHours;
    final phaseHours = (bp.cycleLengthDays ~/ bp.phaseCount) * 24;
    final phaseElapsed = currentCycleHours % phaseHours;
    final studyDuration = bp.schedulesPerPhase * bp.hoursPerSchedule;

    if (phaseElapsed < studyDuration) {
      final scheduleElapsed = phaseElapsed % bp.hoursPerSchedule;
      final scheduleStartOffset = currentCycleHours - scheduleElapsed;
      return normalizedStart.add(Duration(
        hours: (totalHours - currentCycleHours) + scheduleStartOffset + bp.learningHoursPerSchedule,
      ));
    } else {
      final currentPhase = currentCycleHours ~/ phaseHours;
      final nextPhaseStart = (currentPhase + 1) * phaseHours;
      return normalizedStart.add(Duration(
        hours: (totalHours - currentCycleHours) + nextPhaseStart + bp.learningHoursPerSchedule,
      ));
    }
  }
}
