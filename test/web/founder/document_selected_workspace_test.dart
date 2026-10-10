import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/web/founder/fdc/document_command_center.dart';
import 'package:rank_crackers/web/founder/mission_control/mission_control_room.dart';

void main() {
  setUp(() {
    MissionControlRoom.selectedMissionId = null;
  });

  testWidgets(
      'mission picker rebuilds RPSC then JEE workspace without stale selection',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: DocumentCommandCenter(
      missionPickerBuilderForTest: (context, select) => Column(children: [
        TextButton(
            onPressed: () => select('rpsc_1st_grade_2026'),
            child: const Text('Select RPSC')),
        TextButton(
            onPressed: () => select('jee_main_2027'),
            child: const Text('Select JEE')),
      ]),
      workspaceBuilderForTest: (context, id, change) => Column(children: [
        Text('WORKSPACE:$id'),
        TextButton(onPressed: change, child: const Text('Change mission')),
      ]),
    )));

    expect(find.text('Select RPSC'), findsOneWidget);
    await tester.tap(find.text('Select RPSC'));
    await tester.pump();
    expect(find.text('WORKSPACE:rpsc_1st_grade_2026'), findsOneWidget);
    expect(MissionControlRoom.selectedMissionId, 'rpsc_1st_grade_2026');

    await tester.tap(find.text('Change mission'));
    await tester.pump();
    await tester.tap(find.text('Select JEE'));
    await tester.pump();
    expect(find.text('WORKSPACE:jee_main_2027'), findsOneWidget);
    expect(find.text('WORKSPACE:rpsc_1st_grade_2026'), findsNothing);
    expect(MissionControlRoom.selectedMissionId, 'jee_main_2027');
  });

  testWidgets('existing selected mission opens workspace without reselection',
      (tester) async {
    MissionControlRoom.selectedMissionId = 'neet_ug_2027';
    await tester.pumpWidget(MaterialApp(
        home: DocumentCommandCenter(
      missionPickerBuilderForTest: (_, __) => const Text('PICKER'),
      workspaceBuilderForTest: (_, id, __) => Text('WORKSPACE:$id'),
    )));
    expect(find.text('WORKSPACE:neet_ug_2027'), findsOneWidget);
    expect(find.text('PICKER'), findsNothing);
  });
}
