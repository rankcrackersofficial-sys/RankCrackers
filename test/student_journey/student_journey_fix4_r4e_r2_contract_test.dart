import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  const repoPath = 'lib/core/backend/recruitment_repository.dart';
  const providerPath =
      'lib/features/auth/presentation/providers/mission_realm_provider.dart';
  const missionRealmPath =
      'lib/features/auth/presentation/screens/mission_realm_screen.dart';
  const dashboardPath =
      'lib/features/dashboard/presentation/screens/dashboard_screen.dart';
  const commandHeaderPath = 'lib/shared/widgets/command_header.dart';
  const fixturePath =
      'assets/data/emulator/founder_mission_exact_production_inventory_20260811065513.json';

  test('student_mission_catalog is the primary Student Mission Realm source',
      () {
    final repo = File(repoPath).readAsStringSync();
    final provider = File(providerPath).readAsStringSync();

    expect(repo, contains('streamStudentMissionCatalogRecruitments'));
    expect(provider, contains('student_mission_catalog'));
    expect(repo, isNot(contains('assessment_preview_manifest.json')));
    expect(repo, isNot(contains('_loadEmulatorPreviewMissions')));
  });

  test('emulator fixture preserves exact exported mission identities', () {
    final fixture = jsonDecode(File(fixturePath).readAsStringSync())
        as Map<String, dynamic>;
    final missions = fixture['missions'] as List<dynamic>;

    expect(fixture['source'], 'ONE_TIME_PRODUCTION_EXPORT_DERIVED');
    expect(fixture['environment'], 'EMULATOR_ONLY');
    expect(
        missions.map((m) => m['realmId']),
        containsAll(<String>[
          'jee_main_2026',
          'neet_(ug)-2027',
          'RPSC_FIRST_GRADE2026_2026_1782713222215',
        ]));
    expect(missions.length, 3);
    for (final mission in missions.cast<Map<String, dynamic>>()) {
      expect(mission['category'], isNull);
      expect(mission['userPanelVisible'], true);
      expect(mission['cardVisible'], true);
    }
  });

  test('Mission Realm restores source-backed category filters without guessing',
      () {
    final source = File(missionRealmPath).readAsStringSync();
    final firestore =
        File('lib/core/firebase/firestore_service.dart').readAsStringSync();

    expect(source, contains('AVAILABLE MISSIONS'));
    expect(source, contains('COMPETITIVE MISSIONS'));
    expect(source, contains('QUALIFYING MISSIONS'));
    expect(source, contains('CATEGORY PENDING VERIFICATION'));
    expect(source, contains("category == 'competitive'"));
    expect(source, contains("category == 'qualifying'"));
    expect(source, isNot(contains("category.contains('competitive')")));
    expect(source, isNot(contains("category.contains('qualifying')")));
    expect(source, isNot(contains('selectedCategory')));
    expect(firestore, contains("data['examCategory']"));
    expect(firestore, contains("data['exam_category']"));
    expect(firestore, contains("data['missionType']"));
  });

  test('Dashboard missing evidence is not rendered as fake zero or LOW', () {
    final dashboard = File(dashboardPath).readAsStringSync();
    final header = File(commandHeaderPath).readAsStringSync();

    expect(dashboard, contains('PENDING'));
    expect(dashboard, contains('STARTS SOON'));
    expect(dashboard, contains('NO ACTIVITY'));
    expect(dashboard, contains('NEEDS EVIDENCE'));
    expect(dashboard, isNot(contains('readiness?.score ?? 0')));
    expect(dashboard, isNot(contains('coverage?.coveragePercent ?? 0')));
    expect(dashboard, isNot(contains('studyStreakDays ?? 0')));
    expect(header, contains('MISSION EVIDENCE PENDING'));
    expect(header, isNot(contains('readiness?.score ?? 0')));
  });

  test('Mission Realm mojibake guard remains clean', () {
    final source = File(missionRealmPath).readAsStringSync();
    const badCodeUnits = <int>[0x00c3, 0x00f0, 0x0178, 0x00e2];
    for (final codeUnit in badCodeUnits) {
      expect(source.contains(String.fromCharCode(codeUnit)), isFalse,
          reason: 'mojibake code unit $codeUnit');
    }
  });
}
