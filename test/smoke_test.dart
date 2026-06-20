import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
import 'package:rank_crackers/features/auth/presentation/screens/mission_realm_screen.dart';
import 'package:rank_crackers/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  group('🔱 RANKCRACKERS SYSTEM SMOKE TESTS', () {
    
    test('KnowledgeEngine Initialization Smoke Test', () async {
      final engine = KnowledgeEngine.instance;
      expect(engine.isInitialized, false);
      
      // Note: Full initialization requires Firebase mock, 
      // but we can verify the engine exists and reset logic works.
      engine.clearForTest();
      expect(engine.isInitialized, false);
      expect(engine.nodeStates.isEmpty, true);
    });

    testWidgets('Mission Realm UI Smoke Test', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: MissionRealmScreen(),
          ),
        ),
      );

      // Verify header presence
      expect(find.text('Mission Realm'), findsOneWidget);
      expect(find.text('🛡 COMPETITIVE MISSIONS'), findsNothing); // Should be empty without data
    });

    testWidgets('Dashboard UI Smoke Test', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: DashboardScreen(),
          ),
        ),
      );

      // Dashboard might show "Warrior" or "Mission" placeholders
      expect(find.text('BATTLE TOOLS'), findsOneWidget);
      expect(find.text('PREPARATION TRINITY'), findsOneWidget);
    });
  });
}
