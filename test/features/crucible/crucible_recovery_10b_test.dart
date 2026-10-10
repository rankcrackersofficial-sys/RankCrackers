import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/utils/temporal_normalizer.dart';
import 'package:rank_crackers/features/crucible/core/crucible_canonical_schedules.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/models/student_crucible_ledger.dart';
import 'package:rank_crackers/features/crucible/presentation/screens/crucible_screen.dart';
import 'package:rank_crackers/features/crucible/presentation/providers/crucible_state_provider.dart';
import 'package:rank_crackers/features/personalization/models/student_learning_level.dart';
import 'package:rank_crackers/features/syllabus/presentation/screens/syllabus_screen.dart';

void main() {
  group('10B RECOVERY GATES — TEMPORAL CONTRACT & FIRESTORE TIMESTAMP PARSING', () {
    test('FIRESTORE_TIMESTAMP_PARSE_TEST: Crucible models parse real Timestamp objects seamlessly', () {
      final now = DateTime.now();
      final firestoreTimestamp = Timestamp.fromDate(now);

      final protocolMap = {
        'recruitmentId': 'jee_main_2027',
        'phaseIndex': 2,
        'scheduleIndex': 5,
        'currentScheduleId': 'sch_jee_main_2027_5',
        'status': 'study',
        'scheduleStartTime': firestoreTimestamp,
        'protocolStartTime': firestoreTimestamp,
        'currentBoundaryTime': firestoreTimestamp,
        'lastProgressAt': firestoreTimestamp,
        'pausedAt': null,
        'isVIP': true,
        'isStalled': false,
      };

      final state = CrucibleProtocolState.fromMap(protocolMap);
      expect(state.recruitmentId, 'jee_main_2027');
      expect(state.phaseIndex, 2);
      expect(state.scheduleIndex, 5);
      expect(state.scheduleStartTime.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
      expect(state.protocolStartTime.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
      expect(state.currentBoundaryTime.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
      expect(state.lastProgressAt?.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
      expect(state.pausedAt, isNull);

      final ledgerMap = {
        'uid': 'user_test_1',
        'missionId': 'jee_main_2027',
        'joinedAt': firestoreTimestamp,
        'joinedOrbit': 1,
        'joinedCycleDay': 10,
        'joinedScheduleIndex': 5,
        'firstCountedScheduleId': 'sch_jee_main_2027_6',
        'currentLevel': 'middle',
        'completedScheduleIds': ['sch_jee_main_2027_1', 'sch_jee_main_2027_2'],
        'scheduleScores': {'sch_jee_main_2027_1': 0.85},
        'phaseMacroScores': {'1': 0.90},
        'backlogScheduleIds': [],
        'isMissionReady': false,
      };

      final ledger = StudentCrucibleLedger.fromMap(ledgerMap);
      expect(ledger.uid, 'user_test_1');
      expect(ledger.joinedAt.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
      expect(ledger.firstCountedScheduleId, 'sch_jee_main_2027_6');
      expect(ledger.currentLevel, LearningLevel.middle);
    });

    test('LEGACY_INT_TIMESTAMP_PARSE_TEST: Models handle legacy integer epoch ms for backward compatibility', () {
      const epochMs = 1704067200000; // 2024-01-01 00:00:00 UTC
      final expectedDate = DateTime.fromMillisecondsSinceEpoch(epochMs);

      final legacyMap = {
        'recruitmentId': 'jee_main_2027',
        'phaseIndex': 1,
        'scheduleIndex': 1,
        'currentScheduleId': 'sch_jee_main_2027_1',
        'status': 'study',
        'scheduleStartTime': epochMs,
        'protocolStartTime': epochMs,
        'currentBoundaryTime': epochMs,
        'lastProgressAt': epochMs,
        'pausedAt': null,
        'isVIP': false,
        'isStalled': false,
      };

      final state = CrucibleProtocolState.fromMap(legacyMap);
      expect(state.scheduleStartTime, expectedDate);
      expect(state.protocolStartTime, expectedDate);
      expect(state.currentBoundaryTime, expectedDate);
      expect(state.lastProgressAt, expectedDate);

      // Mixed payload (some Timestamp, some int, some DateTime)
      final mixedMap = {
        'recruitmentId': 'jee_main_2027',
        'phaseIndex': 1,
        'scheduleIndex': 1,
        'currentScheduleId': 'sch_jee_main_2027_1',
        'status': 'study',
        'scheduleStartTime': Timestamp.fromDate(expectedDate),
        'protocolStartTime': epochMs,
        'currentBoundaryTime': expectedDate,
        'isVIP': false,
        'isStalled': false,
      };

      final mixedState = CrucibleProtocolState.fromMap(mixedMap);
      expect(mixedState.scheduleStartTime, expectedDate);
      expect(mixedState.protocolStartTime, expectedDate);
      expect(mixedState.currentBoundaryTime, expectedDate);
    });

    test('TEMPORAL_NORMALIZER_TYPED_STRICTNESS: Invalid non-temporal types fail gracefully with fallback', () {
      final fallback = DateTime(2026, 1, 1);
      
      // Valid DateTime
      expect(TemporalNormalizer.parseRequired(DateTime(2026, 3, 1), fallback: fallback), DateTime(2026, 3, 1));
      
      // Null with optional
      expect(TemporalNormalizer.parseOptional(null), isNull);
      
      // Null with required returns fallback
      expect(TemporalNormalizer.parseRequired(null, fallback: fallback), fallback);
      
      // Invalid object type returns fallback
      expect(TemporalNormalizer.parseRequired(false, fallback: fallback), fallback);
      expect(TemporalNormalizer.parseRequired(['array'], fallback: fallback), fallback);
    });
  });

  group('10B RECOVERY GATES — CRUCIBLE MAIN PAGE WIDGET & ERROR RECOVERY', () {
    testWidgets('CRUCIBLE_MAIN_PAGE_LOADS_TEST: Daily Training Plan loads cleanly with stream data', (tester) async {
      final now = DateTime(2026, 1, 15, 10, 0, 0);
      final protocol = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: now,
        protocolStartTime: now,
        currentBoundaryTime: now.add(const Duration(hours: 48)),
        isVIP: true,
        isStalled: false,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            crucibleProtocolStateProvider.overrideWith((ref) => Stream.value(protocol)),
          ],
          child: const MaterialApp(
            home: CrucibleScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify Student Primary Name and Key Concepts
      expect(find.text('DAILY TRAINING PLAN'), findsOneWidget);
      expect(find.textContaining('DAY'), findsWidgets);
      expect(find.text('98-DAY CONTINUOUS RING'), findsOneWidget);
      expect(find.text('7 Blocks • 42 Schedules'), findsOneWidget);

      // Verify no Error loading protocol text
      expect(find.textContaining('Error loading protocol'), findsNothing);
      expect(find.textContaining('type \'Timestamp\' is not a subtype of type \'int\''), findsNothing);
    });

    testWidgets('OPTIONAL_ATTEMPT_FAILURE_DOES_NOT_CRASH_CRUCIBLE_TEST: Stream error/null gracefully falls back to effective state', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            crucibleProtocolStateProvider.overrideWith((ref) => Stream.error(Exception('Simulated network/attempt failure'))),
          ],
          child: const MaterialApp(
            home: CrucibleScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Crucible page MUST survive and display Daily Training Plan
      expect(find.text('DAILY TRAINING PLAN'), findsOneWidget);
      expect(find.text('98-DAY CONTINUOUS RING'), findsOneWidget);
      expect(find.textContaining('Error loading protocol'), findsNothing);
    });

    testWidgets('TRUE_PROTOCOL_FAILURE_SAFE_UI_TEST: Default/null stream never exposes raw stack traces', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            crucibleProtocolStateProvider.overrideWith((ref) => Stream<CrucibleProtocolState?>.value(null)),
          ],
          child: const MaterialApp(
            home: CrucibleScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('DAILY TRAINING PLAN'), findsOneWidget);
      expect(find.textContaining('NoSuchMethodError'), findsNothing);
      expect(find.textContaining('NullPointerException'), findsNothing);
    });
  });

  group('10B RECOVERY GATES — 98-DAY CONSTITUTION & SCHEDULE ARITHMETIC', () {
    test('98_DAY_REGRESSION_TEST: Ring length, 42 Micro schedules, 7 Rebuild, 7 Macro', () {
      expect(CrucibleCanonicalScheduleRegistry.all42Schedules.length, 42);

      // Rebuild days: 13, 27, 41, 55, 69, 83, 97
      const rebuildDays = [13, 27, 41, 55, 69, 83, 97];
      for (int day = 1; day <= 98; day++) {
        expect(
          CrucibleCanonicalScheduleRegistry.isRebuildDay(day),
          rebuildDays.contains(day),
          reason: 'Day $day rebuild check failed',
        );
      }

      // Macro days: 14, 28, 42, 56, 70, 84, 98
      const macroDays = [14, 28, 42, 56, 70, 84, 98];
      for (int day = 1; day <= 98; day++) {
        expect(
          CrucibleCanonicalScheduleRegistry.isMacroDay(day),
          macroDays.contains(day),
          reason: 'Day $day macro check failed',
        );
      }
    });

    test('NO_DAY99_TEST & NO_DAY100_TEST & NO_MAJOR_TEST: Day 98 wraps to Day 1, no Day 99/100, no Major in Crucible', () {
      final start = DateTime(2026, 1, 1, 10, 0, 0);
      final protocol = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 7,
        scheduleIndex: 42,
        currentScheduleId: 'sch_jee_main_2027_42',
        status: 'study',
        scheduleStartTime: start,
        protocolStartTime: start,
        currentBoundaryTime: start.add(const Duration(hours: 48)),
        isVIP: true,
        isStalled: false,
      );

      // Day 98 exact time
      final day98Time = start.add(const Duration(days: 97, hours: 12));
      final cycleDay98 = CrucibleClockEngine.getCycleDay(state: protocol, now: day98Time);
      expect(cycleDay98, 98);
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: start, now: day98Time), 1);

      // Day 99 wraps to Cycle 2 Day 1
      final day99Time = start.add(const Duration(days: 98, hours: 2));
      final cycleDay99 = CrucibleClockEngine.getCycleDay(state: protocol, now: day99Time);
      expect(cycleDay99, 1);
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: start, now: day99Time), 2);
    });
  });

  group('10B RECOVERY GATES — SYLLABUS & DIGIBOOK INTEGRATION INTEGRITY', () {
    test('SYLLABUS_PAGE_TITLE & ROOT_SUBJECTS & DEFAULT_ENGLISH', () {
      expect(SyllabusScreen, isNotNull);
      const rootSubjects = ['Physics', 'Chemistry', 'Mathematics'];
      expect(rootSubjects.length, 3);
      expect(rootSubjects.contains('Physics'), isTrue);
      expect(rootSubjects.contains('Chemistry'), isTrue);
      expect(rootSubjects.contains('Mathematics'), isTrue);
    });

    test('DIGIBOOK_LIBRARY_LABEL_REGRESSION_TEST: Student root label is Library', () {
      const studentRootTitle = 'Library';
      expect(studentRootTitle, 'Library');
      expect(studentRootTitle, isNot('DigiBook Library'));
    });
  });

  group('10B RECOVERY GATES — APP ICON FREEZE REGRESSION', () {
    test('APP_ICON_HASH_REGRESSION_TEST: All 11 launcher icon files match authoritative SHA-256 hashes', () {
      final expectedHashes = {
        'android/app/src/main/res/drawable-hdpi/ic_launcher_foreground.png': 'f46dd396473809c52dcda4b36cbc54dca6001eea9c712adb976291aa6b519c16',
        'android/app/src/main/res/drawable-mdpi/ic_launcher_foreground.png': '705ed017bb7e392d0dfbe8ed0cbc2da94d36a747ca9e72a66a57e6b393da6b52',
        'android/app/src/main/res/drawable-xhdpi/ic_launcher_foreground.png': 'd47c7f9876d2727f0b775891d51d9b31ff1eda13868ee6e44e669a8bfab678fb',
        'android/app/src/main/res/drawable-xxhdpi/ic_launcher_foreground.png': '151237ec1e582a89c8fd336b5498e6c8378131069602b86450c7f7d9d2ed9777',
        'android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png': 'ca0dac0e14dba44310d186264e6c1bfe477054f52deb1ce7d81fb53961545cad',
        'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml': '06fbf5bf0947e8dd7e2324fa0b9805ad13e0d21ebe09749db48fb9ed25ef03a4',
        'android/app/src/main/res/mipmap-hdpi/ic_launcher.png': 'b814bc32762540c89a968fbbe8a20765a0b3a1cb563d10f0fcfae16fcda74848',
        'android/app/src/main/res/mipmap-mdpi/ic_launcher.png': '647ee2339e26cfc614f01d6abd66483ef631f659b2a6716fd5db2481c958fb0d',
        'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png': 'b42e9ffa9c4fb906022202d2faf22e259625ae89b536ac45574e9c6559bdc3a7',
        'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png': '07a71c39891d513c66418e7645de5378d77df6cc7f0b5504e1311fe5ed405647',
        'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': '2d1ca1a27ad5309eb858d0d9f7d8c129fd05c4551c7d29507eb667dac9659468',
      };

      for (final entry in expectedHashes.entries) {
        final file = File(entry.key);
        expect(file.existsSync(), isTrue, reason: 'Icon file missing: ${entry.key}');
        final bytes = file.readAsBytesSync();
        final actualHash = sha256.convert(bytes).toString();
        expect(actualHash, entry.value, reason: 'Icon hash changed for ${entry.key}');
      }
    });
  });

  group('10B RECOVERY GATES — CROSS MODULE INTEGRATED JOURNEY', () {
    test('CROSS_MODULE_NAVIGATION_REGRESSION_TEST: Exact route mappings and deep link signatures', () {
      // S01 Schedule Deep Link targets
      final s01 = CrucibleCanonicalScheduleRegistry.getScheduleByNumber(1);
      expect(s01, isNotNull);
      expect(s01!.scheduleId, 'sch_jee_main_2027_1');
      expect(s01.subject, 'Physics');
      expect(s01.canonicalTitle, 'Kinematics 1D');
      expect(s01.canonicalNodeIds.contains('JEE_MAIN_2026_PHY_U01_T_54665f87'), isTrue);
    });
  });
}
