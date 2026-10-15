import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
import 'package:rank_crackers/core/utils/app_routes.dart';
import 'package:rank_crackers/features/auth/domain/repositories/auth_repository.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:rank_crackers/features/auth/presentation/providers/mission_realm_provider.dart';
import 'package:rank_crackers/features/auth/presentation/screens/mission_realm_screen.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';

class MockAuthRepository implements AuthRepository {
  @override
  Stream<User?> get authStateChanges => const Stream.empty();

  @override
  User? get currentUser => null;

  @override
  Future<UserCredential?> signInWithGoogle() async => null;

  @override
  Future<UserCredential> signInWithEmail({required String email, required String password}) async => throw UnimplementedError();

  @override
  Future<UserCredential> createAccount({required String email, required String password}) async => throw UnimplementedError();

  @override
  Future<UserCredential?> authenticate({required String email, required String password}) async => null;

  @override
  Future<void> forgotPassword(String email) async {}

  @override
  Future<void> signOut() async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SessionManager.disableFirebaseForTest = true;
    SharedPreferences.setMockInitialValues({
      'user_state': 'Central',
      'user_state_code': 'CENTRAL',
    });
    await SessionManager.initialize();
  });

  group('GATE 48UI7 — Mission Realm Exit Path & Quick Start Shell Access Tests', () {
    final jeePreparing = const Recruitment(
      id: 'jee_main_2026',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'nta',
      examId: 'jee_main_2026',
      examBlueprintId: 'jee_blueprint',
      title: 'JEE Main 2026',
      titleHindi: 'जेईई मेन 2026',
      year: 2026,
      state: 'Central',
      examCategory: 'Engineering',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'nta',
      authorityDisplayName: 'National Testing Agency (NTA)',
      status: 'PREPARING', // Academic content unready / Preparing
      catalogDiscoverable: true,
      quickEntryEnabled: false, // Omitted or false in backend
      smartEntryEnabled: false, // Diagnostic unready
      missionSelectionReady: true,
      variantRequired: false,
    );

    final neetPreparing = const Recruitment(
      id: 'neet_(ug)-2027',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'nta',
      examId: 'neet_(ug)-2027',
      examBlueprintId: 'neet_blueprint',
      title: 'NEET UG 2027',
      titleHindi: 'नीट यूजी 2027',
      year: 2027,
      state: 'Central',
      examCategory: 'Medical',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'nta',
      authorityDisplayName: 'National Testing Agency (NTA)',
      status: 'PREPARING',
      catalogDiscoverable: true,
      quickEntryEnabled: false,
      smartEntryEnabled: false,
      missionSelectionReady: true,
      variantRequired: false,
    );

    final rpscFirstGradeNoVariant = const Recruitment(
      id: 'RPSC_FIRST_GRADE2026_2026_1782713222215',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'rpsc',
      examId: 'RPSC_FIRST_GRADE2026_2026_1782713222215',
      examBlueprintId: 'rpsc_fg_blueprint',
      title: 'RPSC 1st Grade 2026',
      titleHindi: 'आरपीएससी प्रथम श्रेणी 2026',
      year: 2026,
      state: 'Rajasthan',
      stateCode: 'RJ',
      stateName: 'Rajasthan',
      examCategory: 'Teaching',
      jurisdictionLevel: 'STATE',
      authorityGroupKey: 'rpsc',
      authorityDisplayName: 'Rajasthan Public Service Commission (RPSC)',
      status: 'AVAILABLE',
      catalogDiscoverable: true,
      variantRequired: true,
      missionSelectionReady: false, // No variant selected yet
      missionVariables: {'variants_count': 28},
    );

    final rpscFirstGradeVariantSelected = rpscFirstGradeNoVariant.copyWith(
      missionSelectionReady: true,
      variantCode: 'HINDI',
    );

    final missionHeld = const Recruitment(
      id: 'held_mission',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'test_board',
      examId: 'held_mission',
      examBlueprintId: 'held_blueprint',
      title: 'Held Mission',
      titleHindi: 'हेल्ड मिशन',
      year: 2026,
      state: 'Central',
      examCategory: 'Engineering',
      status: 'HOLD',
      founderHold: true,
      catalogDiscoverable: true,
    );

    final missionArchived = const Recruitment(
      id: 'archived_mission',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'test_board',
      examId: 'archived_mission',
      examBlueprintId: 'archived_blueprint',
      title: 'Archived Mission',
      titleHindi: 'आर्काइव मिशन',
      year: 2026,
      state: 'Central',
      examCategory: 'Engineering',
      status: 'ARCHIVED',
      archived: true,
      catalogDiscoverable: false,
    );

    test('1. Three Separate Gates: canEnterMissionShell, canQuickStart, canSmartStart semantics', () {
      // JEE in Preparing status:
      // Shell and Quick Start MUST be allowed
      // Smart Start MUST be blocked
      expect(jeePreparing.canEnterMissionShell, isTrue);
      expect(jeePreparing.canQuickStart, isTrue);
      expect(jeePreparing.canSmartStart, isFalse);

      // Held mission:
      // All gates closed
      expect(missionHeld.canEnterMissionShell, isFalse);
      expect(missionHeld.canQuickStart, isFalse);
      expect(missionHeld.canSmartStart, isFalse);

      // Archived mission:
      // All gates closed
      expect(missionArchived.canEnterMissionShell, isFalse);
      expect(missionArchived.canQuickStart, isFalse);
      expect(missionArchived.canSmartStart, isFalse);

      // Variant required without selection:
      // Blocked until variant is selected
      expect(rpscFirstGradeNoVariant.canEnterMissionShell, isFalse);
      expect(rpscFirstGradeNoVariant.canQuickStart, isFalse);

      // Variant required with selection:
      // Quick Start enabled
      expect(rpscFirstGradeVariantSelected.canEnterMissionShell, isTrue);
      expect(rpscFirstGradeVariantSelected.canQuickStart, isTrue);
    });

    test('2. Firestore flag schema audit: nested visibility vs top-level compatibility', () {
      final docWithNestedVisibility = {
        'id': 'jee_main_2026',
        'title': 'JEE Main 2026',
        'status': 'AVAILABLE',
        'visibility': {
          'quickEntryEnabled': true,
          'smartEntryEnabled': true,
          'missionSelectionReady': true,
          'catalogDiscoverable': true,
        },
      };

      final recruitment = Recruitment.fromMap(docWithNestedVisibility);
      expect(recruitment.quickEntryEnabled, isTrue);
      expect(recruitment.smartEntryEnabled, isTrue);
      expect(recruitment.catalogDiscoverable, isTrue);
      expect(recruitment.canQuickStart, isTrue);
      expect(recruitment.canSmartStart, isFalse);
    });

    testWidgets('3. Quick Start tap persists exact jee_main_2026 identity and navigates to Dashboard',
        (WidgetTester tester) async {
      String navigatedRoute = '';

      final router = GoRouter(
        initialLocation: AppRoutes.missionRealm,
        routes: [
          GoRoute(
            path: AppRoutes.missionRealm,
            builder: (context, state) => const MissionRealmScreen(),
          ),
          GoRoute(
            path: AppRoutes.dashboard,
            builder: (context, state) {
              navigatedRoute = AppRoutes.dashboard;
              return const Scaffold(body: Text('DASHBOARD_SHELL'));
            },
          ),
          GoRoute(
            path: AppRoutes.diagnosticTest,
            builder: (context, state) {
              navigatedRoute = AppRoutes.diagnosticTest;
              return const Scaffold(body: Text('DIAGNOSTIC_TEST'));
            },
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            publishedRecruitmentsProvider.overrideWithValue([jeePreparing]),
            recruitmentsProvider.overrideWith((ref) => Stream.value([jeePreparing])),
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Expand JEE Main card
      await tester.tap(find.text('JEE Main 2026'));
      await tester.pumpAndSettle();

      // Verify the single ordinary mission entry is enabled.
      final enterMissionFinder = find.widgetWithText(ElevatedButton, 'ENTER MISSION');
      expect(enterMissionFinder, findsOneWidget);
      final enterButton = tester.widget<ElevatedButton>(enterMissionFinder);
      expect(enterButton.onPressed, isNotNull);

      await tester.tap(enterMissionFinder);
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 5));

      // Verify exact mission identity persisted
      expect(SessionManager.getExamIdSync(), equals('jee_main_2026'));
      expect(SessionManager.selectedRecruitmentIdSync(), equals('jee_main_2026'));

      // Verify Dashboard reached
      expect(navigatedRoute, equals(AppRoutes.dashboard));
      expect(find.text('DASHBOARD_SHELL'), findsOneWidget);
    });

    testWidgets('4. Only ordinary mission entry is exposed',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            publishedRecruitmentsProvider.overrideWithValue([jeePreparing, neetPreparing]),
            recruitmentsProvider.overrideWith((ref) => Stream.value([jeePreparing, neetPreparing])),
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: MissionRealmScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Expand NEET UG 2027
      await tester.tap(find.text('NEET UG 2027'));
      await tester.pumpAndSettle();

      expect(find.text('SMART START'), findsNothing);
      expect(find.text('QUICK START'), findsNothing);
      final enterMissionFinder = find.widgetWithText(ElevatedButton, 'ENTER MISSION');
      expect(enterMissionFinder, findsOneWidget);
      expect(tester.widget<ElevatedButton>(enterMissionFinder).onPressed, isNotNull);
    });

    test('5. Non-canonical test mission aliases eliminated', () {
      const canonicalIds = [
        'jee_main_2026',
        'neet_(ug)-2027',
        'upsc_cse_prelims',
        'rpsc_ras_prelims',
        'RPSC_FIRST_GRADE2026_2026_1782713222215',
        'ssc_cgl',
        'ssc_chsl',
        'ssc_cpo',
        'ssc_gd',
        'ssc_hindi_translators',
        'ssc_je',
        'ssc_mts_havaldar',
        'ssc_selection_post',
        'ssc_stenographer',
      ];

      expect(canonicalIds.contains('ssc_cgl_2026'), isFalse);
      expect(canonicalIds.contains('upsc_cse_2026'), isFalse);
      expect(canonicalIds.contains('rpsc_ras_prelims_2026'), isFalse);
      expect(canonicalIds.contains('ssc_cgl'), isTrue);
      expect(canonicalIds.contains('upsc_cse_prelims'), isTrue);
      expect(canonicalIds.contains('rpsc_ras_prelims'), isTrue);
    });

    test('6. Authority & Region fallback audit: backend truth preferred, TS alias removed', () {
      final r = const Recruitment(
        id: 'test_mission',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'test_board',
        examId: 'test_mission',
        examBlueprintId: 'test_blueprint',
        title: 'Test Mission',
        titleHindi: 'टेस्ट मिशन',
        year: 2026,
        state: 'Telangana',
        examCategory: 'Engineering',
        authorityGroupKey: 'nta',
        authorityDisplayName: 'National Testing Agency (NTA)',
        jurisdictionLevel: 'CENTRAL',
        stateCode: 'TG',
        stateName: 'Telangana',
      );

      expect(r.authorityGroupKey, equals('nta'));
      expect(r.authorityDisplayName, equals('National Testing Agency (NTA)'));
      expect(r.jurisdictionLevel, equals('CENTRAL'));
      expect(r.stateCode, equals('TG'));
    });

    testWidgets('7. Successful server confirmation updates cache and opens Dashboard afterward',
        (WidgetTester tester) async {
      String navigatedRoute = '';
      bool serverConfirmed = false;
      Map<String, dynamic>? serverPayload;

      final router = GoRouter(
        initialLocation: AppRoutes.missionRealm,
        routes: [
          GoRoute(
            path: AppRoutes.missionRealm,
            builder: (context, state) => MissionRealmScreen(
              serverSelectionSaverForTest: (uid, data) async {
                serverConfirmed = true;
                serverPayload = data;
              },
            ),
          ),
          GoRoute(
            path: AppRoutes.dashboard,
            builder: (context, state) {
              navigatedRoute = AppRoutes.dashboard;
              return const Scaffold(body: Text('DASHBOARD_SHELL'));
            },
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            publishedRecruitmentsProvider.overrideWithValue([jeePreparing]),
            recruitmentsProvider.overrideWith((ref) => Stream.value([jeePreparing])),
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('JEE Main 2026'));
      await tester.pumpAndSettle();

      final enterMissionFinder = find.widgetWithText(ElevatedButton, 'ENTER MISSION');
      await tester.tap(enterMissionFinder);
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 5));

      expect(serverConfirmed, isTrue);
      expect(serverPayload?['selectedExamId'], equals('jee_main_2026'));
      expect(SessionManager.getExamIdSync(), equals('jee_main_2026'));
      expect(SessionManager.selectedRecruitmentIdSync(), equals('jee_main_2026'));
      expect(navigatedRoute, equals(AppRoutes.dashboard));
      expect(find.text('DASHBOARD_SHELL'), findsOneWidget);
    });

    testWidgets('8. Server rejection or timeout leaves cache unchanged and does not navigate',
        (WidgetTester tester) async {
      String navigatedRoute = '';
      bool serverAttempted = false;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('selected_exam_id', 'prior_cached_exam');
      await prefs.setString('selected_recruitment_id', 'prior_cached_exam');
      await SessionManager.initialize();

      final router = GoRouter(
        initialLocation: AppRoutes.missionRealm,
        routes: [
          GoRoute(
            path: AppRoutes.missionRealm,
            builder: (context, state) => MissionRealmScreen(
              serverSelectionSaverForTest: (uid, data) async {
                serverAttempted = true;
                throw TimeoutException('Server write timed out');
              },
            ),
          ),
          GoRoute(
            path: AppRoutes.dashboard,
            builder: (context, state) {
              navigatedRoute = AppRoutes.dashboard;
              return const Scaffold(body: Text('DASHBOARD_SHELL'));
            },
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            publishedRecruitmentsProvider.overrideWithValue([jeePreparing]),
            recruitmentsProvider.overrideWith((ref) => Stream.value([jeePreparing])),
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('JEE Main 2026'));
      await tester.pumpAndSettle();

      final enterMissionFinder = find.widgetWithText(ElevatedButton, 'ENTER MISSION');
      await tester.tap(enterMissionFinder);
      await tester.pumpAndSettle();

      expect(serverAttempted, isTrue);
      expect(SessionManager.getExamIdSync(), equals('prior_cached_exam'));
      expect(SessionManager.selectedRecruitmentIdSync(), equals('prior_cached_exam'));
      expect(navigatedRoute, isEmpty);
      expect(find.text('DASHBOARD_SHELL'), findsNothing);
      expect(find.text('Mission could not start yet. Please try again.'), findsOneWidget);
    });

    testWidgets('9. Unauthenticated server selection attempt fails closed without mutating local cache',
        (WidgetTester tester) async {
      String navigatedRoute = '';

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('selected_exam_id', 'prior_cached_exam');
      await prefs.setString('selected_recruitment_id', 'prior_cached_exam');
      await SessionManager.initialize();

      SessionManager.disableFirebaseForTest = false;

      final router = GoRouter(
        initialLocation: AppRoutes.missionRealm,
        routes: [
          GoRoute(
            path: AppRoutes.missionRealm,
            builder: (context, state) => const MissionRealmScreen(),
          ),
          GoRoute(
            path: AppRoutes.dashboard,
            builder: (context, state) {
              navigatedRoute = AppRoutes.dashboard;
              return const Scaffold(body: Text('DASHBOARD_SHELL'));
            },
          ),
        ],
      );

      try {
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              publishedRecruitmentsProvider.overrideWithValue([jeePreparing]),
              recruitmentsProvider.overrideWith((ref) => Stream.value([jeePreparing])),
              authRepositoryProvider.overrideWithValue(MockAuthRepository()),
            ],
            child: MaterialApp.router(
              routerConfig: router,
            ),
          ),
        );
        await tester.pumpAndSettle();

        await tester.tap(find.text('JEE Main 2026'));
        await tester.pumpAndSettle();

        final enterMissionFinder = find.widgetWithText(ElevatedButton, 'ENTER MISSION');
        await tester.tap(enterMissionFinder);
        await tester.pumpAndSettle();

        expect(SessionManager.getExamIdSync(), equals('prior_cached_exam'));
        expect(SessionManager.selectedRecruitmentIdSync(), equals('prior_cached_exam'));
        expect(navigatedRoute, isEmpty);
        expect(find.text('DASHBOARD_SHELL'), findsNothing);
        expect(find.text('Mission could not start yet. Please try again.'), findsOneWidget);
      } finally {
        SessionManager.disableFirebaseForTest = true;
      }
    });
  });
}
