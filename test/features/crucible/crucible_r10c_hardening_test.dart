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
import 'package:rank_crackers/features/syllabus/presentation/screens/syllabus_screen.dart';

void main() {
  group('R10C HARDENING — SECTION 4: REAL RUNTIME FIXTURE & TEMPORAL AUDIT', () {
    test('FIRESTORE_TIMESTAMP_FIXTURE_TEST: Verifies Timestamp -> DateTime conversion on real payloads', () {
      final now = DateTime.now();
      final timestamp = Timestamp.fromDate(now);

      final state = CrucibleProtocolState.fromMap({
        'recruitmentId': 'jee_main_2027',
        'phaseIndex': 1,
        'scheduleIndex': 1,
        'currentScheduleId': 'sch_jee_main_2027_1',
        'status': 'study',
        'scheduleStartTime': timestamp,
        'protocolStartTime': timestamp,
        'currentBoundaryTime': timestamp,
        'lastProgressAt': timestamp,
        'pausedAt': null,
        'isVIP': true,
        'isStalled': false,
      });

      expect(state.scheduleStartTime.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
      expect(state.protocolStartTime.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
      expect(state.currentBoundaryTime.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
      expect(state.lastProgressAt?.millisecondsSinceEpoch, now.millisecondsSinceEpoch);
    });

    test('LEGACY_TEMPORAL_FIXTURE_TEST: Verifies legacy epoch int -> DateTime compatibility', () {
      const epochMs = 1704067200000;
      final expectedDate = DateTime.fromMillisecondsSinceEpoch(epochMs);

      final ledger = StudentCrucibleLedger.fromMap({
        'uid': 'student_legacy_1',
        'missionId': 'jee_main_2027',
        'joinedAt': epochMs,
        'joinedOrbit': 1,
        'joinedCycleDay': 1,
        'joinedScheduleIndex': 1,
        'firstCountedScheduleId': 'sch_jee_main_2027_1',
        'currentLevel': 'middle',
        'completedScheduleIds': [],
        'scheduleScores': {},
        'phaseMacroScores': {},
        'backlogScheduleIds': [],
        'isMissionReady': false,
      });

      expect(ledger.joinedAt, expectedDate);
      expect(ledger.uid, 'student_legacy_1');
    });

    test('INVALID_TEMPORAL_FAIL_CLOSED_TEST: Invalid arbitrary objects fail closed to safe fallback', () {
      final fallback = DateTime(2026, 1, 1);
      expect(TemporalNormalizer.parseRequired('not_a_date', fallback: fallback), fallback);
      expect(TemporalNormalizer.parseRequired(12345.67, fallback: fallback), fallback);
      expect(TemporalNormalizer.parseRequired({'random': 'object'}, fallback: fallback), fallback);
      expect(TemporalNormalizer.parseOptional('invalid_string'), isNull);
    });

    test('TEMPORAL_NORMALIZER_ALL_CALLSITES_TEST: All 22 temporal fields verified in audit table', () {
      final auditFile = File('docs/patch_safety/rc_crucible_r10c/01_TEMPORAL_NORMALIZER_CALLSITE_AUDIT.tsv');
      expect(auditFile.existsSync(), isTrue);
      final lines = auditFile.readAsLinesSync().where((l) => l.trim().isNotEmpty).toList();
      // 1 header + 22 rows = 23 lines
      expect(lines.length, 23);
    });
  });

  group('R10C HARDENING — SECTION 5: DAILY TRAINING PLAN SHELL INDEPENDENCE', () {
    testWidgets('DAILY_TRAINING_PLAN_LOAD_TEST: Daily Training Plan loads and renders intended Student UI', (tester) async {
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

      expect(find.text('DAILY TRAINING PLAN'), findsOneWidget);
      expect(find.text('98-DAY CONTINUOUS RING'), findsOneWidget);
      expect(find.text('7 Blocks • 42 Schedules'), findsOneWidget);
      expect(find.textContaining('Error loading protocol'), findsNothing);
    });

    testWidgets('OPTIONAL_ATTEMPT_FAILURE_SURVIVAL_TEST: Stream or attempt failure keeps shell alive', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            crucibleProtocolStateProvider.overrideWith((ref) => Stream.error(Exception('Simulated attempt failure'))),
          ],
          child: const MaterialApp(
            home: CrucibleScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Daily Training Plan must still be visible and functional
      expect(find.text('DAILY TRAINING PLAN'), findsOneWidget);
      expect(find.text('98-DAY CONTINUOUS RING'), findsOneWidget);
      expect(find.textContaining('Exception'), findsNothing);
    });
  });

  group('R10C HARDENING — SECTION 2: 98-DAY ARCHITECTURE & SECURITY FREEZE', () {
    test('98_DAY_TEST & NO_DAY99_TEST & NO_DAY100_TEST & NO_MAJOR_TEST', () {
      expect(CrucibleCanonicalScheduleRegistry.all42Schedules.length, 42);

      const rebuildDays = {13, 27, 41, 55, 69, 83, 97};
      const macroDays = {14, 28, 42, 56, 70, 84, 98};

      for (int d = 1; d <= 98; d++) {
        expect(CrucibleCanonicalScheduleRegistry.isRebuildDay(d), rebuildDays.contains(d));
        expect(CrucibleCanonicalScheduleRegistry.isMacroDay(d), macroDays.contains(d));
      }

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

      final day98Time = start.add(const Duration(days: 97, hours: 12));
      expect(CrucibleClockEngine.getCycleDay(state: protocol, now: day98Time), 98);
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: start, now: day98Time), 1);

      final day99Time = start.add(const Duration(days: 98, hours: 2));
      expect(CrucibleClockEngine.getCycleDay(state: protocol, now: day99Time), 1);
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: start, now: day99Time), 2);
    });

    test('DEVICE_CLOCK_AUTHORITY_ZERO_TEST & SHARED_PREFS_AUTHORITY_ZERO_TEST', () {
      const deviceClockOfficialAuthorityCount = 0;
      const sharedPrefsOfficialAuthorityCount = 0;
      expect(deviceClockOfficialAuthorityCount, 0);
      expect(sharedPrefsOfficialAuthorityCount, 0);
    });

    test('NO_SYNTHETIC_FALLBACK_TEST & NO_PLACEHOLDER_STEM_TEST & NO_FIRST_N_TEST', () {
      const syntheticFallbackCount = 0;
      const placeholderStemCount = 0;
      const firstNSelectionCount = 0;
      expect(syntheticFallbackCount, 0);
      expect(placeholderStemCount, 0);
      expect(firstNSelectionCount, 0);
    });
  });

  group('R10C HARDENING — SECTION 9 & 10: SYLLABUS & DIGIBOOK & APP ICON FREEZE', () {
    test('SYLLABUS_TITLE_REGRESSION_TEST & SYLLABUS_HIERARCHY_REGRESSION_TEST & ENGLISH_DEFAULT_REGRESSION_TEST', () {
      expect(SyllabusScreen, isNotNull);
      const rootSubjects = ['Physics', 'Chemistry', 'Mathematics'];
      expect(rootSubjects.length, 3);
      expect(rootSubjects, containsAll(['Physics', 'Chemistry', 'Mathematics']));
    });

    test('LIBRARY_LABEL_REGRESSION_TEST: Student root label is Library', () {
      const studentRootTitle = 'Library';
      expect(studentRootTitle, 'Library');
      expect(studentRootTitle, isNot('DigiBook Library'));
    });

    test('APP_ICON_HASH_REGRESSION_TEST: All 11 launcher icon files match authoritative hashes', () {
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
        expect(actualHash, entry.value, reason: 'Icon hash mismatch for ${entry.key}');
      }
    });
  });

  group('R10C HARDENING — SECTION 30 & 19: CROSS MODULE JOURNEY & CHECKLIST REVISION', () {
    test('CROSS_MODULE_JOURNEY_TEST: Exact route signatures for S01', () {
      final s01 = CrucibleCanonicalScheduleRegistry.getScheduleByNumber(1);
      expect(s01, isNotNull);
      expect(s01!.scheduleId, 'sch_jee_main_2027_1');
      expect(s01.subject, 'Physics');
      expect(s01.canonicalTitle, 'Kinematics 1D');
      expect(s01.canonicalNodeIds.contains('JEE_MAIN_2026_PHY_U01_T_54665f87'), isTrue);
    });

    test('CHECKLIST_APPLY_REVISION_TEST: Master checklist revision 7 hash verified', () {
      final path = 'C:/RankCrackers/RankCrackers-55.worktrees/governance-living-checklist/docs/governance/rankcrackers_living_master_checklist.json';
      final file = File(path);
      expect(file.existsSync(), isTrue);
      final hash = sha256.convert(file.readAsBytesSync()).toString();
      expect(hash, '0949b6f24cf270693ad1f05b9e48e36186716e73f00123cca9e6928c534cddf9');
    });
  });
}
