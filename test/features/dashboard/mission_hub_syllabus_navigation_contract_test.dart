import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Source-level navigation regression: does not require production Firebase,
/// a live mission, or Student account credentials. The normal Flutter/Android
/// build remains the separate compile and runtime acceptance gate.
void main() {
  test('Mission Hub exposes canonical Syllabus instead of duplicate Test Arena',
      () {
    final dashboard = File(
      'lib/features/dashboard/presentation/screens/dashboard_screen.dart',
    ).readAsStringSync();
    final missionHub = dashboard
        .split("'MISSION HUB'")
        .last
        .split("'BATTLE TOOLS'")
        .first;

    expect(missionHub, contains("'THE CRUCIBLE'"));
    expect(missionHub, contains("'DIGIBOOK'"));
    expect(missionHub, contains("'SYLLABUS'"));
    expect(missionHub, contains("'CAREER SIGNALS'"));
    expect(missionHub, isNot(contains("'TEST ARENA'")));
    expect(missionHub, contains('context.go(AppRoutes.syllabus)'));
    expect(missionHub, isNot(contains('context.push(AppRoutes.testArena)')));
  });

  test('Test Arena is still present in Battle Tools, not removed globally', () {
    final grid = File(
      'lib/features/dashboard/presentation/widgets/battle_tools/battle_tools_grid.dart',
    ).readAsStringSync();
    final arenaCard = File(
      'lib/features/dashboard/presentation/widgets/battle_tools/test_arena_card.dart',
    ).readAsStringSync();
    expect(RegExp(r'TestArenaCard\\(\\)').allMatches(grid).length, 1);
    expect(arenaCard, contains('route: AppRoutes.testArena'));
    expect(arenaCard, contains('toolKey: "test_arena"'));
  });

  test('existing Syllabus route loads mission-aware SyllabusScreen provider',
      () {
    final router = File('lib/core/router/app_router.dart').readAsStringSync();
    final syllabus = File(
      'lib/features/syllabus/presentation/screens/syllabus_screen.dart',
    ).readAsStringSync();
    final treeProvider = File(
      'lib/features/syllabus/presentation/providers/syllabus_tree_provider.dart',
    ).readAsStringSync();

    expect(router, contains('path: AppRoutes.syllabus'));
    expect(router, contains('builder: (context, state) => const SyllabusScreen()'));
    expect(syllabus, contains('ref.watch(syllabusTreeProvider)'));
    expect(treeProvider, contains('ref.watch(allNodesProvider)'));
    expect(treeProvider, contains('ref.watch(knowledgeEngineProvider)'));
  });
}
