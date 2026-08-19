import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/features/profile/presentation/screens/profile_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/firebase_test_setup.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    await ensureFirebaseInitializedForTests();
  });

  group('Profile Screen Zero-Fake Metrics Tests', () {
    testWidgets('Profile Screen transitions from Pending to Zero values correctly', (tester) async {
      final engine = KnowledgeEngine.instance;
      await engine.clearForTest();
      
      expect(engine.isInitialized, false);

      // Step 1: Pump screen in uninitialized state
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: ProfileScreen(),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify that all 4 performance metrics render as "Pending" when uninitialized
      expect(find.text('Pending'), findsNWidgets(4));

      // Step 2: Now initialize the engine with empty lists (simulating zero stats)
      final recruitment = Recruitment(
        id: 'test_rec',
        recruitmentGroupId: 'group_1',
        boardId: 'board_1',
        examId: 'exam_1',
        examBlueprintId: 'blueprint_1',
        title: 'Test Exam',
        titleHindi: 'टेस्ट एग्जाम',
        year: 2026,
        state: 'Rajasthan',
        examCategory: 'competitive',
        status: 'active',
      );

      await engine.loadStressData(
        recruitment: recruitment,
        nodes: [],
        progress: [],
      );

      expect(engine.isInitialized, true);

      // Trigger rebuild
      await tester.pumpAndSettle();

      // Battles should be "0"
      expect(find.text('0'), findsOneWidget);
      // Readiness should be "4%" (default engine readiness floor)
      expect(find.text('4%'), findsOneWidget);
      // Streak should be "0d"
      expect(find.text('0d'), findsOneWidget);
      // Coverage should be "0%"
      expect(find.text('0%'), findsOneWidget);
    });
  });
}
