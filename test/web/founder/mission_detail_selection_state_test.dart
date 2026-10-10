import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/web/founder/mission_control/mission_control_room.dart';

void main() {
  setUp(() {
    MissionControlRoom.selectedMissionId = null;
    MissionControlRoom.targetDetailTab = 0;
    MissionControlRoom.targetSubTab = 0;
  });

  tearDown(() {
    MissionControlRoom.selectedMissionId = null;
    MissionControlRoom.targetDetailTab = 0;
    MissionControlRoom.targetSubTab = 0;
  });

  testWidgets('mission selection rebuilds detail without stale state',
      (tester) async {
    const missions = <String, String>{
      'rpsc_1st_grade_2026': 'RPSC 1st Grade',
      'jee_main_2027': 'JEE Main 2027',
      'neet_ug_2027': 'NEET (UG)-2027',
    };

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MissionControlRoom(
            missionListBuilderForTest: (context, onSelected) => ListView(
              children: missions.entries
                  .map(
                    (entry) => ListTile(
                      key: ValueKey('row-${entry.key}'),
                      title: Text(entry.value),
                      subtitle: Text(entry.key),
                      onTap: () => onSelected(entry.key),
                    ),
                  )
                  .toList(),
            ),
            missionDetailBuilderForTest:
                (context, missionId, onBack, onOpenVariables) => Scaffold(
              body: Column(
                children: [
                  Text('MISSION DETAIL — ${missions[missionId]}'),
                  Text(missionId, key: const ValueKey('selected-mission-id')),
                  TextButton(onPressed: onBack, child: const Text('BACK')),
                  TextButton(
                      onPressed: onOpenVariables,
                      child: const Text('MISSION VARIABLES')),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.text('RPSC 1st Grade'), findsOneWidget);
    expect(find.text('JEE Main 2027'), findsOneWidget);
    expect(find.text('NEET (UG)-2027'), findsOneWidget);

    for (final entry in missions.entries) {
      await tester.tap(find.byKey(ValueKey('row-${entry.key}')));
      await tester.pump();
      expect(MissionControlRoom.selectedMissionId, entry.key);
      expect(find.text('MISSION DETAIL — ${entry.value}'), findsOneWidget);
      expect(find.text(entry.key), findsOneWidget);
      for (final other
          in missions.entries.where((item) => item.key != entry.key)) {
        expect(find.text('MISSION DETAIL — ${other.value}'), findsNothing);
      }
      expect(find.text('MISSION VARIABLES'), findsOneWidget);
      await tester.tap(find.text('BACK'));
      await tester.pump();
    }
  });
}
