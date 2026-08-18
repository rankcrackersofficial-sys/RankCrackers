import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('current authority index locks mission and evidence routing', () {
    final file = File('docs/authority/CURRENT_AUTHORITY_INDEX.json');
    expect(file.existsSync(), isTrue);

    final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
    final currentAuthority = json['currentAuthority'] as Map<String, dynamic>;
    final nonAuthorityZones = json['nonAuthorityZones'] as Map<String, dynamic>;

    expect(currentAuthority['firebaseProject'], 'rankcrackers-55');
    expect(
      currentAuthority['missionAuthorityPath'],
      'mission_realms/{missionId}',
    );
    expect(
      currentAuthority['studentProjectionPath'],
      'student_mission_catalog/{sameMissionId}',
    );
    expect(currentAuthority['legacyMissionIdsAreProductionAuthority'], isFalse);
    expect(currentAuthority['syntheticReportsAreEvidence'], isFalse);
    expect(
      currentAuthority['missionProjectionLineageFields'],
      containsAll(<String>[
        'sourceMissionId',
        'sourceMissionVersion',
        'sourcePath',
        'sourceType',
        'studentPublicationState',
      ]),
    );

    expect(nonAuthorityZones.keys, contains('patchSafety'));
    expect(nonAuthorityZones.keys, contains('rootReports'));
    expect(nonAuthorityZones.keys, contains('functionOneOffScripts'));
    expect(nonAuthorityZones.keys, contains('previewAssets'));
  });
}
