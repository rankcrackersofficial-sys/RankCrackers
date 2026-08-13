/// 🔱 CRUCIBLE CLOCK ENGINE
/// Sovereign authority for time arithmetic and boundary logic.
class CrucibleClockEngine {
  // ===================================================
  // FIXED TIMES
  // ===================================================

  static const int courseStartHour = 10;
  static const int testStartHour = 9;

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
  // NORMALIZE START TIME
  // ===================================================

  static DateTime getNormalizedStart(DateTime time) {
    return DateTime(
      time.year,
      time.month,
      time.day,
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
    final normalizedStart = getNormalizedStart(state.protocolStartTime);
    if (now.isBefore(normalizedStart)) {
      return Duration.zero;
    }

    int elapsedMs = now.difference(normalizedStart).inMilliseconds;
    elapsedMs -= (state.pausedDurationMs as int);

    if ((state.isPaused as bool) && state.pausedAt != null) {
      final pauseOffset = now.difference(state.pausedAt as DateTime).inMilliseconds;
      if (pauseOffset > 0) {
        elapsedMs -= pauseOffset;
      }
    }

    return Duration(milliseconds: elapsedMs < 0 ? 0 : elapsedMs);
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
    return day.clamp(1, 101);
  }

  // ===================================================
  // GET ACTIVE SCHEDULE INDEX (Legacy Compatibility)
  // ===================================================

  static int getScheduleIndex({
    required DateTime enrollmentTime,
  }) {
    final cycleStart = getNormalizedStart(enrollmentTime);
    final difference = DateTime.now().difference(cycleStart);
    final days = difference.inDays;
    return days ~/ 2;
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
    final phaseDay = days % 15;
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
    final phaseDay = days % 15;
    return phaseDay == 14 && now.hour >= 9 && now.hour <= 11;
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
