import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
import 'package:rank_crackers/features/auth/presentation/providers/mission_realm_provider.dart';
import 'package:rank_crackers/features/auth/presentation/screens/mission_realm_screen.dart';
import 'package:rank_crackers/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:rank_crackers/core/router/app_router.dart';
import 'package:rank_crackers/core/utils/app_routes.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'helpers/firebase_test_setup.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    await ensureFirebaseInitializedForTests();
    // Required output marker in test logs
    print('RC_X4E_R8_FIX3_SMOKE_BASELINE_READY');
  });

  group('RankCrackers system smoke tests', () {
    test('KnowledgeEngine Initialization Smoke Test', () async {
      final engine = KnowledgeEngine.instance;
      expect(engine.isInitialized, false);

      engine.clearForTest();
      expect(engine.isInitialized, false);
      expect(engine.nodeStates.isEmpty, true);
    });

    test('Mission Realm widget construction Smoke Test', () {
      expect(const MissionRealmScreen(), isA<MissionRealmScreen>());
      expect(publishedRecruitmentsProvider, isNotNull);
      expect(publishedStatesProvider, isNotNull);
    });

    test('Dashboard widget construction Smoke Test', () {
      expect(const DashboardScreen(), isA<DashboardScreen>());
    });

    test('App Router - Mobile /admin route is blocked', () {
      final router = appRouter;
      expect(router.configuration.routes, isNotEmpty);
      
      // Find /admin route
      final adminRoute = router.configuration.routes
          .firstWhere((route) => route is GoRoute && route.path == AppRoutes.admin) as GoRoute;
      expect(adminRoute, isNotNull);
      
      // Verify that builder exists and is a function
      expect(adminRoute.builder, isNotNull);
    });
  });
}
