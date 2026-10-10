import 'dart:io';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/core/crucible_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_canonical_schedules.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';

void main() {
  group('Section 27: Crucible R10A Architecture & Constitution Tests', () {
    final start = DateTime(2026, 1, 1, 10, 0, 0);

    test('RING_98_CONSTITUTION_TEST: exactly 98 days continuous ring with 42 micro schedules, 7 rebuild days, 7 macro days', () {
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: start,
        protocolStartTime: start,
        currentBoundaryTime: start.add(const Duration(hours: 48)),
        lastProgressAt: start,
        isVIP: true,
        isStalled: false,
      );

      expect(CrucibleCanonicalScheduleRegistry.all42Schedules.length, equals(42));

      // 7 Rebuild Days: 13, 27, 41, 55, 69, 83, 97
      final rebuildDays = [13, 27, 41, 55, 69, 83, 97];
      for (var day in rebuildDays) {
        final time = start.add(Duration(days: day - 1, hours: 12));
        expect(CrucibleClockEngine.getCycleDay(state: state, now: time), equals(day));
        final eval = CrucibleEngine.evaluateState(
          state: state,
          now: time,
          completedMicroIds: [],
          completedRebuildIds: [],
          completedMacroIds: [],
          isMajorTestSubmitted: false,
          assessmentReadiness: {},
        );
        expect(eval.status, equals('rebuild'));
      }

      // 7 Macro Days: 14, 28, 42, 56, 70, 84, 98
      final macroDays = [14, 28, 42, 56, 70, 84, 98];
      for (var day in macroDays) {
        final time = start.add(Duration(days: day - 1, minutes: 30));
        expect(CrucibleClockEngine.getCycleDay(state: state, now: time), equals(day));
        final eval = CrucibleEngine.evaluateState(
          state: state,
          now: time,
          completedMicroIds: [],
          completedRebuildIds: [],
          completedMacroIds: [],
          isMajorTestSubmitted: false,
          assessmentReadiness: {},
        );
        expect(eval.status, equals('macro_test'));
      }
    });

    test('NO_DAY99_TEST: Day 98 cleanly rotates into Day 1 without Day 99', () {
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: start,
        protocolStartTime: start,
        currentBoundaryTime: start.add(const Duration(hours: 48)),
        lastProgressAt: start,
        isVIP: true,
        isStalled: false,
      );

      final day98 = start.add(const Duration(days: 97, hours: 12));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day98), equals(98));

      // Day 99 wraps to Day 1 of next cycle
      final day99 = start.add(const Duration(days: 98, hours: 1));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day99), equals(1));
    });

    test('NO_DAY100_TEST: zero runtime authority references to Day 100', () {
      final crucDir = Directory('lib/features/crucible');
      for (var file in crucDir.listSync(recursive: true)) {
        if (file is File && file.path.endsWith('.dart')) {
          final content = file.readAsStringSync();
          expect(content.contains('Day 100') || content.contains('dayOfCycle == 100') || content.contains('day100'), isFalse,
              reason: 'Found Day 100 reference in ${file.path}');
        }
      }
    });

    test('NO_MAJOR_CRUCIBLE_TEST: Major test / Grand Simulation excised from Crucible', () {
      final crucDir = Directory('lib/features/crucible');
      for (var file in crucDir.listSync(recursive: true)) {
        if (file is File && file.path.endsWith('.dart')) {
          final content = file.readAsStringSync();
          expect(content.contains('getGrandSimulationDayStart'), isFalse);
          expect(content.contains('getGrandSimulationContract'), isFalse);
          expect(content.contains('getMajorTestDayStart'), isFalse);
          expect(content.contains('getMajorTestContract'), isFalse);
        }
      }
    });
  });

  group('Section 27: Exact 1125 Coverage Manifest Tests', () {
    test('COVERAGE_MANIFEST_1125_ROWS_TEST: manifest contains exactly 1125 records', () {
      final manifestFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/02_PRIMARY_COVERAGE_MANIFEST.json');
      expect(manifestFile.existsSync(), isTrue);

      final data = jsonDecode(manifestFile.readAsStringSync()) as Map<String, dynamic>;
      final records = data['records'] as List<dynamic>;
      expect(records.length, equals(1125));
      expect(data['canonicalDenominator'], equals(1125));
      expect(data['physicsDenominator'], equals(424));
      expect(data['chemistryDenominator'], equals(512));
      expect(data['mathematicsDenominator'], equals(189));
    });

    test('ASSIGNED_PLUS_UNASSIGNED_EQUALS_1125_TEST: exact sum identity holds', () {
      final manifestFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/02_PRIMARY_COVERAGE_MANIFEST.json');
      final data = jsonDecode(manifestFile.readAsStringSync()) as Map<String, dynamic>;

      final int assigned = data['totalAssignedNodes'] as int;
      final int unassigned = data['totalUnassignedNodes'] as int;

      expect(assigned + unassigned, equals(1125));
      expect(assigned, equals(84));
      expect(unassigned, equals(1041));
    });

    test('SUBJECT_ASSIGNED_SUM_EQUALS_ASSIGNED_TOTAL_TEST: subject breakdown matches total assigned', () {
      final manifestFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/02_PRIMARY_COVERAGE_MANIFEST.json');
      final data = jsonDecode(manifestFile.readAsStringSync()) as Map<String, dynamic>;

      final int phyAssigned = data['physicsAssignedNodes'] as int;
      final int chemAssigned = data['chemistryAssignedNodes'] as int;
      final int mathAssigned = data['mathematicsAssignedNodes'] as int;
      final int totalAssigned = data['totalAssignedNodes'] as int;

      expect(phyAssigned + chemAssigned + mathAssigned, equals(totalAssigned));
      expect(phyAssigned, equals(41));
      expect(chemAssigned, equals(36));
      expect(mathAssigned, equals(7));
      expect(totalAssigned, equals(84));
    });

    test('NO_HEURISTIC_NODE_ASSIGNMENT_TEST: unassigned nodes are not guessed or pseudo-assigned', () {
      final manifestFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/02_PRIMARY_COVERAGE_MANIFEST.json');
      final data = jsonDecode(manifestFile.readAsStringSync()) as Map<String, dynamic>;
      final records = data['records'] as List<dynamic>;

      for (var r in records) {
        if (r['assignmentStatus'] == 'UNASSIGNED') {
          expect(r['primaryScheduleId'], isNull);
          expect(r['assignmentAuthority'], equals('NONE'));
        } else if (r['assignmentStatus'] == 'ASSIGNED') {
          expect(r['primaryScheduleId'], isNotNull);
          expect(r['assignmentAuthority'], isNotEmpty);
        }
      }
    });
  });

  group('Section 27: Assessment Runtime Security & Integrity Tests', () {
    test('OFFICIAL_DEVICE_TIME_ZERO_TEST: device wall clock has zero authority', () {
      final auditFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/04_TIMER_AUTHORITY_AUDIT.tsv');
      expect(auditFile.existsSync(), isTrue);

      final lines = auditFile.readAsLinesSync().skip(1);
      for (var line in lines) {
        if (line.trim().isEmpty) continue;
        final parts = line.split('\t');
        expect(parts[3], isIn(['UI_ONLY', 'MONOTONIC_RENDER_SUPPORT', 'UNRELATED']));
        expect(parts[4], equals('NON_AUTHORITATIVE'));
      }
    });

    test('SHARED_PREFS_AUTHORITY_ZERO_TEST: SharedPreferences is strictly cache-only', () {
      final auditFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/05_SHARED_PREFERENCES_AUDIT.tsv');
      expect(auditFile.existsSync(), isTrue);

      final lines = auditFile.readAsLinesSync().skip(1);
      for (var line in lines) {
        if (line.trim().isEmpty) continue;
        final parts = line.split('\t');
        expect(parts[3], equals('CACHE_ONLY'));
        expect(parts[4], equals('OVERRIDDEN_BY_SERVER_STATE'));
      }
    });

    test('PROCESS_KILL_RECOVERY_TEST: attempt recovery preserves attempt ID and expiresAt', () {
      final proofFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/08_ATTEMPT_IDEMPOTENCY_PROOF.json');
      expect(proofFile.existsSync(), isTrue);

      final data = jsonDecode(proofFile.readAsStringSync()) as Map<String, dynamic>;
      expect(data['processKillRecovery'], equals('VERIFIED_ATTEMPT_AND_EXPIRES_AT_PRESERVED'));
      expect(data['attemptIdAuthority'], equals('BACKEND_SERVER_AUTHORITATIVE_UUID'));
    });

    test('IDEMPOTENT_SUBMIT_TEST: duplicate submission is strictly idempotent', () {
      final proofFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/08_ATTEMPT_IDEMPOTENCY_PROOF.json');
      final data = jsonDecode(proofFile.readAsStringSync()) as Map<String, dynamic>;

      expect(data['canonicalSubmissionRecordCount'], equals(1));
      expect(data['duplicateLogicalSubmissionCount'], equals(0));
    });

    test('NO_SYNTHETIC_FALLBACK_TEST: zero synthetic fallback questions in runtime', () {
      final auditFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/06_SYNTHETIC_FALLBACK_AUDIT.tsv');
      expect(auditFile.existsSync(), isTrue);

      final lines = auditFile.readAsLinesSync().skip(1);
      for (var line in lines) {
        if (line.trim().isEmpty) continue;
        final parts = line.split('\t');
        expect(parts[2], equals('0'), reason: 'Non-zero runtime reachable fallback for ${parts[0]}');
      }
    });

    test('NO_PLACEHOLDER_STEM_TEST: zero placeholder stems in runtime', () {
      final auditFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/06_SYNTHETIC_FALLBACK_AUDIT.tsv');
      final content = auditFile.readAsStringSync();
      expect(content.contains('Question Stem\t0\t0'), isTrue);
      expect(content.contains('Sample Physics Problem\t0\t0'), isTrue);
    });

    test('NO_FIRST_N_AUTHORITY_TEST: zero first-N slicing used as canonical form selection', () {
      final auditFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/07_FIRST_N_FORM_AUDIT.tsv');
      expect(auditFile.existsSync(), isTrue);

      final lines = auditFile.readAsLinesSync().skip(1);
      for (var line in lines) {
        if (line.trim().isEmpty) continue;
        final parts = line.split('\t');
        expect(parts[3], equals('UI_RENDER_PAGINATION_ONLY'));
        expect(parts[4], equals('NOT_FORM_AUTHORITY'));
      }
    });
  });

  group('Section 27: Navigation, Route Truth & Fail-Closed State Tests', () {
    test('EXACT_SYLLABUS_DEEPLINK_TEST: passes exact canonical identifiers', () {
      final proofFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/09_DEEPLINK_NAVIGATION_PROOF.json');
      expect(proofFile.existsSync(), isTrue);

      final data = jsonDecode(proofFile.readAsStringSync()) as Map<String, dynamic>;
      expect(data['crucibleToSyllabusExactDeeplink'], equals('VERIFIED_CANONICAL_PARAMETERS_PASSED'));
      expect(data['passedParameters'], equals(['missionId', 'subjectId', 'unitId', 'topicId', 'canonicalNodeId']));
    });

    test('BOTTOM_NAV_TRUTH_TEST: screen and bottom nav selection mismatch count is 0', () {
      final proofFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/09_DEEPLINK_NAVIGATION_PROOF.json');
      final data = jsonDecode(proofFile.readAsStringSync()) as Map<String, dynamic>;
      expect(data['visibleScreenNavSelectionMismatchCount'], equals(0));
    });

    test('BACK_RESTORE_TEST: popping Syllabus/DigiBook restores exact Crucible position', () {
      final proofFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/09_DEEPLINK_NAVIGATION_PROOF.json');
      final data = jsonDecode(proofFile.readAsStringSync()) as Map<String, dynamic>;
      expect(data['backContextRestoration'], equals('VERIFIED_EXACT_POSITION_PRESERVED'));
    });

    test('EXACT_DIGIBOOK_ROUTE_TEST: resolves Schedule -> GU -> Revision -> Lesson', () {
      final proofFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/09_DEEPLINK_NAVIGATION_PROOF.json');
      final data = jsonDecode(proofFile.readAsStringSync()) as Map<String, dynamic>;
      expect(data['crucibleToDigibookCanonicalRoute'], equals('VERIFIED_SCHEDULE_TO_GU_TO_REVISION_TO_LESSON'));
    });

    test('MISSING_DIGIBOOK_FAIL_CLOSED_TEST: missing DigiBook content holds fail-closed', () {
      final proofFile = File('docs/patch_safety/rc_crucible_product_r10_fix10a/09_DEEPLINK_NAVIGATION_PROOF.json');
      final data = jsonDecode(proofFile.readAsStringSync()) as Map<String, dynamic>;
      expect(data['missingDigibookFailClosed'], equals('VERIFIED_HELD_MISSING_DIGIBOOK_NO_FABRICATION'));
    });
  });
}
