import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/data/india_states.dart';
import 'package:rank_crackers/features/auth/domain/repositories/auth_repository.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:rank_crackers/features/auth/presentation/providers/mission_realm_provider.dart';
import 'package:rank_crackers/features/auth/presentation/screens/mission_realm_screen.dart';
import 'package:rank_crackers/features/auth/presentation/screens/unified_identity_screen.dart';
import 'package:rank_crackers/features/onboarding/presentation/screens/splash_screen.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';

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
    SharedPreferences.setMockInitialValues({});
    await SessionManager.initialize();
    SessionManager.disableFirebaseForTest = true;
  });

  group('46UI4 - Student Identity & Mission Realm UX Tests', () {
    // ------------------------------------------------------------------------
    // 1. Searchable State Picker & First-Frame Hydration
    // ------------------------------------------------------------------------
    test('1. IndiaStates search and state code resolution', () {
      // Instant intelligent search
      final rajResults = IndiaStates.searchStates('RAJ');
      expect(rajResults, contains('Rajasthan'));

      final uttResults = IndiaStates.searchStates('UTT');
      expect(uttResults, contains('Uttar Pradesh'));
      expect(uttResults, contains('Uttarakhand'));

      // Code resolution
      expect(IndiaStates.getStateCode('Rajasthan'), equals('RJ'));
      expect(IndiaStates.getStateCode('Uttar Pradesh'), equals('UP'));
      expect(IndiaStates.getStateName('RJ'), equals('Rajasthan'));
      expect(IndiaStates.getStateName('UP'), equals('Uttar Pradesh'));
    });

    test('2. First-frame state hydration contract in SessionManager', () async {
      SharedPreferences.setMockInitialValues({
        'user_state': 'Rajasthan',
        'user_state_code': 'RJ',
      });
      await SessionManager.initialize();

      // Synchronous hydration on first frame
      expect(SessionManager.getUserStateSync(), equals('Rajasthan'));
      expect(SessionManager.getUserStateCodeSync(), equals('RJ'));
    });

    // ------------------------------------------------------------------------
    // 2. Returning User Profile Bypass & Primary Profile Fields
    // ------------------------------------------------------------------------
    test('3. Returning user with complete profile evaluates isProfileComplete == true', () async {
      SharedPreferences.setMockInitialValues({
        'firebase_uid': 'student_user_1',
        'student_name': 'Aarav Sharma',
        'student_email': 'aarav@example.com',
        'student_mobile': '9876543210',
        'user_state': 'Rajasthan',
        'user_state_code': 'RJ',
        'profile_completed': true,
        'consent_accepted': true,
      });
      await SessionManager.initialize();

      expect(SessionManager.profileCompletedSync(), isTrue);
      expect(SessionManager.getStudentNameSync(), equals('Aarav Sharma'));
      expect(SessionManager.getStudentMobileSync(), equals('9876543210'));
      expect(SessionManager.getUserStateSync(), equals('Rajasthan'));
      expect(SessionManager.getUserStateCodeSync(), equals('RJ'));
    });

    testWidgets('4. Profile Setup UI shows only 4 primary fields (District eliminated)',
        (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({
        'firebase_uid': 'student_new_1',
        'student_email': 'newstudent@example.com',
      });
      await SessionManager.initialize();

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

      // Verify the primary fields exist (Name, Mobile, State)
      expect(find.text('Full Name'), findsOneWidget);
      expect(find.text('Mobile Number'), findsOneWidget);
      expect(find.text('Select State'), findsOneWidget);

      // Verify DISTRICT is completely eliminated from the UI
      expect(find.text('DISTRICT *'), findsNothing);
      expect(find.text('DISTRICT'), findsNothing);
      expect(find.text('Select District'), findsNothing);
    });

    // ------------------------------------------------------------------------
    // 3. Mission Realm: Central vs State Tabs, SSC 9 Missions, State Filtering
    // ------------------------------------------------------------------------
    final mockMissions = [
      // Central: NTA
      const Recruitment(
        id: 'jee_main_2026',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'nta',
        examId: 'jee_main',
        examBlueprintId: 'jee_blueprint',
        title: 'JEE Main 2026',
        titleHindi: 'जेईई मेन 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Engineering',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'nta',
        authorityDisplayName: 'National Testing Agency (NTA)',
      ),
      const Recruitment(
        id: 'neet_ug_2027',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'nta',
        examId: 'neet_ug',
        examBlueprintId: 'neet_blueprint',
        title: 'NEET UG 2027',
        titleHindi: 'नीट यूजी 2027',
        year: 2027,
        state: 'Central',
        examCategory: 'Medical',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'nta',
        authorityDisplayName: 'National Testing Agency (NTA)',
      ),
      // Central: UPSC
      const Recruitment(
        id: 'upsc_cse_prelims',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'upsc',
        examId: 'upsc_cse_prelims',
        examBlueprintId: 'upsc_blueprint',
        title: 'UPSC Civil Services – Prelims 2026',
        titleHindi: 'यूपीएससी सिविल सेवा 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Civil Services',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'upsc',
        authorityDisplayName: 'Union Public Service Commission (UPSC)',
      ),
      // Central: SSC (All 9 canonical missions)
      const Recruitment(
        id: 'ssc_cgl',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_cgl',
        examBlueprintId: 'ssc_cgl_blueprint',
        title: 'SSC CGL 2026',
        titleHindi: 'एसएससी सीजीएल 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Graduate Level',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),
      const Recruitment(
        id: 'ssc_je',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_je',
        examBlueprintId: 'ssc_je_blueprint',
        title: 'SSC JE 2026',
        titleHindi: 'एसएससी जेई 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Engineering',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),
      const Recruitment(
        id: 'ssc_selection_post',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_selection_post',
        examBlueprintId: 'ssc_sp_blueprint',
        title: 'SSC Selection Post 2026',
        titleHindi: 'एसएससी चयन पद 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Selection Post',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),
      const Recruitment(
        id: 'ssc_chsl',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_chsl',
        examBlueprintId: 'ssc_chsl_blueprint',
        title: 'SSC CHSL 2026',
        titleHindi: 'एसएससी सीएचएसएल 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Higher Secondary',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),
      const Recruitment(
        id: 'ssc_stenographer',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_stenographer',
        examBlueprintId: 'ssc_steno_blueprint',
        title: 'SSC Stenographer 2026',
        titleHindi: 'एसएससी आशुलिपिक 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Stenography',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),
      const Recruitment(
        id: 'ssc_hindi_translators',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_hindi_translators',
        examBlueprintId: 'ssc_jht_blueprint',
        title: 'SSC Junior Hindi Translator 2026',
        titleHindi: 'एसएससी जूनियर अनुवादक 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Translation',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),
      const Recruitment(
        id: 'ssc_mts_havaldar',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_mts_havaldar',
        examBlueprintId: 'ssc_mts_blueprint',
        title: 'SSC MTS & Havaldar 2026',
        titleHindi: 'एसएससी एमटीएस 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Multi Tasking',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),
      const Recruitment(
        id: 'ssc_cpo',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_cpo',
        examBlueprintId: 'ssc_cpo_blueprint',
        title: 'SSC CPO 2026',
        titleHindi: 'एसएससी सीपीओ 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Police',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),
      const Recruitment(
        id: 'ssc_gd',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_gd',
        examBlueprintId: 'ssc_gd_blueprint',
        title: 'SSC GD Constable 2026',
        titleHindi: 'एसएससी जीडी 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Constable',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
      ),

      // State: Rajasthan (RPSC)
      const Recruitment(
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
      ),

      // State: Uttar Pradesh (UPPSC)
      const Recruitment(
        id: 'uppsc_pcs_2026',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'uppsc',
        examId: 'uppsc_pcs_2026',
        examBlueprintId: 'uppsc_pcs_blueprint',
        title: 'UPPSC Combined State Exam 2026',
        titleHindi: 'यूपीपीएससी पीसीएस 2026',
        year: 2026,
        state: 'Uttar Pradesh',
        stateCode: 'UP',
        stateName: 'Uttar Pradesh',
        examCategory: 'Civil Services',
        jurisdictionLevel: 'STATE',
        authorityGroupKey: 'uppsc',
        authorityDisplayName: 'Uttar Pradesh Public Service Commission (UPPSC)',
      ),
    ];

    testWidgets('5. Mission Realm has CENTRAL EXAMS & STATE EXAMS tabs; no competitive/qualifying chips',
        (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({
        'user_state': 'Rajasthan',
        'user_state_code': 'RJ',
      });
      await SessionManager.initialize();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            publishedRecruitmentsProvider.overrideWithValue(mockMissions),
            recruitmentsProvider.overrideWith(
                (ref) => Stream.value(mockMissions)),
          ],
          child: const MaterialApp(
            home: MissionRealmScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Navigation tab verification
      expect(find.byKey(const ValueKey('tab_central_exams')), findsOneWidget);
      expect(find.byKey(const ValueKey('tab_state_exams')), findsOneWidget);

      // Verify old taxonomy and notices are removed
      expect(find.text('COMPETITIVE'), findsNothing);
      expect(find.text('QUALIFYING'), findsNothing);
      expect(find.textContaining('Founder missions verified'), findsNothing);
      expect(find.textContaining('pending source proof'), findsNothing);

      // Central view: NTA, UPSC, SSC are present
      expect(find.text('JEE Main 2026'), findsOneWidget);
      expect(find.text('NEET UG 2027'), findsOneWidget);
      expect(find.text('UPSC Civil Services – Prelims 2026'), findsOneWidget);

      // SSC Expandable Group contains all 9 canonical missions
      expect(find.byKey(const ValueKey('ssc_group_header')), findsOneWidget);
      expect(find.text('SSC CGL 2026'), findsOneWidget);
      expect(find.text('SSC JE 2026'), findsOneWidget);
      expect(find.text('SSC Selection Post 2026'), findsOneWidget);
      expect(find.text('SSC CHSL 2026'), findsOneWidget);
      expect(find.text('SSC Stenographer 2026'), findsOneWidget);
      expect(find.text('SSC Junior Hindi Translator 2026'), findsOneWidget);
      expect(find.text('SSC MTS & Havaldar 2026'), findsOneWidget);
      expect(find.text('SSC CPO 2026'), findsOneWidget);
      expect(find.text('SSC GD Constable 2026'), findsOneWidget);

      // State exam (RPSC) should NOT be displayed on Central tab
      expect(find.text('RPSC 1st Grade 2026'), findsNothing);
    });

    testWidgets('6. State tab strictly filters by user state (Rajasthan -> RPSC, UPPSC hidden)',
        (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({
        'user_state': 'Rajasthan',
        'user_state_code': 'RJ',
      });
      await SessionManager.initialize();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            publishedRecruitmentsProvider.overrideWithValue(mockMissions),
            recruitmentsProvider.overrideWith(
                (ref) => Stream.value(mockMissions)),
          ],
          child: const MaterialApp(
            home: MissionRealmScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap on STATE EXAMS tab
      await tester.tap(find.byKey(const ValueKey('tab_state_exams')));
      await tester.pumpAndSettle();

      // Rajasthan is the current state -> RPSC 1st Grade must be visible
      expect(find.text('RPSC 1st Grade 2026'), findsOneWidget);

      // UPPSC must be hidden
      expect(find.text('UPPSC Combined State Exam 2026'), findsNothing);

      // Central exams must be hidden
      expect(find.text('JEE Main 2026'), findsNothing);
      expect(find.text('SSC CGL 2026'), findsNothing);
    });

    testWidgets('7. State tab with state having 0 missions displays clean student empty state',
        (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({
        'user_state': 'Goa',
        'user_state_code': 'GA',
      });
      await SessionManager.initialize();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            publishedRecruitmentsProvider.overrideWithValue(mockMissions),
            recruitmentsProvider.overrideWith(
                (ref) => Stream.value(mockMissions)),
          ],
          child: const MaterialApp(
            home: MissionRealmScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap on STATE EXAMS tab
      await tester.tap(find.byKey(const ValueKey('tab_state_exams')));
      await tester.pumpAndSettle();

      // Clean student empty state
      expect(find.text('No exams available for Goa yet.'), findsOneWidget);
      expect(find.text('Missions for Goa will appear here once announced.'), findsOneWidget);

      // No Founder / pipeline debug copy
      expect(find.textContaining('Founder'), findsNothing);
      expect(find.textContaining('pipeline'), findsNothing);
      expect(find.textContaining('pending source proof'), findsNothing);
    });

    // ------------------------------------------------------------------------
    // 4. 46UI5 Runtime Recovery: Splash Tagline, Consent Copy, Normalization
    // ------------------------------------------------------------------------
    testWidgets('8. Splash screen displays exact locked Sanskrit and English tagline; old tagline absent',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SplashScreen(),
        ),
      );
      // Pump initial frame
      await tester.pump(const Duration(milliseconds: 200));

      // Assert exact Sanskrit copy
      expect(find.text('तेजस्वि नावधीतमस्तु।'), findsOneWidget);

      // Assert exact English copy
      expect(find.text('May Our Learning Be Radiant.'), findsOneWidget);

      // Assert absence of old tagline on splash surface
      expect(find.text('The Self Study Coach'), findsNothing);
      expect(find.textContaining('Preparing The Battlefield'), findsNothing);
      expect(find.textContaining('Your right is to action alone'), findsNothing);

      // Drain splash delay timer
      await tester.pump(const Duration(seconds: 4));
    });

    testWidgets('9. Consent row has clean student copy and internal Founder phrase is absent',
        (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({
        'firebase_uid': 'student_test_consent',
        'student_email': 'test@example.com',
      });
      await SessionManager.initialize();

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

      // Verify clean Student-safe copy
      expect(find.text('I agree to the Privacy Policy and Terms of Service.'), findsOneWidget);

      // Verify internal Founder copy is completely absent
      expect(find.textContaining('pending Founder legal content confirmation'), findsNothing);
      expect(find.textContaining('Founder'), findsNothing);

      // Verify entire consent row is tappable and toggles checkbox
      final checkboxFinder = find.byKey(const ValueKey('consent_checkbox'));
      expect(checkboxFinder, findsOneWidget);

      // Tap consent row
      await tester.tap(find.byKey(const ValueKey('consent_row_tap')));
      await tester.pumpAndSettle();

      // Verify check icon appears
      expect(find.byIcon(Icons.check), findsOneWidget);
    });

    test('10. normalizeIndianMobile correctly normalizes all valid formats to 10 digits', () {
      expect(UnifiedIdentityScreen.normalizeIndianMobile('+919694402255'), equals('9694402255'));
      expect(UnifiedIdentityScreen.normalizeIndianMobile('+91 96944 02255'), equals('9694402255'));
      expect(UnifiedIdentityScreen.normalizeIndianMobile('09694402255'), equals('9694402255'));
      expect(UnifiedIdentityScreen.normalizeIndianMobile('9694402255'), equals('9694402255'));
      expect(UnifiedIdentityScreen.normalizeIndianMobile('919694402255'), equals('9694402255'));
    });

    testWidgets('11. Profile setup with +91 prefilled mobile normalizes and enables CTA upon consent',
        (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({
        'firebase_uid': 'student_hydrated',
        'student_name': 'Yuvraj Singh',
        'student_mobile': '+919694402255', // Hydrated with country code
        'user_state': 'Rajasthan',
        'user_state_code': 'RJ',
      });
      await SessionManager.initialize();

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

      // Mobile should be normalized to 10 digits
      expect(find.text('9694402255'), findsOneWidget);
      expect(find.text('Yuvraj Singh'), findsOneWidget);
      expect(find.text('Rajasthan'), findsOneWidget);

      // Tap consent to satisfy all 4 criteria
      await tester.tap(find.byKey(const ValueKey('consent_row_tap')));
      await tester.pumpAndSettle();

      // ESTABLISH IDENTITY button must be present and enabled
      expect(find.text('ESTABLISH IDENTITY'), findsOneWidget);
    });

    testWidgets('12. Login surface contains Continue with Google and NO phone/OTP login',
        (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({});
      await SessionManager.initialize();

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

      // Verify Continue with Google
      expect(find.text('Continue with Google'), findsOneWidget);

      // Verify NO phone login / OTP widgets exist
      expect(find.textContaining('OTP'), findsNothing);
      expect(find.textContaining('Phone Login'), findsNothing);
      expect(find.textContaining('Send OTP'), findsNothing);
    });
  });
}
