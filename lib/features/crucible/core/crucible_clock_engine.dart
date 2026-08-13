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

    final currentNow = (state.isPaused as bool) && state.pausedAt != null
        ? state.pausedAt as DateTime
        : now;

    return currentNow.difference(start);
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
    final difference = now.difference(enrollmentTime);
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
    final difference = DateTime.now().difference(enrollmentTime);
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
    final difference = now.difference(enrollmentTime);
    final days = difference.inDays;
    final phaseDay = days % 14;
    return phaseDay == 13 && now.hour >= 9 && now.hour <= 11;
  }

  // ===================================================
  // GET HOURS REMAINING
  // ===================================================

  static int getHoursRemaining() {
    final now = DateTime.now();
    final cycleEnd = DateTime(
      now.year,
      now.month,
      now.day,
      23,
      59,
    );
    return cycleEnd.difference(now).inHours;
  }
}
