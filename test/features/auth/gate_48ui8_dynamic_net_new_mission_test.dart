import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/core/utils/app_routes.dart';
import 'package:rank_crackers/data/india_states.dart';
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
      'user_state': 'Rajasthan',
      'user_state_code': 'RJ',
    });
    await SessionManager.initialize();
  });

  group('GATE 48UI8 — Dynamic Net-New Mission Compatibility & Draft Non-Leak Tests', () {
    // 48A6R2 Canary Fixture Payloads
    final afcatInternalDraft = const Recruitment(
      id: 'afcat',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: '',
      examId: 'afcat',
      examBlueprintId: 'afcat_blueprint',
      title: 'Air Force Common Admission Test',
      titleHindi: 'एयर फोर्स कॉमन एडमिशन टेस्ट',
      year: 2026,
      state: 'Central',
      examCategory: 'Defence',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'auth_in_indian_air_force',
      authorityDisplayName: 'Indian Air Force',
      studentPublicationState: 'INTERNAL_DRAFT',
      status: 'CATALOG_VISIBLE',
      catalogDiscoverable: false,
      quickEntryEnabled: false,
      smartEntryEnabled: false,
      missionSelectionReady: false,
    );

    final afcatPublished = const Recruitment(
      id: 'afcat',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: '',
      examId: 'afcat',
      examBlueprintId: 'afcat_blueprint',
      title: 'Air Force Common Admission Test',
      titleHindi: 'एयर फोर्स कॉमन एडमिशन टेस्ट',
      year: 2026,
      state: 'Central',
      examCategory: 'Defence',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'auth_in_indian_air_force',
      authorityDisplayName: 'Indian Air Force',
      studentPublicationState: 'PUBLISHED',
      status: 'AVAILABLE',
      catalogDiscoverable: true,
      quickEntryEnabled: true,
      smartEntryEnabled: false, // Diagnostic unready
      missionSelectionReady: true,
      variantRequired: false,
    );

    final agniveervayuDraft = const Recruitment(
      id: 'agniveervayu',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: '',
      examId: 'agniveervayu',
      examBlueprintId: 'agniveervayu_blueprint',
      title: 'Indian Air Force Agniveervayu Selection Test',
      titleHindi: 'अग्निवीरवायु चयन परीक्षा',
      year: 2026,
      state: 'Central',
      examCategory: 'Defence',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'auth_in_indian_air_force',
      authorityDisplayName: 'Indian Air Force',
      studentPublicationState: 'INTERNAL_DRAFT',
      status: 'CATALOG_VISIBLE',
      catalogDiscoverable: false,
      quickEntryEnabled: false,
      smartEntryEnabled: false,
    );

    final unknownAuthorityCentral = const Recruitment(
      id: 'future_unknown_board_exam_2026',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: '',
      examId: 'future_unknown_board_exam_2026',
      examBlueprintId: 'future_unknown_blueprint',
      title: 'Future National Fellowship Exam',
      titleHindi: 'फ्यूचर नेशनल फेलोशिप परीक्षा',
      year: 2026,
      state: 'Central',
      examCategory: 'General',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'auth_unknown_board_999',
      authorityDisplayName: '', // Empty: tests fallback to UNKNOWN/OTHER
      studentPublicationState: 'PUBLISHED',
      status: 'AVAILABLE',
      catalogDiscoverable: true,
      quickEntryEnabled: true,
      smartEntryEnabled: false,
      missionSelectionReady: true,
    );

    // Existing regression fixtures
    final jeeMain = const Recruitment(
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
      status: 'AVAILABLE',
      catalogDiscoverable: true,
      quickEntryEnabled: true,
      smartEntryEnabled: true,
      missionSelectionReady: true,
    );

    final neetUg = const Recruitment(
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
      status: 'AVAILABLE',
      catalogDiscoverable: true,
      quickEntryEnabled: true,
      smartEntryEnabled: true,
      missionSelectionReady: true,
    );

    final sscCgl = const Recruitment(
      id: 'ssc_cgl',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'ssc',
      examId: 'ssc_cgl',
      examBlueprintId: 'ssc_cgl_blueprint',
      title: 'SSC CGL 2026',
      titleHindi: 'एसएससी सीजीएल 2026',
      year: 2026,
      state: 'Central',
      examCategory: 'Staff Selection',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'ssc',
      authorityDisplayName: 'Staff Selection Commission (SSC)',
      status: 'AVAILABLE',
      catalogDiscoverable: true,
      quickEntryEnabled: true,
      smartEntryEnabled: true,
      missionSelectionReady: true,
    );

    final upscCse = const Recruitment(
      id: 'upsc_cse_prelims',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'upsc',
      examId: 'upsc_cse_prelims',
      examBlueprintId: 'upsc_cse_blueprint',
      title: 'UPSC Civil Services Prelims',
      titleHindi: 'यूपीएससी सिविल सेवा प्रारंभिक',
      year: 2026,
      state: 'Central',
      examCategory: 'Civil Services',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'upsc',
      authorityDisplayName: 'Union Public Service Commission (UPSC)',
      status: 'AVAILABLE',
      catalogDiscoverable: true,
      quickEntryEnabled: true,
      smartEntryEnabled: true,
      missionSelectionReady: true,
    );

    final rpscFirstGrade = const Recruitment(
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
      quickEntryEnabled: true,
      smartEntryEnabled: true,
      missionSelectionReady: true,
      variantRequired: true,
      missionVariables: {'variants_count': 28},
    );

    Widget createTestApp({
      required List<Recruitment> missions,
      GoRouter? customRouter,
    }) {
      final router = customRouter ??
          GoRouter(
            initialLocation: AppRoutes.missionRealm,
            routes: [
              GoRoute(
                path: AppRoutes.missionRealm,
                builder: (context, state) => const MissionRealmScreen(),
              ),
              GoRoute(
                path: AppRoutes.dashboard,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('DASHBOARD_SHELL_HOME')),
                ),
              ),
              GoRoute(
                path: AppRoutes.diagnosticTest,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('DIAGNOSTIC_START_SCREEN')),
                ),
              ),
            ],
          );

      return ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          publishedRecruitmentsProvider.overrideWith((ref) => missions),
          recruitmentsProvider.overrideWith((ref) => Stream.value(missions)),
          publishedStatesProvider.overrideWith((ref) => ['Central', 'Rajasthan']),
        ],
        child: MaterialApp.router(
          routerConfig: router,
        ),
      );
    }

    testWidgets('1. DRAFT NON-LEAK: INTERNAL_DRAFT canary mission is strictly excluded and cannot enter shell', (tester) async {
      // Model-level assertion
      expect(afcatInternalDraft.canEnterMissionShell, isFalse, reason: 'INTERNAL_DRAFT must fail canEnterMissionShell');
      expect(afcatInternalDraft.canQuickStart, isFalse, reason: 'INTERNAL_DRAFT must fail canQuickStart');
      expect(afcatInternalDraft.canSmartStart, isFalse, reason: 'INTERNAL_DRAFT must fail canSmartStart');
      expect(agniveervayuDraft.canEnterMissionShell, isFalse);

      // UI assertion: Only published missions render
      await tester.binding.setSurfaceSize(const Size(800, 1400));
      await tester.pumpWidget(createTestApp(missions: [jeeMain, afcatInternalDraft, agniveervayuDraft]));
      await tester.pumpAndSettle();

      expect(find.text('JEE Main 2026'), findsOneWidget);
      expect(find.text('Air Force Common Admission Test'), findsNothing, reason: 'afcat draft MUST NOT be visible');
      expect(find.text('Indian Air Force Agniveervayu Selection Test'), findsNothing, reason: 'agniveervayu draft MUST NOT be visible');
      expect(find.text('Indian Air Force'), findsNothing);
    });

    testWidgets('2. DYNAMIC NET-NEW MISSION: Published canary payload renders dynamically with exact authority & title', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1400));
      await tester.pumpWidget(createTestApp(missions: [jeeMain, afcatPublished]));
      await tester.pumpAndSettle();

      // Authority group header dynamically created for Indian Air Force
      expect(find.byKey(const ValueKey('auth_in_indian_air_force_group_header')), findsOneWidget);
      expect(find.text('Indian Air Force'), findsOneWidget);
      expect(find.text('1 exam'), findsNWidgets(2)); // NTA has 1, IAF has 1

      // Mission Card dynamically rendered
      expect(find.text('Air Force Common Admission Test'), findsOneWidget);
    });

    testWidgets('3. QUICK START ON NET-NEW MISSION: Saves exact immutable missionId and enters Dashboard shell', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1400));
      await tester.pumpWidget(createTestApp(missions: [afcatPublished]));
      await tester.pumpAndSettle();

      // Tap mission card to expand
      await tester.tap(find.text('Air Force Common Admission Test'));
      await tester.pumpAndSettle();

      // Tap QUICK START
      final quickStartButton = find.widgetWithText(OutlinedButton, 'QUICK START').first;
      expect(quickStartButton, findsOneWidget);

      await tester.tap(quickStartButton);
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 5));

      // Verify dashboard reached
      expect(find.text('DASHBOARD_SHELL_HOME'), findsOneWidget);

      // Verify SessionManager persisted exact immutable missionId
      final syncUser = SessionUser.getSync();
      expect(syncUser.examId, equals('afcat'));
      expect(syncUser.examName, equals('Air Force Common Admission Test'));
    });

    testWidgets('4. SMART START FAIL-CLOSED: Disabled when smartEntryEnabled == false on net-new mission', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1400));
      await tester.pumpWidget(createTestApp(missions: [afcatPublished]));
      await tester.pumpAndSettle();

      // Tap mission card to expand
      await tester.tap(find.text('Air Force Common Admission Test'));
      await tester.pumpAndSettle();

      // Smart Start should be disabled (onPressed == null)
      final smartStartFinder = find.widgetWithText(ElevatedButton, 'SMART START');
      expect(smartStartFinder, findsOneWidget);
      final buttonWidget = tester.widget<ElevatedButton>(smartStartFinder);
      expect(buttonWidget.onPressed, isNull, reason: 'Smart Start must be disabled when smartEntryEnabled is false');
    });

    testWidgets('5. AUTHORITY GROUPING & FALLBACK: Unknown authority fails cleanly to fallback without guessing', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1400));
      await tester.pumpWidget(createTestApp(missions: [unknownAuthorityCentral]));
      await tester.pumpAndSettle();

      // Group header is created using group key without guessing or hardcoding
      expect(find.byKey(const ValueKey('auth_unknown_board_999_group_header')), findsOneWidget);
      expect(find.text('AUTH_UNKNOWN_BOARD_999'), findsOneWidget);
      expect(find.text('Future National Fellowship Exam'), findsOneWidget);
    });

    test('6. REGION CONTRACT: Canonical state and UT codes verified without TS alias', () {
      expect(IndiaStates.getStateCode('Telangana'), equals('TG'));
      expect(IndiaStates.getStateName('TG'), equals('Telangana'));
      expect(IndiaStates.getStateName('TS'), isNull, reason: 'TS alias is forbidden in canonical contract');

      expect(IndiaStates.getStateCode('Ladakh'), equals('LA'));
      expect(IndiaStates.getStateName('LA'), equals('Ladakh'));

      expect(IndiaStates.getStateCode('Lakshadweep'), equals('LD'));
      expect(IndiaStates.getStateName('LD'), equals('Lakshadweep'));

      expect(IndiaStates.getStateCode('Dadra and Nagar Haveli and Daman and Diu'), equals('DN'));
      expect(IndiaStates.getStateName('DN'), equals('Dadra and Nagar Haveli and Daman and Diu'));
    });

    testWidgets('7. EXISTING MISSIONS REGRESSION: All core missions function cleanly', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1400));
      await tester.pumpWidget(createTestApp(missions: [jeeMain, neetUg, sscCgl, upscCse, rpscFirstGrade]));
      await tester.pumpAndSettle();

      // Central view contains NTA, UPSC, SSC groups
      expect(find.byKey(const ValueKey('nta_group_header')), findsOneWidget);
      expect(find.byKey(const ValueKey('upsc_group_header')), findsOneWidget);
      expect(find.byKey(const ValueKey('ssc_group_header')), findsOneWidget);
      expect(find.text('2 exams'), findsOneWidget); // NTA has 2
      expect(find.text('1 exam'), findsNWidgets(2)); // UPSC has 1, SSC has 1

      expect(find.text('JEE Main 2026'), findsOneWidget);
      expect(find.text('NEET UG 2027'), findsOneWidget);
      expect(find.text('SSC CGL 2026'), findsOneWidget);
      expect(find.text('UPSC Civil Services Prelims'), findsOneWidget);

      // Switch to State View
      await tester.tap(find.byKey(const ValueKey('tab_state_exams')));
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('rpsc_group_header')), findsOneWidget);
      expect(find.text('RPSC 1st Grade 2026'), findsOneWidget);
    });
  });
}
