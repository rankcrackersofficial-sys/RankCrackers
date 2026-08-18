import '../models/crucible_protocol_state.dart';

/// 🔱 CRUCIBLE CLOCK ENGINE
/// Sovereign authority for time arithmetic and boundary logic.
class CrucibleClockEngine {
  // ===================================================
  // FIXED TIMES
  // ===================================================

  static const int courseStartHour = 10;
  static const int testStartHour = 9;

  /// Day 101 is used as an internal terminal sentinel day signifying completion of the 100-day timeline.
  static const int terminalDaySentinel = 101;

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
        10, 0, 0
      );
    } else {
      final targetDate = hour >= 22
          ? enrollmentTime.add(const Duration(days: 1))
          : enrollmentTime;
      return DateTime(
        targetDate.year,
        targetDate.month,
        targetDate.day,
        10, 0, 0
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
    // Time continues ticking forward even while paused.
    return now.difference(start);
  }

  // ===================================================
  // CALCULATE CURRENT PROTOCOL DAY (1-101)
  // ===================================================

  static int getProtocolDay({
    required dynamic state, // Supports CrucibleProtocolState
    required DateTime now,
  }) {
    final elapsed = calculateActiveElapsed(state: state, now: now);
    final day = (elapsed.inSeconds ~/ (24 * 3600)) + 1;
    return day.clamp(1, terminalDaySentinel);
  }

  // ===================================================
  // GET ACTIVE SCHEDULE INDEX (Legacy Compatibility)
  // ===================================================

  static int getScheduleIndex({
    required DateTime enrollmentTime,
  }) {
    final now = DateTime.now();
    final normalizedStart = getNormalizedStart(enrollmentTime);
    final difference = now.difference(normalizedStart);
    final days = difference.inDays;
    final phaseDay = days % 14;

    final phaseIndex = (days ~/ 14).clamp(0, 6);
    int studyDayOffset = phaseDay;
    if (phaseDay >= 12) {
      studyDayOffset = 11; // Caps index during rebuild/macro
    }

    final scheduleIdx = (phaseIndex * 6) + (studyDayOffset ~/ 2);
    return scheduleIdx.clamp(0, 41);
  }

  // ===================================================
  // GET NEXT MICRO TEST (Legacy Compatibility)
  // ===================================================

  static DateTime getNextMicroTest({
    required DateTime enrollmentTime,
  }) {
    final schedule = getScheduleIndex(
      enrollmentTime: enrollmentTime,
    );
    final testDay = schedule * 2 + 2;
    return DateTime(
      enrollmentTime.year,
      enrollmentTime.month,
      enrollmentTime.day + testDay,
      testStartHour,
    );
  }

  // ===================================================
  // IS REBUILD PHASE (Legacy Compatibility)
  // ===================================================

  static bool isRebuildPhase({
    required DateTime enrollmentTime,
  }) {
    final normalizedStart = getNormalizedStart(enrollmentTime);
    final difference = DateTime.now().difference(normalizedStart);
    final days = difference.inDays;
    final phaseDay = days % 14;
    return phaseDay == 12 || phaseDay == 13;
  }

  // ===================================================
  // IS MACRO TEST ACTIVE (Legacy Compatibility)
  // ===================================================

  static bool isMacroTestWindow({
    required DateTime enrollmentTime,
  }) {
    final now = DateTime.now();
    final normalizedStart = getNormalizedStart(enrollmentTime);
    final difference = now.difference(normalizedStart);
    final days = difference.inDays;
    final phaseDay = days % 14;
    return phaseDay == 13 && now.hour >= 9 && now.hour <= 11;
  }

  // ===================================================
  // GET REMAINING DURATION
  // ===================================================

  static Duration getRemainingDuration({required DateTime now}) {
    final cycleEnd = DateTime(
      now.year,
      now.month,
      now.day,
      23,
      59,
      59,
    );
    if (cycleEnd.isBefore(now)) {
      return Duration.zero;
    }
    return cycleEnd.difference(now);
  }

  // ===================================================
  // GET HOURS REMAINING
  // ===================================================

  static int getHoursRemaining() {
    return getRemainingDuration(now: DateTime.now()).inHours;
  }

  // ===================================================
  // GET SOVEREIGN WINDOW TYPE
  // ===================================================

  static String getWindowType({
    required CrucibleProtocolState state,
    required DateTime now,
  }) {
    if (now.isBefore(state.protocolStartTime)) {
      return 'LEARNING';
    }
    final elapsed = now.difference(state.protocolStartTime);
    if (elapsed.inSeconds >= 100 * 24 * 3600) {
      return 'TERMINAL';
    }
    if (elapsed.inSeconds >= 99 * 24 * 3600) {
      return 'MAJOR';
    }
    if (elapsed.inSeconds >= 98 * 24 * 3600) {
      return 'GRAND_SIMULATION';
    }
    final phaseIndex = (elapsed.inSeconds ~/ (14 * 24 * 3600)) + 1;
    final phaseStart = state.protocolStartTime.add(Duration(days: (phaseIndex - 1) * 14));
    final elapsedWithinPhase = now.difference(phaseStart);

    final rebuildStart = const Duration(days: 12);
    final macroStart = const Duration(days: 12, hours: 23);
    final macroEnd = const Duration(days: 13, hours: 1);

    if (elapsedWithinPhase < rebuildStart) {
      final elapsedWithinSchedule = elapsedWithinPhase.inHours % 48;
      if (elapsedWithinSchedule >= 47) {
        return 'MICRO';
      }
      return 'LEARNING';
    } else if (elapsedWithinPhase < macroStart) {
      return 'REBUILD';
    } else if (elapsedWithinPhase < macroEnd) {
      return 'MACRO';
    } else {
      return 'RECOVERY';
    }
  }

  // ===================================================
  // GET SOVEREIGN WINDOW BOUNDS
  // ===================================================

  static Map<String, dynamic> getCurrentWindowBounds({
    required CrucibleProtocolState state,
    required DateTime now,
  }) {
    final type = getWindowType(state: state, now: now);
    final elapsed = now.difference(state.protocolStartTime);
    if (elapsed.inSeconds >= 100 * 24 * 3600) {
      return {
        'type': 'TERMINAL',
        'start': state.protocolStartTime.add(const Duration(days: 100)),
        'end': state.protocolStartTime.add(const Duration(days: 101)),
      };
    }
    if (elapsed.inSeconds >= 99 * 24 * 3600) {
      return {
        'type': 'MAJOR',
        'start': state.protocolStartTime.add(const Duration(days: 99)),
        'end': state.protocolStartTime.add(const Duration(days: 100)),
      };
    }
    if (elapsed.inSeconds >= 98 * 24 * 3600) {
      return {
        'type': 'GRAND_SIMULATION',
        'start': state.protocolStartTime.add(const Duration(days: 98)),
        'end': state.protocolStartTime.add(const Duration(days: 99)),
      };
    }
    final phaseIndex = (elapsed.inSeconds ~/ (14 * 24 * 3600)) + 1;
    final phaseStart = state.protocolStartTime.add(Duration(days: (phaseIndex - 1) * 14));
    final elapsedWithinPhase = now.difference(phaseStart);

    final rebuildStart = const Duration(days: 12);
    final macroStart = const Duration(days: 12, hours: 23);
    final macroEnd = const Duration(days: 13, hours: 1);
    final phaseEnd = const Duration(days: 14);

    if (elapsedWithinPhase < rebuildStart) {
      final scheduleOffset = elapsedWithinPhase.inHours ~/ 48;
      final learningStart = phaseStart.add(Duration(days: scheduleOffset * 2));
      if (type == 'MICRO') {
        return {
          'type': 'MICRO',
          'start': learningStart.add(const Duration(hours: 47)),
          'end': learningStart.add(const Duration(hours: 48)),
        };
      }
      return {
        'type': 'LEARNING',
        'start': learningStart,
        'end': learningStart.add(const Duration(hours: 47)),
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
        'type': 'RECOVERY',
        'start': phaseStart.add(macroEnd),
        'end': phaseStart.add(phaseEnd),
      };
    }
  }

  // ===================================================
  // GET SOVEREIGN WINDOW REMAINING DURATION
  // ===================================================

  static Duration getWindowRemainingDuration({
    required CrucibleProtocolState state,
    required DateTime now,
  }) {
    final bounds = getCurrentWindowBounds(state: state, now: now);
    final end = bounds['end'] as DateTime;
    if (end.isBefore(now)) {
      return Duration.zero;
    }
    return end.difference(now);
  }
}
