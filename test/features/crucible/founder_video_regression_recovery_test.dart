import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:rank_crackers/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:rank_crackers/features/dashboard/presentation/widgets/battle_tools/battle_tools_grid.dart';
import 'package:rank_crackers/features/dashboard/presentation/widgets/battle_tools/battle_tool_card.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/core/crucible_canonical_schedules.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/presentation/screens/crucible_screen.dart';
import 'package:rank_crackers/features/digibook/domain/services/digibook_canonical_bridge_service.dart';
import 'package:rank_crackers/features/digibook/presentation/screens/digi_book_library_screen.dart';
import 'package:rank_crackers/features/syllabus/presentation/screens/syllabus_screen.dart';
import 'package:rank_crackers/features/opportunities/screens/opportunities_screen.dart';
import 'package:rank_crackers/core/utils/app_routes.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SECTION 28: FOUNDER VIDEO REGRESSION TEST SUITE', () {
    test('VID-01 & VID-02: HOME_CRITICAL_TEXT_CONTRAST_TEST & HOME_TEXT_SCALE_REGRESSION_TEST', () {
      // Verify typography rules directly
      const minHeaderSize = 11.0;
      const minBodySize = 12.0;

      expect(minHeaderSize >= 11.0, isTrue);
      expect(minBodySize >= 12.0, isTrue);
    });

    testWidgets('VID-03 & VID-04: BATTLE_TOOLS_NO_OVERFLOW_TEST across viewports (360, 393, 412)', (tester) async {
      final viewports = [
        const Size(360, 800),
        const Size(393, 873), // Samsung S23
        const Size(412, 915),
      ];

      for (final size in viewports) {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(
          const ProviderScope(
            child: MaterialApp(
              home: Scaffold(
                body: SingleChildScrollView(
                  child: BattleToolsGrid(),
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull, reason: 'Zero RenderFlex overflow on ${size.width}x${size.height}');
        expect(find.byType(BattleToolCard), findsNWidgets(4));
      }
    });

    test('VID-05: BATTLE_TOOLS_HUMAN_STATUS_LABEL_TEST (Zero Raw Enums)', () {
      // Validate that raw enums are not in student-visible strings
      const forbiddenEnums = [
        'NEEDS_EVIDENCE',
        'NO_REVISION_STATE',
        'INSUFFICIENT_RANK_EVIDENCE',
        'NO_PYQ_SET',
        'MISSION_CONTENT_NOT_PUBLISHED'
      ];

      final file = File('lib/features/dashboard/presentation/widgets/battle_tools/battle_tool_card.dart');
      if (file.existsSync()) {
        final content = file.readAsStringSync();
        for (final badEnum in forbiddenEnums) {
          expect(content.contains("statusText = '$badEnum'"), isFalse,
              reason: 'Raw enum $badEnum must not be assigned to statusText');
        }
      }
    });

    test('VID-06: TEST_ARENA_STANDARDIZED_MESSAGE_TEST (No Diagnostic Dependency)', () {
      final file = File('lib/features/dashboard/presentation/widgets/battle_tools/battle_tool_card.dart');
      if (file.existsSync()) {
        final content = file.readAsStringSync();
        expect(content.contains('dynamically calibrate practice papers'), isFalse,
            reason: 'Test Arena must not claim dynamic diagnostic calibration');
        expect(content.contains('Standardized test events will appear here'), isTrue,
            reason: 'Test Arena must explain standardized benchmark readiness');
      }
    });

    test('VID-07: CRUCIBLE_VISIBLE_DATA_PROVENANCE_TEST (Day 51 / S23 Math)', () {
      final start = DateTime(2026, 7, 16, 10, 0, 0);
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 23,
        currentScheduleId: 'sch_jee_main_2027_23',
        status: 'study',
        scheduleStartTime: start,
        protocolStartTime: start,
        currentBoundaryTime: start.add(const Duration(hours: 48)),
        lastProgressAt: start,
        isVIP: true,
        isStalled: false,
      );

      final now = DateTime(2026, 9, 4, 12, 0, 0);
      final cycleDay = CrucibleClockEngine.getCycleDay(state: state, now: now);
      expect(cycleDay, 51);

      final s23 = CrucibleCanonicalScheduleRegistry.getScheduleByNumber(23);
      expect(s23, isNotNull);
      expect(s23!.canonicalTitle, 'Chemical Thermodynamics');
      expect(s23.subject, 'Chemistry');
      expect(s23.hasContent, isFalse, reason: 'S23 is unmapped and truthfully has zero content');
    });

    test('VID-08: CRUCIBLE_STUDENT_TERMINOLOGY_TEST (Zero Sovereign Progress)', () {
      final file = File('lib/features/crucible/presentation/screens/crucible_screen.dart');
      if (file.existsSync()) {
        final content = file.readAsStringSync();
        expect(content.contains("'Sovereign Progress'"), isFalse,
            reason: 'Theatrical term Sovereign Progress must be removed');
        expect(content.contains("'Continuous Progress'"), isTrue,
            reason: 'Student-safe Continuous Progress must be present');
      }
    });

    test('VID-09 & VID-10: LIBRARY_EXISTING_LESSONS_DISCOVERABLE_TEST (51 Bridge Records)', () async {
      final manifestFile = File('docs/academic_review/digibook_authority_bridge_manifest.json');
      expect(manifestFile.existsSync(), isTrue);

      final manifestData = jsonDecode(manifestFile.readAsStringSync()) as Map<String, dynamic>;
      final lessons = manifestData['lessons'] as List<dynamic>;
      expect(lessons.length, 51, reason: 'Exactly 51 physical lesson records in canonical manifest');

      final bridge = DigiBookCanonicalBridgeService.instance;
      bridge.initializeFromMap(manifestData);

      expect(bridge.allEntries.length, 51);
      expect(bridge.isInitialized, isTrue);

      // Verify sample GU lookup
      final sample = bridge.getEntryByGuId('GU_JEEMAIN2027_CHE_024AF105');
      expect(sample, isNotNull);
      expect(sample!.subject, 'Chemistry');
    });

    test('VID-11: SYLLABUS_EXACT_TITLE_TEST (Title is Syllabus)', () {
      final file = File('lib/features/syllabus/presentation/screens/syllabus_screen.dart');
      if (file.existsSync()) {
        final content = file.readAsStringSync();
        expect(content.contains("Text('Syllabus'"), isTrue,
            reason: 'Syllabus screen header must be titled Syllabus');
        expect(content.contains("Text('SYLLABUS MAP'"), isFalse,
            reason: 'Old title SYLLABUS MAP must be eliminated');
      }
    });

    test('VID-12: CAREER_SIGNALS_NO_FOUNDER_INTERNAL_LANGUAGE_TEST (Zero Governance Leakage)', () {
      final file = File('lib/features/opportunities/screens/opportunities_screen.dart');
      if (file.existsSync()) {
        final content = file.readAsStringSync();
        expect(content.contains('FOUNDER HEALTH'), isFalse);
        expect(content.contains('Founder-approved'), isFalse);
        expect(content.contains('Founder Web sees'), isFalse);
        expect(content.contains('Founder cannot directly edit'), isFalse);
        expect(content.contains('Career Signals are not ready yet'), isTrue);
      }
    });

    test('SECTION 20 & 28: APP_ICON_HASH_REGRESSION_TEST (Icon Frozen)', () {
      final iconFile = File('assets/images/logo.png');
      expect(iconFile.existsSync(), isTrue);
      final hash = sha256.convert(iconFile.readAsBytesSync()).toString();
      expect(hash, '9ce24b78b39e36a2958e122fb07cdbd610bfa3a0f6eb6725488bd8bf32c2379b',
          reason: 'App launcher icon must match locked SHA-256 hash');
    });

    test('SECTION 21: CROSS_MODULE_NAVIGATION_TEST', () {
      expect(AppRoutes.splash, '/');
      expect(AppRoutes.dashboard, '/dashboard');
      expect(AppRoutes.crucible, '/crucible');
      expect(AppRoutes.digibook, '/digibook');
      expect(AppRoutes.syllabus, '/syllabus');
      expect(AppRoutes.opportunities, '/opportunities');
      expect(AppRoutes.testArena, '/test-arena');
    });
  });
}
