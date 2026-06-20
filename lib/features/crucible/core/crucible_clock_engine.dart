class CrucibleClockEngine {

  // ===================================================
  // FIXED TIMES
  // ===================================================

  static const int
      courseStartHour = 10;

  static const int
      testStartHour = 9;

  // ===================================================
  // GET CURRENT TACTICAL START
  // ===================================================

  static DateTime
      getCurrentCycleStart() {

    final now = DateTime.now();

    return DateTime(

      now.year,
      now.month,
      now.day,
      courseStartHour,
    );
  }

  // ===================================================
  // GET ACTIVE SCHEDULE INDEX
  // ===================================================

  static int getScheduleIndex({

    required DateTime
        enrollmentTime,
  }) {

    final cycleStart =
        DateTime(

      enrollmentTime.year,

      enrollmentTime.month,

      enrollmentTime.day,

      courseStartHour,
    );

    final difference =

        DateTime.now()
            .difference(
              cycleStart,
            );

    final days =
        difference.inDays;

    return days ~/ 2;
  }

  // ===================================================
  // GET NEXT MICRO TEST
  // ===================================================

  static DateTime
      getNextMicroTest({

    required DateTime
        enrollmentTime,
  }) {

    final schedule =
        getScheduleIndex(

      enrollmentTime:
          enrollmentTime,
    );

    final testDay =
        schedule * 2 + 2;

    return DateTime(

      enrollmentTime.year,

      enrollmentTime.month,

      enrollmentTime.day +
          testDay,

      testStartHour,
    );
  }

  // ===================================================
  // IS REBUILD PHASE
  // ===================================================

  static bool
      isRebuildPhase({

    required DateTime
        enrollmentTime,
  }) {

    final difference =

        DateTime.now()
            .difference(
              enrollmentTime,
            );

    final days =
        difference.inDays;

    final phaseDay =
        days % 15;

    return phaseDay == 12 ||
        phaseDay == 13;
  }

  // ===================================================
  // IS MACRO TEST ACTIVE
  // ===================================================

  static bool
      isMacroTestWindow({

    required DateTime
        enrollmentTime,
  }) {

    final now = DateTime.now();

    final difference =

        now.difference(
          enrollmentTime,
        );

    final days =
        difference.inDays;

    final phaseDay =
        days % 15;

    return phaseDay == 14 &&
        now.hour >= 9 &&
        now.hour <= 11;
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
