import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('shared Founder navigation has a non-clipping desktop hit area', () {
    final source =
        File('lib/web/shared/unified_command_console.dart').readAsStringSync();
    expect(source, contains('Size.fromHeight(102)'));
    expect(source, contains('height: 54'));
    expect(source, contains('BoxConstraints(minHeight: 48)'));
    expect(source, contains('EdgeInsets.fromLTRB(24, 11, 24, 10)'));
    expect(source, contains('height: 1.2'));
  });

  test('Mission Control has one contextual Mission Variables authority', () {
    final center = File(
            'lib/features/admin/presentation/widgets/mission_control/mission_control_center.dart')
        .readAsStringSync();
    final room =
        File('lib/web/founder/mission_control/mission_control_room.dart')
            .readAsStringSync();
    expect(center, contains('CREATE NEW MISSION'));
    expect(center, isNot(contains('CREATE NEW MISSION REALM')));
    expect(center, isNot(contains("title: 'MISSION VARIABLES'")));
    expect(room, contains("label: const Text('MISSION VARIABLES')"));
    expect('NEXT ACTION'.allMatches(room).length, 1);
  });

  test(
      'Mission Variables defaults to structured packs and hides JSON in Advanced',
      () {
    final source = File(
            'lib/web/founder/mission_control/mission_variable_authority_panel.dart')
        .readAsStringSync();
    for (final pack in const [
      'vacancy_variables',
      'eligibility_variables',
      'paper_variables',
      'category_variables',
      'subject_variables',
      'department_variables',
      'fee_variables',
      'date_variables',
      'relaxation_variables',
      'link_variables',
      'amendment_variables',
    ]) {
      expect(source, contains("'$pack'"));
    }
    expect(source, contains('Medium Policy'));
    expect(source, contains('Supported Mediums'));
    expect(source, contains('Default Medium'));
    expect(source, contains('ADVANCED TECHNICAL VIEW'));
    expect(source, contains('REVIEW AND SAVE CHANGES'));
  });

  test('Founder surfaces avoid fixture labels and raw backend status codes',
      () {
    final founderSources = [
      'lib/web/founder/health/founder_student_health_web.dart',
      'lib/web/founder/mission_control/mission_publish_readiness_panel.dart',
      'lib/web/shared/unified_command_console.dart',
    ].map((path) => File(path).readAsStringSync()).join('\n');
    expect(founderSources, isNot(contains('Visual Active Mission')));
    expect(founderSources, isNot(contains('Visual Archived Mission')));
    expect(founderSources, isNot(contains('RUNTIME_PROOF_PENDING')));
    expect(founderSources, isNot(contains('NOT_READY')));
    expect(founderSources, contains('AWAITING RUNTIME PROOF'));
    expect(founderSources, contains('NOT READY'));
  });

  test('pipeline pages use concise verification wording and compact cards', () {
    final source =
        File('lib/web/shared/unified_command_console.dart').readAsStringSync();
    expect(source, contains("title: 'Syllabus Verification'"));
    expect(source, contains("title: 'PYQ Verification'"));
    expect(source, contains("title: 'Exam Rule Verification'"));
    expect(source, contains('SliverGridDelegateWithMaxCrossAxisExtent'));
    expect(source, contains('maxCrossAxisExtent: 360'));
    expect(
        source, contains('MissionPublishReadinessPanel(missionId: missionId)'));
  });
}
