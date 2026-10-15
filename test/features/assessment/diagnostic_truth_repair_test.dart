import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/assessment/presentation/screens/diagnostic_result_screen.dart';
import 'package:rank_crackers/features/onboarding/presentation/screens/diagnostic_test_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('diagnostic entry stays unavailable without an attempt authority',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: DiagnosticTestScreen()),
    );
    await tester.pumpAndSettle();

    expect(find.text('Diagnostic Not Ready'), findsOneWidget);
    expect(find.textContaining('82%'), findsNothing);
    expect(find.textContaining('14s'), findsNothing);
    expect(find.textContaining('Moderate'), findsNothing);
    expect(find.textContaining('Stable'), findsNothing);
  });

  testWidgets('direct result route cannot expose fabricated diagnostic metrics',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: DiagnosticResultScreen(
          questions: [],
          answers: [],
          durations: [],
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Diagnostic\nNot Ready'), findsOneWidget);
    expect(find.textContaining('No server-authoritative attempt'), findsOneWidget);
    expect(find.textContaining('82%'), findsNothing);
    expect(find.textContaining('0.8s'), findsNothing);
    expect(find.textContaining('Science'), findsNothing);
  });
}
