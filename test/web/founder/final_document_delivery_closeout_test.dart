import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Document Command Center defaults to canonical mission workflow', () {
    final source = File('lib/web/founder/fdc/document_command_center.dart')
        .readAsStringSync();
    expect(source, isNot(contains('MissionFactory')));
    expect(source, contains("collection('student_mission_catalog')"));
    expect(source,
        contains('Select a mission to manage its official source documents.'));
    expect(source, contains('MissionDocumentsTab('));
    expect(source, contains('NO SOURCE DOCUMENT'));
  });

  test('Delivery Preview prioritizes canonical mission delivery truth', () {
    final source = File('lib/main_web.dart').readAsStringSync();
    expect(source, contains("collection('student_mission_catalog')"));
    expect(source, contains('LIVE STUDENT MISSIONS'));
    expect(source, contains('LIVE FOR STUDENTS'));
    expect(source, contains('AUTHORITY REPAIR REQUIRED'));
    expect(source, contains('DELIVERY DETAILS'));
  });

  test('Mission Variables preserves selected mission handoff', () {
    final room =
        File('lib/web/founder/mission_control/mission_control_room.dart')
            .readAsStringSync();
    final panel = File(
            'lib/web/founder/mission_control/mission_variable_authority_panel.dart')
        .readAsStringSync();
    expect(room,
        contains('MissionVariableAuthorityPanel(initialMissionId: missionId)'));
    expect(panel, contains('widget.initialMissionId'));
    expect(panel,
        contains('_selectMission(matches.first.id, matches.first.data())'));
  });
}
