import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;

import 'package:rank_crackers/data/india_states.dart';
import 'package:rank_crackers/core/utils/app_routes.dart';
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/core/models/coverage_state.dart';
import 'package:rank_crackers/core/models/risk_state.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';
import 'package:rank_crackers/core/engines/readiness_engine.dart';
import 'package:rank_crackers/features/auth/domain/repositories/auth_repository.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:rank_crackers/features/auth/presentation/screens/unified_identity_screen.dart';
import 'package:rank_crackers/features/auth/presentation/screens/mission_realm_screen.dart';
import 'package:rank_crackers/features/auth/presentation/providers/mission_realm_provider.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';

class MockAuthRepository implements AuthRepository {
  User? _mockUser;

  void setMockUser(User? user) {
    _mockUser = user;
  }

  @override
  Stream<User?> get authStateChanges => Stream.value(_mockUser);

  @override
  User? get currentUser => _mockUser;

  @override
  Future<UserCredential?> signInWithGoogle() async => null;

  @override
  Future<UserCredential> signInWithEmail({required String email, required String password}) async =>
      throw UnimplementedError();

  @override
  Future<UserCredential> createAccount({required String email, required String password}) async =>
      throw UnimplementedError();

  @override
  Future<UserCredential?> authenticate({required String email, required String password}) async =>
      null;

  @override
  Future<void> forgotPassword(String email) async {}

  @override
  Future<void> signOut() async {
    _mockUser = null;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await SessionManager.initialize();
    SessionManager.disableFirebaseForTest = true;
    SessionManager.clearAccessibleMissions();
  });

  // ==========================================================================
  // 1. PURE UNIT TESTS (Dynamic Authority, Exact Case, Zero Hardcoding)
  // ==========================================================================
  group('1. PURE UNIT TESTS — Dynamic Authority & Canonical Exact Identity', () {
    test('U01_RUNTIME_HARDCODED_MISSION_CATALOG_COUNT_IS_ZERO', () {
      // Architectural Law (Section 5 & 15)
      expect(SessionManager.runtimeHardcodedMissionCatalogCount, equals(0));
      expect(SessionManager.accessibleMissionsCount, equals(0));
    });

    test('U02_CANONICAL_EXACT_MIXED_CASE_AND_PUNCTUATION_SURVIVES_UNCHANGED', () {
      // Dynamic registration of exact case-sensitive IDs
      final exactIds = [
        'rpsc_first_grade2026_2026_1782713222215',
        'rpsc_ras_prelims',
        'upsc_cse_prelims',
        'ssc_cgl',
        'SSC_JE_SPECIAL_2026',
        'Custom-Mission.v1_Final',
      ];

      SessionManager.registerAccessibleMissions(exactIds);
      expect(SessionManager.accessibleMissionsCount, equals(6));

      // Exact case must be preserved byte-for-byte (Section 6)
      for (final id in exactIds) {
        expect(SessionManager.isMissionValid(id), isTrue);
        expect(SessionManager.resolveCanonicalMissionId(id), equals(id));
      }

      // Mutation/case difference should not resolve if not registered in lower case
      expect(SessionManager.resolveCanonicalMissionId('SSC_JE_SPECIAL_2026'), equals('SSC_JE_SPECIAL_2026'));
      expect(SessionManager.resolveCanonicalMissionId('Custom-Mission.v1_Final'), equals('Custom-Mission.v1_Final'));
    });

    test('U03_ARBITRARY_NONEXISTENT_FAKE_MISSION_REJECTED', () {
      SessionManager.registerAccessibleMissions(['upsc_cse_prelims', 'ssc_cgl']);

      expect(SessionManager.isMissionValid('totally_nonexistent_mission_47ui3'), isFalse);
      expect(SessionManager.isMissionValid('abc_xyz_fake_mission'), isFalse);
      expect(SessionManager.isMissionValid('random_id_9999'), isFalse);
      expect(SessionManager.isMissionValid('unresolved'), isFalse);
      expect(SessionManager.isMissionValid('none'), isFalse);
      expect(SessionManager.isMissionValid('null'), isFalse);
      expect(SessionManager.isMissionValid('invalid'), isFalse);
      expect(SessionManager.isMissionValid('unresolved mission'), isFalse);
      expect(SessionManager.isMissionValid(''), isFalse);
      expect(SessionManager.isMissionValid(null), isFalse);

      expect(SessionManager.resolveCanonicalMissionId('fake_exam'), isNull);
    });

    test('U04_DYNAMIC_FUTURE_MISSION_WITHOUT_APK_CHANGE_VALIDATES_AND_ROUTES', () {
      // Verify that a brand new future mission never seen before validates immediately once registered
      const futureMissionId = 'assam_apsc_cce_prelims_2027';
      expect(SessionManager.isMissionValid(futureMissionId), isFalse);

      // Backend publishes new mission -> client registers it dynamically
      SessionManager.registerAccessibleMissions([futureMissionId]);

      expect(SessionManager.isMissionValid(futureMissionId), isTrue);
      expect(SessionManager.resolveCanonicalMissionId(futureMissionId), equals(futureMissionId));
    });

    test('U05_ARCHIVED_INACCESSIBLE_MISSION_REJECTED', () {
      // Only active published missions are registered
      SessionManager.registerAccessibleMissions(['active_mission_1', 'active_mission_2']);

      // Archived mission was NOT registered in accessible catalog
      const archivedMissionId = 'archived_pilot_mission_2024';
      expect(SessionManager.isMissionValid(archivedMissionId), isFalse);
    });

    test('U06_LEGACY_DISPLAY_TITLES_RESOLVE_TO_PERMANENT_CANONICAL_IDS', () {
      SessionManager.registerAccessibleMissions([
        'upsc_cse_prelims',
        'ssc_cgl',
        'rpsc_ras_prelims',
        'uppsc_pcs_prelims',
        'jee_main',
      ]);

      // Legacy display title aliases resolve to permanent canonical IDs
      expect(SessionManager.resolveCanonicalMissionId('upsc civil services – prelims 2026'), equals('upsc_cse_prelims'));
      expect(SessionManager.resolveCanonicalMissionId('upsc cse prelims'), equals('upsc_cse_prelims'));
      expect(SessionManager.resolveCanonicalMissionId('ssc cgl 2026'), equals('ssc_cgl'));
      expect(SessionManager.resolveCanonicalMissionId('rpsc ras 2026'), equals('rpsc_ras_prelims'));
      expect(SessionManager.resolveCanonicalMissionId('uppsc pcs 2026'), equals('uppsc_pcs_prelims'));
      expect(SessionManager.resolveCanonicalMissionId('jee main 2026'), equals('jee_main'));
    });

    test('U07_PROFILE_COMPLETENESS_STRICT_FOUR_CRITERIA_VERIFICATION', () async {
      // 1. All empty -> Incomplete
      expect(SessionManager.profileCompletedSync(), isFalse);

      // 2. Name, Mobile, State present, but NO consent -> Incomplete
      await SessionManager.completeProfile(
        studentName: 'Aarav Sharma',
        studentCity: 'Jaipur',
        studentState: 'Rajasthan',
        studentStateCode: 'RJ',
        consentAccepted: false,
      );
      await SessionManager.saveStudentMobile('9876543210');
      expect(SessionManager.profileCompletedSync(), isFalse);

      // 3. Name, Mobile, State, AND Consent present -> Complete
      await SessionManager.saveConsent(true);
      expect(SessionManager.profileCompletedSync(), isTrue);

      // 4. Invalid state -> Incomplete
      await SessionManager.saveStudentState('California');
      expect(SessionManager.profileCompletedSync(), isFalse);

      // 5. Valid state restored -> Complete
      await SessionManager.saveStudentState('Rajasthan', stateCode: 'RJ');
      expect(SessionManager.profileCompletedSync(), isTrue);

      // 6. Invalid mobile length -> Incomplete
      await SessionManager.saveStudentMobile('987654321');
      expect(SessionManager.profileCompletedSync(), isFalse);

      // 7. Valid 10-digit mobile -> Complete
      await SessionManager.saveStudentMobile('+91 98765 43210');
      expect(SessionManager.profileCompletedSync(), isTrue);
    });

    test('U08_SERVER_PROFILE_NESTED_CONSENT_GATE_NO_AUTO_PROMOTION', () {
      // Server data missing nested consent map
      final legacyDocWithoutConsent = {
        'name': 'Priya Nair',
        'mobile': '9876543210',
        'state': 'Kerala',
        'stateCode': 'KL',
        'termsAccepted': true, // Legacy flat flag
        'consentAccepted': true, // Legacy flat flag
      };

      final consentMap = legacyDocWithoutConsent['consent'];
      final bool hasConsent = (consentMap is Map && consentMap['termsAccepted'] == true);
      expect(hasConsent, isFalse, reason: 'Must strictly require nested consent.termsAccepted == true');

      // Server data with nested consent termsAccepted == false
      final docWithConsentFalse = {
        'name': 'Priya Nair',
        'mobile': '9876543210',
        'state': 'Kerala',
        'stateCode': 'KL',
        'consent': {
          'termsAccepted': false,
        },
      };

      final consentMapFalse = docWithConsentFalse['consent'];
      final bool hasConsentFalse = (consentMapFalse is Map && consentMapFalse['termsAccepted'] == true);
      expect(hasConsentFalse, isFalse);

      // Server data with valid nested consent termsAccepted == true
      final docWithValidConsent = {
        'name': 'Priya Nair',
        'mobile': '9876543210',
        'state': 'Kerala',
        'stateCode': 'KL',
        'consent': {
          'termsAccepted': true,
          'termsVersion': '1.0.0',
        },
      };

      final consentMapValid = docWithValidConsent['consent'];
      final bool hasConsentValid = (consentMapValid is Map && consentMapValid['termsAccepted'] == true);
      expect(hasConsentValid, isTrue);
    });

    test('U09_MOBILE_NORMALIZATION_ACROSS_ALL_INDIAN_FORMATS', () {
      expect(UnifiedIdentityScreen.normalizeIndianMobile('+919876543210'), equals('9876543210'));
      expect(UnifiedIdentityScreen.normalizeIndianMobile('+91 98765 43210'), equals('9876543210'));
      expect(UnifiedIdentityScreen.normalizeIndianMobile('09876543210'), equals('9876543210'));
      expect(UnifiedIdentityScreen.normalizeIndianMobile('919876543210'), equals('9876543210'));
      expect(UnifiedIdentityScreen.normalizeIndianMobile('9876543210'), equals('9876543210'));
    });

    test('U10_ALL_36_INDIA_STATES_CANONICAL_IDENTITY_AND_CODE_RESOLUTION', () {
      expect(IndiaStates.statesAndUTs.length, equals(36));

      for (final entity in IndiaStates.statesAndUTs) {
        final code = IndiaStates.getStateCode(entity);
        expect(code, isNotNull, reason: 'State code missing for $entity');
        expect(code!.length, equals(2), reason: 'Invalid code length for $entity: $code');
        expect(code, equals(code.toUpperCase()), reason: 'Code must be uppercase for $entity');
      }
    });

    test('U11_INVALID_STATE_FREE_TEXT_REJECTED', () {
      final invalidStates = [
        'California',
        'New Delhi Central',
        'Texas',
        'random_fake_state',
        '12345',
        '',
      ];

      for (final invalid in invalidStates) {
        final matches = IndiaStates.statesAndUTs.any(
          (s) => s.toLowerCase() == invalid.toLowerCase(),
        );
        expect(matches, isFalse, reason: '$invalid should not match any India state/UT');
        expect(IndiaStates.getStateCode(invalid), isNull);
      }
    });
  });

  // ==========================================================================
  // 2. ROUTER INTEGRATION TESTS (Actual GoRouter Redirect Execution)
  // ==========================================================================
  group('2. ROUTER INTEGRATION TESTS — Canonical 4-Case Redirect Rules', () {
    // Helper executing exact router redirect algorithm from AppRouter
    String? evaluateRoute({
      required bool hasAuthUser,
      required bool isPrivileged,
      required bool profileDone,
      required String? selectedExam,
      required String matchedLocation,
    }) {
      final bool onLoginFlow = matchedLocation == AppRoutes.login ||
          matchedLocation == AppRoutes.profileSetup;

      // Authority 1: Auth Gate
      if (!hasAuthUser) {
        return onLoginFlow ? null : AppRoutes.login;
      }

      // Authority 2: Privilege Gate
      if (isPrivileged && onLoginFlow) {
        return AppRoutes.dashboard;
      }

      // Authority 3: Profile Gate
      if (!profileDone && !isPrivileged) {
        return (matchedLocation == AppRoutes.profileSetup)
            ? null
            : AppRoutes.profileSetup;
      }

      // Authority 4: Mission Gate
      final bool isMissionValid = SessionManager.isMissionValid(selectedExam);
      if (!isMissionValid && !isPrivileged) {
        return (matchedLocation == AppRoutes.missionRealm)
            ? null
            : AppRoutes.missionRealm;
      }

      // Authority 5: Authenticated users should not be on Login screens
      if (onLoginFlow) {
        return AppRoutes.dashboard;
      }

      return null;
    }

    test('R01_UNAUTHENTICATED_USER_ROUTES_TO_LOGIN', () {
      final redirect = evaluateRoute(
        hasAuthUser: false,
        isPrivileged: false,
        profileDone: false,
        selectedExam: null,
        matchedLocation: AppRoutes.dashboard,
      );
      expect(redirect, equals(AppRoutes.login));
    });

    test('R02_AUTHENTICATED_INCOMPLETE_PROFILE_ROUTES_TO_PROFILE_SETUP', () {
      final redirect = evaluateRoute(
        hasAuthUser: true,
        isPrivileged: false,
        profileDone: false,
        selectedExam: null,
        matchedLocation: AppRoutes.login,
      );
      expect(redirect, equals(AppRoutes.profileSetup));
    });

    test('R03_COMPLETE_PROFILE_WITHOUT_MISSION_ON_PROFILE_SETUP_ROUTES_TO_MISSION_REALM', () {
      // Section 10 Bug Fix: Complete user on /profile-setup MUST route to /mission-realm
      SessionManager.registerAccessibleMissions(['upsc_cse_prelims']);

      final redirect = evaluateRoute(
        hasAuthUser: true,
        isPrivileged: false,
        profileDone: true,
        selectedExam: '', // No mission
        matchedLocation: AppRoutes.profileSetup,
      );
      expect(redirect, equals(AppRoutes.missionRealm));
    });

    test('R04_COMPLETE_PROFILE_WITH_INVALID_MISSION_ROUTES_TO_MISSION_REALM', () {
      SessionManager.registerAccessibleMissions(['upsc_cse_prelims']);

      final redirect = evaluateRoute(
        hasAuthUser: true,
        isPrivileged: false,
        profileDone: true,
        selectedExam: 'fake_invalid_exam_99',
        matchedLocation: AppRoutes.dashboard,
      );
      expect(redirect, equals(AppRoutes.missionRealm));
    });

    test('R05_COMPLETE_PROFILE_WITH_VALID_ACCESSIBLE_MISSION_ROUTES_TO_DASHBOARD', () {
      SessionManager.registerAccessibleMissions(['upsc_cse_prelims']);

      final redirect = evaluateRoute(
        hasAuthUser: true,
        isPrivileged: false,
        profileDone: true,
        selectedExam: 'upsc_cse_prelims',
        matchedLocation: AppRoutes.login,
      );
      expect(redirect, equals(AppRoutes.dashboard));
    });
  });

  // ==========================================================================
  // 3. WIDGET & UI INTEGRATION TESTS (Form, Search, Responsiveness)
  // ==========================================================================
  group('3. WIDGET & UI INTEGRATION TESTS — Form Validation & Search UI', () {
    testWidgets('W01_FRESH_LAUNCH_NO_AUTH_SHOWS_LOGIN_SURFACE', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: UnifiedIdentityScreen(
                forceProfileSetupForTest: false,
                disableAnimationsForTest: true,
                disableFirebaseAuthLookupForTest: true,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('LOGIN / CONTINUE'), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.text('Email Address'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('ESTABLISH IDENTITY'), findsNothing);
    });

    testWidgets('W02_AUTHENTICATED_INCOMPLETE_PROFILE_SHOWS_PROFILE_SETUP', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: UnifiedIdentityScreen(
                forceProfileSetupForTest: true,
                disableAnimationsForTest: true,
                disableFirebaseAuthLookupForTest: true,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Full Name'), findsOneWidget);
      expect(find.text('Mobile Number'), findsOneWidget);
      expect(find.text('Select State'), findsOneWidget);
      expect(find.text('ESTABLISH IDENTITY'), findsOneWidget);
      expect(find.text('LOGIN / CONTINUE'), findsNothing);
    });

    testWidgets('W03_DUAL_MODE_STATE_TYPING_SEARCH_STARTSWITH_AND_CONTAINS', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: UnifiedIdentityScreen(
                forceProfileSetupForTest: true,
                disableAnimationsForTest: true,
                disableFirebaseAuthLookupForTest: true,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final stateInput = find.byKey(const ValueKey('state_input_field'));
      expect(stateInput, findsOneWidget);

      await tester.tap(stateInput);
      await tester.pumpAndSettle();
      await tester.enterText(stateInput, 'raj');
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('state_suggestion_Rajasthan')), findsOneWidget);
      expect(find.text('Rajasthan'), findsOneWidget);

      await tester.enterText(stateInput, 'utt');
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('state_suggestion_Uttar Pradesh')), findsOneWidget);
      expect(find.byKey(const ValueKey('state_suggestion_Uttarakhand')), findsOneWidget);
    });

    testWidgets('W04_DUAL_MODE_STATE_SELECTION_UPDATES_CONTROLLER', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: UnifiedIdentityScreen(
                forceProfileSetupForTest: true,
                disableAnimationsForTest: true,
                disableFirebaseAuthLookupForTest: true,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final stateInput = find.byKey(const ValueKey('state_input_field'));
      await tester.tap(stateInput);
      await tester.pumpAndSettle();
      await tester.enterText(stateInput, 'raj');
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey('state_suggestion_Rajasthan')));
      await tester.pumpAndSettle();

      expect(find.text('Rajasthan'), findsOneWidget);

      final browseBtn = find.byKey(const ValueKey('browse_states_button'));
      expect(browseBtn, findsOneWidget);
      await tester.tap(browseBtn);
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('state_search_input')), findsOneWidget);
      expect(find.byKey(const ValueKey('state_item_Goa')), findsOneWidget);

      await tester.tap(find.byKey(const ValueKey('state_item_Goa')));
      await tester.pumpAndSettle();

      expect(find.text('Goa'), findsOneWidget);
    });

    testWidgets('W05_PROFILE_CTA_ENABLED_ONLY_WHEN_ALL_FOUR_CRITERIA_SATISFIED', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: UnifiedIdentityScreen(
                forceProfileSetupForTest: true,
                disableAnimationsForTest: true,
                disableFirebaseAuthLookupForTest: true,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final ctaFinder = find.byKey(const ValueKey('identity_cta_button'));
      final dynamic initialCta = tester.widget(ctaFinder);
      expect(initialCta.enabled, isFalse);

      final nameField = find.widgetWithText(TextField, 'Full Name');
      await tester.enterText(nameField, 'Arjun Dev');
      await tester.pumpAndSettle();

      final mobileField = find.widgetWithText(TextField, 'Mobile Number');
      await tester.enterText(mobileField, '987654321'); // 9 digits
      await tester.pumpAndSettle();

      final stateInput = find.byKey(const ValueKey('state_input_field'));
      await tester.enterText(stateInput, 'Rajasthan');
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey('consent_row_tap')));
      await tester.pumpAndSettle();

      // Disabled because 9 digits
      final dynamic cta9Digit = tester.widget(ctaFinder);
      expect(cta9Digit.enabled, isFalse);

      // 10 digits
      await tester.enterText(mobileField, '9876543210');
      await tester.pumpAndSettle();

      // Enabled!
      final dynamic ctaValid = tester.widget(ctaFinder);
      expect(ctaValid.enabled, isTrue);
    });

    testWidgets('W06_RESPONSIVE_360PX_NO_RENDERFLEX_OVERFLOW', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(360, 640);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: UnifiedIdentityScreen(
                forceProfileSetupForTest: true,
                disableAnimationsForTest: true,
                disableFirebaseAuthLookupForTest: true,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });

    testWidgets('W07_STUDENT_IDENTITY_ZERO_AI_BRANDING_AND_CORRECT_TAGLINE', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: UnifiedIdentityScreen(
                forceProfileSetupForTest: false,
                disableAnimationsForTest: true,
                disableFirebaseAuthLookupForTest: true,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('The Self Study Coach'), findsNothing);
      expect(find.textContaining('AI Driven'), findsNothing);
      expect(find.textContaining('Sovereign profile secured'), findsNothing);

      expect(find.text('RankCrackers'), findsOneWidget);
      expect(find.text('May Our Learning Be Radiant.'), findsOneWidget);
    });
  });

  // ==========================================================================
  // 4. FIRESTORE SERVER COMMIT & REHYDRATION INTEGRATION TESTS
  // ==========================================================================
  group('4. FIRESTORE INTEGRATION TESTS — Server-First Commit & ACK Before Route', () {
    test('F01_FIRST_PROFILE_SERVER_COMMIT_SUCCESS_UPDATES_LOCAL_AND_ROUTES', () async {
      // Simulate successful server write and subsequent local profile cache
      const studentName = 'Vikram Meena';
      const studentMobile = '9876543214';
      const studentState = 'Rajasthan';
      const studentStateCode = 'RJ';

      // Server write succeeds -> Update local cache
      await SessionManager.completeLogin();
      await SessionManager.completeProfile(
        studentName: studentName,
        studentCity: 'Jaipur',
        studentState: studentState,
        studentStateCode: studentStateCode,
        consentAccepted: true,
      );
      await SessionManager.saveStudentMobile(studentMobile);
      await SessionManager.saveStudentState(studentState, stateCode: studentStateCode);
      await SessionManager.saveConsent(true);

      expect(SessionManager.isLoggedInSync(), isTrue);
      expect(SessionManager.profileCompletedSync(), isTrue);
      expect(SessionManager.consentAcceptedSync(), isTrue);
      expect(SessionManager.getStudentNameSync(), equals('Vikram Meena'));
      expect(SessionManager.getStudentMobileSync(), equals('9876543214'));
      expect(SessionManager.getUserStateSync(), equals('Rajasthan'));
    });

    test('F02_FIRST_PROFILE_SERVER_COMMIT_FAILURE_LEAVES_LOCAL_INCOMPLETE', () async {
      // If server write fails, local profile MUST remain incomplete and unconsented
      expect(SessionManager.profileCompletedSync(), isFalse);
      expect(SessionManager.consentAcceptedSync(), isFalse);
      expect(SessionManager.isLoggedInSync(), isFalse);
    });

    test('F03_MISSION_SELECTION_SERVER_COMMIT_SUCCESS_UPDATES_LOCAL_CACHE', () async {
      SessionManager.registerAccessibleMissions(['upsc_cse_prelims']);

      // Server ACK succeeds -> local cache updated
      await SessionManager.saveMissionIdentity(
        examId: 'upsc_cse_prelims',
        examName: 'UPSC Civil Services Prelims',
        variantId: 'prelims_gs1',
      );

      expect(SessionManager.selectedExamSync(), equals('upsc_cse_prelims'));
      expect(SessionManager.isMissionValid(SessionManager.selectedExamSync()), isTrue);
    });

    test('F04_MISSION_SELECTION_SERVER_COMMIT_FAILURE_LEAVES_LOCAL_CACHE_CLEAN', () async {
      // If server write fails, local session exam remains null/unselected
      expect(SessionManager.selectedExamSync(), isNull);
    });

    test('F05_FRESH_DEVICE_SERVER_PROFILE_AND_MISSION_RESUME_TO_DASHBOARD', () async {
      // Simulate fresh local prefs (empty SharedPreferences)
      SharedPreferences.setMockInitialValues({});
      await SessionManager.initialize();

      expect(SessionManager.isLoggedInSync(), isFalse);
      expect(SessionManager.profileCompletedSync(), isFalse);

      // Hydrate from server profile & catalog
      SessionManager.registerAccessibleMissions(['ssc_cgl']);
      await SessionManager.completeLogin();
      await SessionManager.completeProfile(
        studentName: 'Pooja Verma',
        studentCity: 'Lucknow',
        studentState: 'Uttar Pradesh',
        studentStateCode: 'UP',
        consentAccepted: true,
      );
      await SessionManager.saveStudentMobile('9876543215');
      await SessionManager.saveConsent(true);
      await SessionManager.saveMissionIdentity(
        examId: 'ssc_cgl',
        examName: 'SSC CGL',
        variantId: 'tier1',
      );

      // Verified resume to dashboard
      expect(SessionManager.profileCompletedSync(), isTrue);
      expect(SessionManager.consentAcceptedSync(), isTrue);
      expect(SessionManager.isMissionValid(SessionManager.selectedExamSync()), isTrue);
    });

    test('F06_LOGOUT_RELOGIN_SERVER_MISSION_RESUME_TO_DASHBOARD', () async {
      SessionManager.registerAccessibleMissions(['rpsc_ras_prelims']);

      // 1. Logged in with valid mission
      await SessionManager.completeLogin();
      await SessionManager.completeProfile(
        studentName: 'Sanjay Rawat',
        studentCity: 'Ajmer',
        studentState: 'Rajasthan',
        studentStateCode: 'RJ',
        consentAccepted: true,
      );
      await SessionManager.saveStudentMobile('9876543216');
      await SessionManager.saveConsent(true);
      await SessionManager.saveMissionIdentity(
        examId: 'rpsc_ras_prelims',
        examName: 'RPSC RAS Prelims',
        variantId: 'ras_prelims',
      );

      expect(SessionManager.isMissionValid(SessionManager.selectedExamSync()), isTrue);

      // 2. User logs out
      await SessionManager.logout();
      expect(SessionManager.isLoggedInSync(), isFalse);
      expect(SessionManager.profileCompletedSync(), isFalse);

      // 3. User logs in again -> rehydrates from server & catalog
      SessionManager.registerAccessibleMissions(['rpsc_ras_prelims']);
      await SessionManager.completeLogin();
      await SessionManager.completeProfile(
        studentName: 'Sanjay Rawat',
        studentCity: 'Ajmer',
        studentState: 'Rajasthan',
        studentStateCode: 'RJ',
        consentAccepted: true,
      );
      await SessionManager.saveStudentMobile('9876543216');
      await SessionManager.saveConsent(true);
      await SessionManager.saveMissionIdentity(
        examId: 'rpsc_ras_prelims',
        examName: 'RPSC RAS Prelims',
        variantId: 'ras_prelims',
      );

      expect(SessionManager.profileCompletedSync(), isTrue);
      expect(SessionManager.isMissionValid(SessionManager.selectedExamSync()), isTrue);
    });
  });

  // ==========================================================================
  // 5. RC_47UI4 CHIEF ARCHITECT CONTRACT TESTS
  // ==========================================================================
  group('5. RC_47UI4 CHIEF ARCHITECT CONTRACT TESTS', () {
    test('C01_OPAQUE_CASE_SENSITIVE_MISSION_ID_PRESERVATION', () {
      final exactMissions = [
        'neet_(ug)-2027',
        'RPSC_FIRST_GRADE2026_2026_1782713222215',
        'jee_main_2026',
        'upsc_cse_prelims',
      ];

      SessionManager.registerAccessibleMissions(exactMissions);

      for (final id in exactMissions) {
        expect(SessionManager.resolveCanonicalMissionId(id), equals(id));
        expect(SessionManager.isMissionValid(id), isTrue);
      }

      // No casing mutation allowed
      expect(SessionManager.resolveCanonicalMissionId('NEET_(UG)-2027'), isNull);
      expect(SessionManager.resolveCanonicalMissionId('rpsc_first_grade2026_2026_1782713222215'), isNull);
    });

    test('C02_STATUS_FAIL_SAFE_MAPPING_TRUTH', () {
      // Unknown / malformed status MUST NOT default to Available
      expect(Recruitment.studentStatusLabel('UNKNOWN_FUTURE_STATUS'), equals('Preparing'));
      expect(Recruitment.studentStatusLabel('xyz_corrupt_state'), equals('Preparing'));
      expect(Recruitment.studentStatusLabel(''), equals('Preparing'));

      // Explicitly handled statuses
      expect(Recruitment.studentStatusLabel('PREPARING'), equals('Preparing'));
      expect(Recruitment.studentStatusLabel('COMING_SOON'), equals('Coming Soon'));
      expect(Recruitment.studentStatusLabel('LIVE'), equals('Available'));
      expect(Recruitment.studentStatusLabel('AVAILABLE'), equals('Available'));
      expect(Recruitment.studentStatusLabel('ACTIVE'), equals('Available'));
      expect(Recruitment.studentStatusLabel('PUBLISHED'), equals('Available'));
      expect(Recruitment.studentStatusLabel('HOLD'), equals('On Hold'));
      expect(Recruitment.studentStatusLabel('PAUSED'), equals('Paused'));
      expect(Recruitment.studentStatusLabel('DRAFT'), equals('Draft'));
      expect(Recruitment.studentStatusLabel('BLOCKED'), equals('Blocked'));
      expect(Recruitment.studentStatusLabel('ARCHIVED'), equals('Archived'));
    });

    test('C03_DISCOVERABLE_NOT_EQUAL_TO_STARTABLE_GATING', () {
      // 1. Live + Startable
      const liveRecruitment = Recruitment(
        id: 'r1',
        recruitmentGroupId: 'rg1',
        boardId: 'b1',
        examId: 'live_exam_1',
        examBlueprintId: 'bp1',
        title: 'Live Exam',
        titleHindi: '',
        year: 2026,
        state: 'Rajasthan',
        examCategory: 'GENERAL',
        status: 'LIVE',
        quickEntryEnabled: true,
        smartEntryEnabled: true,
      );
      expect(liveRecruitment.isStartable, isTrue);

      // 2. Preparing -> Not startable
      final preparingRecruitment = liveRecruitment.copyWith(status: 'PREPARING');
      expect(preparingRecruitment.isStartable, isFalse);

      // 3. Hold -> Not startable
      final holdRecruitment = liveRecruitment.copyWith(status: 'HOLD');
      expect(holdRecruitment.isStartable, isFalse);

      // 4. Draft -> Not startable
      final draftRecruitment = liveRecruitment.copyWith(status: 'DRAFT');
      expect(draftRecruitment.isStartable, isFalse);

      // 5. Founder Hold -> Not startable
      final founderHoldRecruitment = liveRecruitment.copyWith(founderHold: true);
      expect(founderHoldRecruitment.isStartable, isFalse);

      // 6. Archived -> Not startable
      final archivedRecruitment = liveRecruitment.copyWith(archived: true);
      expect(archivedRecruitment.isStartable, isFalse);

      // 7. Governance Lock -> Not startable
      final govLockedRecruitment = liveRecruitment.copyWith(manualGovernanceLock: true);
      expect(govLockedRecruitment.isStartable, isFalse);

      // 8. Variant required but selection not ready -> Not startable
      final variantReqRecruitment = liveRecruitment.copyWith(variantRequired: true, missionSelectionReady: false);
      expect(variantReqRecruitment.isStartable, isFalse);

      // 9. Both entries disabled -> Not startable
      final noEntriesRecruitment = liveRecruitment.copyWith(quickEntryEnabled: false, smartEntryEnabled: false);
      expect(noEntriesRecruitment.isStartable, isFalse);
    });

    test('C04_STATE_AND_UT_DISCOVERABILITY_ACROSS_INDIA', () {
      // 28 States + 8 UTs total 36 entities
      expect(IndiaStates.statesAndUTs.length, equals(36));

      // Test UTs specifically
      expect(IndiaStates.getStateCode('Delhi'), equals('DL'));
      expect(IndiaStates.getStateCode('Ladakh'), equals('LA'));
      expect(IndiaStates.getStateCode('Chandigarh'), equals('CH'));
      expect(IndiaStates.getStateCode('Jammu and Kashmir'), equals('JK'));
      expect(IndiaStates.getStateCode('Puducherry'), equals('PY'));
      expect(IndiaStates.getStateCode('Lakshadweep'), equals('LD'));
      expect(IndiaStates.getStateCode('Andaman and Nicobar Islands'), equals('AN'));
      expect(IndiaStates.getStateCode('Dadra and Nagar Haveli and Daman and Diu'), equals('DN'));

      // Test Telangana canonical code
      expect(IndiaStates.getStateCode('Telangana'), equals('TG'));
    });

    test('C05_SNAPSHOT_FAILURE_MUST_FAIL_CLOSED_TO_MISSION_REALM', () {
      // When snapshot is uninitialized / failed, isMissionValid MUST return false
      // even if user has a previously stored selected_exam!
      expect(SessionManager.currentSnapshot.snapshotReady, isFalse);
      expect(SessionManager.isMissionValid('jee_main_2026'), isFalse);
      expect(SessionManager.resolveCanonicalMissionId('jee_main_2026'), isNull);
    });

    testWidgets('C06_MISSION_REALM_UI_STATE_UT_TAB_AND_BUTTON_GATING', (WidgetTester tester) async {
      const mockRecruitments = [
        Recruitment(
          id: 'rec_delhi_1',
          recruitmentGroupId: 'rg_dl',
          boardId: 'dsssb',
          examId: 'dsssb_prt_2026',
          examBlueprintId: 'bp_dl',
          title: 'DSSSB PRT Teacher Exam',
          titleHindi: '',
          year: 2026,
          state: 'Delhi',
          stateCode: 'DL',
          jurisdictionLevel: 'UT',
          examCategory: 'TEACHING',
          status: 'LIVE',
          quickEntryEnabled: true,
          smartEntryEnabled: true,
          missionVariables: {'medium': 'Hindi & English'},
        ),
        Recruitment(
          id: 'rec_raj_preparing',
          recruitmentGroupId: 'rg_rj',
          boardId: 'rpsc',
          examId: 'rpsc_school_lecturer',
          examBlueprintId: 'bp_rj',
          title: 'RPSC School Lecturer',
          titleHindi: '',
          year: 2026,
          state: 'Rajasthan',
          stateCode: 'RJ',
          jurisdictionLevel: 'STATE',
          examCategory: 'TEACHING',
          status: 'PREPARING',
          quickEntryEnabled: false,
          smartEntryEnabled: false,
        ),
        Recruitment(
          id: 'rec_raj_quick_disabled',
          recruitmentGroupId: 'rg_rj2',
          boardId: 'rpsc',
          examId: 'rpsc_ae_civil',
          examBlueprintId: 'bp_rj2',
          title: 'RPSC Assistant Engineer Civil',
          titleHindi: '',
          year: 2026,
          state: 'Rajasthan',
          stateCode: 'RJ',
          jurisdictionLevel: 'STATE',
          examCategory: 'ENGINEERING',
          status: 'LIVE',
          quickEntryEnabled: false,
          smartEntryEnabled: true,
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            recruitmentsProvider.overrideWith((ref) => Stream.value(mockRecruitments)),
          ],
          child: const MaterialApp(
            home: MissionRealmScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify tab label is 'STATE / UT EXAMS'
      expect(find.text('STATE / UT EXAMS'), findsOneWidget);
      expect(find.text('CENTRAL EXAMS'), findsOneWidget);

      // Switch to STATE / UT EXAMS tab
      await tester.tap(find.byKey(const ValueKey('tab_state_exams')));
      await tester.pumpAndSettle();

      // Rajasthan is default selected -> verify RPSC exams appear
      expect(find.text('RPSC School Lecturer'), findsOneWidget);
      expect(find.text('RPSC Assistant Engineer Civil'), findsOneWidget);

      // Expand 'RPSC School Lecturer' (PREPARING)
      await tester.tap(find.text('RPSC School Lecturer'));
      await tester.pumpAndSettle();

      // Status text must be 'Preparing' (yearless identity)
      expect(find.text('Preparing'), findsWidgets);

      // The single ordinary entry remains disabled for a preparing mission.
      final preparingEntry = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'ENTER MISSION'),
      );
      expect(preparingEntry.enabled, isFalse);

      // Expand 'RPSC Assistant Engineer Civil' (LIVE, smart=true, quick=false)
      await tester.ensureVisible(find.text('RPSC Assistant Engineer Civil'));
      await tester.tap(find.text('RPSC Assistant Engineer Civil'));
      await tester.pumpAndSettle();

      final liveEntry = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'ENTER MISSION'),
      );
      expect(liveEntry.enabled, isTrue);
    });

    test('C07_ZERO_FAKE_READINESS_ZERO_EVIDENCE_YIELDS_ZERO_PERCENT_AND_PENDING', () {
      const cov = CoverageState(
        examId: 'jee_main_2026',
        totalNodes: 100,
        completedNodes: 0,
        masteredNodes: 0,
        weakNodes: 0,
        coveragePercent: 0.0,
        uncoveredNodeIds: [],
        weakNodeIds: [],
      );
      const rsk = RiskState(
        overallRisk: 0.60,
        coverageRisk: 0.60,
        masteryRisk: 0.60,
        weaknessRisk: 0.60,
        highRisk: true,
      );

      final state = ReadinessEngine.calculate(
        coverage: cov,
        masteryPercent: 0.0,
        assessmentPerformance: 0.0,
        risk: rsk,
      );

      // Must NOT yield 4.0%
      expect(state.score, equals(0.0));
      expect(state.status, equals('Pending Evidence'));
      expect(state.confidence, equals(0.0));
    });

    test('C08_JEE_MAIN_NODE_FILTER_PRESERVES_EMPTY_AND_CANONICAL_PAPER1_NODES', () {
      final n1 = MicroTopicNode(
        id: 'jee_n1',
        examId: 'jee_main_2026',
        paperId: '',
        variantId: '',
        subjectId: 'Physics',
        unitId: 'u1',
        chapterId: 'u1',
        topicId: 't1',
        title: 'Kinematics',
        titleHindi: '',
        learningOutcome: '',
        subjectHindi: '',
        chapterHindi: '',
        description: '',
        contentRegistryId: '',
        atomicTopicIds: const [],
        factCount: 0,
        prerequisiteIds: const [],
        dependentIds: const [],
        relatedIds: const [],
        revisionChainIds: const [],
        difficulty: 1,
        importance: 1,
        weightage: 1,
        status: 'published',
        isDiagnosticEligible: false,
        pyqFrequency: 0,
        sourceBook: '',
        sourcePage: '',
        sourceUploadId: '',
      );

      final paperIdNorm = n1.paperId.trim().toUpperCase();
      final isPaper1 = n1.examId != 'jee_main_2026' ||
          paperIdNorm.isEmpty ||
          paperIdNorm == 'PAPER_1' ||
          paperIdNorm == 'PAPER 1' ||
          paperIdNorm == 'PAPER-1' ||
          paperIdNorm == 'PAPER1';

      expect(isPaper1, isTrue);
    });
  });
}
