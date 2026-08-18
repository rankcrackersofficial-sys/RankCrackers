import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

String read(String path) => File(path).readAsStringSync();

void main() {
  group('RC Panel Link 03 source contract', () {
    test('dashboard battle tool routes are registered', () {
      final router = read('lib/core/router/app_router.dart');

      expect(router, contains('path: AppRoutes.pyqVault'));
      expect(router, contains('path: AppRoutes.progressTracker'));
      expect(router, contains('path: AppRoutes.revisionDesk'));
      expect(router, contains('path: AppRoutes.testArena'));
      expect(router, contains('const PyqVaultScreen()'));
      expect(router, contains('const ProgressTrackerScreen()'));
      expect(router, contains('const RevisionDeskScreen()'));
      expect(router, contains('const TestArenaScreen()'));
    });

    test('student fake metrics are removed from linked surfaces', () {
      final files = [
        'lib/features/opportunities/screens/opportunities_screen.dart',
        'lib/features/progress_tracker/presentation/screens/progress_tracker_screen.dart',
        'lib/features/pyq/presentation/screens/pyq_vault_screen.dart',
        'lib/features/test_arena/presentation/screens/test_arena_screen.dart',
        'lib/features/revision/presentation/screens/revision_desk_screen.dart',
      ];
      final combined = files.map(read).join('\n');

      for (final forbidden in [
        'Eligible Paths", "12',
        'Priority Alerts", "4',
        'Category Benefits", "ACTIVE',
        'SCORE',
        '#82',
        '78%',
        '6.5 Hr',
        '2,340',
        '12Y',
        '248',
        'RAS Full Test',
        '64%',
      ]) {
        expect(combined, isNot(contains(forbidden)));
      }

      expect(combined, contains('Career Signals are not ready yet'));
      expect(combined, contains('Rank Radar is not ready yet'));
      expect(combined, contains('PYQ Vault is not ready yet'));
      expect(combined, contains('Test Arena is not ready yet'));
      expect(combined, contains('Revision Desk is not ready yet'));
    });

    test('dashboard cards no longer advertise fake readiness', () {
      final files = [
        'lib/features/dashboard/presentation/widgets/battle_tools/pyq_vault_card.dart',
        'lib/features/dashboard/presentation/widgets/battle_tools/test_arena_card.dart',
        'lib/features/dashboard/presentation/widgets/battle_tools/revision_desk_card.dart',
        'lib/features/dashboard/presentation/widgets/battle_tools/rank_radar_card.dart',
      ];
      final combined = files.map(read).join('\n');

      expect(combined, isNot(contains('2,340 Questions')));
      expect(combined, isNot(contains('Compete & Analyze')));
      expect(combined, isNot(contains('Weak Topics')));
      expect(combined, isNot(contains('Live Competition')));
      expect(
          RegExp(r'subtitle: "Not Ready"').allMatches(combined), hasLength(4));
    });

    test('founder health observability is connected and read-only', () {
      final console = read('lib/web/shared/unified_command_console.dart');
      final health =
          read('lib/web/founder/health/founder_student_health_web.dart');

      expect(console, contains('Student Health / Panel Linkage'));
      expect(console, contains('FounderStudentHealthWeb'));
      expect(health, contains("collection('student_panel_health')"));
      expect(health, contains('canFounderMutateTruth'));
      expect(health, isNot(contains('.set(')));
      expect(health, isNot(contains('.update(')));
      expect(health, isNot(contains('.delete(')));
    });

    test('runtime video regressions stay fail-closed', () {
      final dashboard = read(
          'lib/features/dashboard/presentation/screens/dashboard_screen.dart');
      final archive = read(
          'lib/features/dashboard/presentation/widgets/archive/archive_preview_card.dart');
      final sentinel = read(
          'lib/features/opportunities/presentation/widgets/sentinel_intelligence_card.dart');
      final crucible = read(
          'lib/features/crucible/presentation/screens/crucible_screen.dart');
      final battle = read(
          'lib/features/crucible/presentation/widgets/battle_engine_card.dart');

      expect(dashboard, contains('hasReadinessEvidence'));
      expect(dashboard, contains('hasCoverageEvidence'));
      expect(dashboard, contains('hasRiskEvidence'));
      expect(dashboard, isNot(contains('STARTS SOON')));
      expect(dashboard, isNot(contains('NO ACTIVITY')));

      expect(archive, isNot(contains('Medieval Rajasthan')));
      expect(archive, isNot(contains('42% Complete')));
      expect(archive, contains('ARCHIVE EVIDENCE PENDING'));
      expect(archive, contains('context.push(AppRoutes.digibook)'));

      expect(sentinel, contains('context.push(AppRoutes.sentinelCenter)'));
      expect(sentinel, contains('metricsAsync.hasValue'));
      expect(sentinel, isNot(contains('?? "0"')));

      expect(crucible, contains('final currentCycleDay = currentDay'));
      expect(crucible, contains('final phase = currentPhase'));
      expect(crucible, contains('hasCrucibleEvidence'));
      expect(battle, contains('EVIDENCE PENDING'));
      expect(battle, contains('hasEvidence'));
    });
  });
}
