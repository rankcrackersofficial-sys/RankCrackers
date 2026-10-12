import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/web/admin/admin_my_access_panel.dart';

void main() {
  testWidgets('My Access shows persisted status and exact grants', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(
        body: AdminMyAccessPanel(
          permissions: {
            'mission.view': true,
            'pyq.review': false,
            'scopes': ['syllabus.review'],
          },
          userDoc: {'role': 'admin', 'status': 'ACTIVE'},
        ),
      ),
    ));
    expect(find.text('Account role: admin'), findsOneWidget);
    expect(find.text('Account status: ACTIVE'), findsOneWidget);
    expect(find.text('mission.view'), findsOneWidget);
    expect(find.text('syllabus.review'), findsOneWidget);
    expect(find.text('pyq.review'), findsNothing);
  });

  testWidgets('My Access does not fabricate privileges for empty records',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(
        body: AdminMyAccessPanel(permissions: {}, userDoc: {}),
      ),
    ));
    expect(find.textContaining('No explicit Admin module permissions'),
        findsOneWidget);
    expect(find.text('Account status: NOT ACTIVE'), findsOneWidget);
  });
}
