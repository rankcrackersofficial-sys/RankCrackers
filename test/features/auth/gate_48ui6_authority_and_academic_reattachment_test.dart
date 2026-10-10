import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
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
    SharedPreferences.setMockInitialValues({});
    await SessionManager.initialize();
    SessionManager.disableFirebaseForTest = true;
  });

  group('GATE 48UI6 — Universal Authority Consistency & Academic Reattachment Tests', () {
    final mockMissions = [
      // Central: NTA (2 missions)
      const Recruitment(
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
        quickEntryEnabled: true,
        smartEntryEnabled: true,
      ),
      const Recruitment(
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
        quickEntryEnabled: true,
        smartEntryEnabled: true,
      ),
      // Central: UPSC (1 mission)
      const Recruitment(
        id: 'upsc_cse_prelims',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'upsc',
        examId: 'upsc_cse_prelims',
        examBlueprintId: 'upsc_blueprint',
        title: 'UPSC Civil Services 2026',
        titleHindi: 'यूपीएससी 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Civil Services',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'upsc',
        authorityDisplayName: 'Union Public Service Commission (UPSC)',
        status: 'AVAILABLE',
        quickEntryEnabled: true,
        smartEntryEnabled: true,
      ),
      // Central: SSC (9 missions)
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
        status: 'AVAILABLE',
        quickEntryEnabled: true,
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
        status: 'AVAILABLE',
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
        status: 'AVAILABLE',
      ),
      const Recruitment(
        id: 'ssc_mts_havaldar',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_mts_havaldar',
        examBlueprintId: 'ssc_mts_blueprint',
        title: 'SSC MTS 2026',
        titleHindi: 'एसएससी एमटीएस 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Multi Tasking',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
        status: 'AVAILABLE',
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
        status: 'AVAILABLE',
      ),
      const Recruitment(
        id: 'ssc_gd',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_gd',
        examBlueprintId: 'ssc_gd_blueprint',
        title: 'SSC GD 2026',
        titleHindi: 'एसएससी जीडी 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Constable',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
        status: 'AVAILABLE',
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
        status: 'AVAILABLE',
      ),
      const Recruitment(
        id: 'ssc_hindi_translators',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'ssc',
        examId: 'ssc_hindi_translators',
        examBlueprintId: 'ssc_jht_blueprint',
        title: 'SSC JHT 2026',
        titleHindi: 'एसएससी जेएचटी 2026',
        year: 2026,
        state: 'Central',
        examCategory: 'Translation',
        jurisdictionLevel: 'CENTRAL',
        authorityGroupKey: 'ssc',
        authorityDisplayName: 'Staff Selection Commission (SSC)',
        status: 'AVAILABLE',
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
        status: 'AVAILABLE',
      ),

      // State: Rajasthan (RPSC - 2 missions)
      const Recruitment(
        id: 'rpsc_ras_prelims',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'rpsc',
        examId: 'rpsc_ras_prelims',
        examBlueprintId: 'rpsc_ras_blueprint',
        title: 'RPSC RAS Prelims 2026',
        titleHindi: 'आरपीएससी आरएएस 2026',
        year: 2026,
        state: 'Rajasthan',
        stateCode: 'RJ',
        stateName: 'Rajasthan',
        examCategory: 'Civil Services',
        jurisdictionLevel: 'STATE',
        authorityGroupKey: 'rpsc',
        authorityDisplayName: 'Rajasthan Public Service Commission (RPSC)',
        status: 'AVAILABLE',
        quickEntryEnabled: true,
      ),
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
        status: 'AVAILABLE',
        quickEntryEnabled: true,
        missionVariables: {'variants_count': 28},
      ),
    ];

    testWidgets('1. Universal Authority summary: SSC shows "9 exams", UPSC shows "1 exam", NTA shows "2 exams"',
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
            recruitmentsProvider.overrideWith((ref) => Stream.value(mockMissions)),
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: MissionRealmScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Dynamic summary checks on Central tab
      expect(find.text('9 exams'), findsOneWidget); // SSC
      expect(find.text('1 exam'), findsOneWidget);  // UPSC (singular)
      expect(find.text('2 exams'), findsOneWidget); // NTA
    });

    testWidgets('2. State tab: RPSC authority shows "2 exams" dynamically, and RPSC 1st Grade shows "28 subject variants"',
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
            recruitmentsProvider.overrideWith((ref) => Stream.value(mockMissions)),
            authRepositoryProvider.overrideWithValue(MockAuthRepository()),
          ],
          child: const MaterialApp(
            home: MissionRealmScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Switch to State tab
      await tester.tap(find.byKey(const ValueKey('tab_state_exams')));
      await tester.pumpAndSettle();

      // RPSC Authority card shows 2 exams (NOT 28 or 30)
      expect(find.text('Rajasthan Public Service Commission (RPSC)'), findsOneWidget);
      expect(find.text('2 exams'), findsOneWidget);

      // Expand RPSC First Grade card
      await tester.tap(find.text('RPSC 1st Grade 2026'));
      await tester.pumpAndSettle();

      // RPSC First Grade mission row shows "28 subject variants"
      expect(find.text('RPSC 1st Grade 2026'), findsOneWidget);
      expect(find.textContaining('28 subject variants'), findsOneWidget);
    });

    test('3. Startability fail-safe: missing backend values default to false', () {
      final incompleteRecruitment = Recruitment.fromMap({
        'id': 'test_mission_incomplete',
        'title': 'Test Incomplete Mission',
        'status': 'AVAILABLE',
      });

      expect(incompleteRecruitment.quickEntryEnabled, isFalse);
      expect(incompleteRecruitment.smartEntryEnabled, isFalse);
      expect(incompleteRecruitment.missionSelectionReady, isFalse);
      expect(incompleteRecruitment.isStartable, isFalse);
    });

    test('4. Exact mission ID propagation without alias drift', () async {
      final jeeRecruitment = mockMissions.firstWhere((r) => r.id == 'jee_main_2026');
      final rpscRecruitment = mockMissions.firstWhere((r) => r.id == 'RPSC_FIRST_GRADE2026_2026_1782713222215');

      await SessionManager.saveMissionIdentity(
        examId: jeeRecruitment.examId,
        examName: jeeRecruitment.title,
        recruitmentId: jeeRecruitment.id,
        examBlueprintId: jeeRecruitment.examBlueprintId,
        variantId: jeeRecruitment.variantCode,
        variantName: jeeRecruitment.variantCode,
      );

      expect(SessionManager.getExamIdSync(), equals('jee_main_2026'));
      expect(SessionManager.selectedRecruitmentIdSync(), equals('jee_main_2026'));

      // Switch to RPSC First Grade
      await SessionManager.saveMissionIdentity(
        examId: rpscRecruitment.examId,
        examName: rpscRecruitment.title,
        recruitmentId: rpscRecruitment.id,
        examBlueprintId: rpscRecruitment.examBlueprintId,
        variantId: rpscRecruitment.variantCode,
        variantName: rpscRecruitment.variantCode,
      );

      expect(SessionManager.getExamIdSync(), equals('RPSC_FIRST_GRADE2026_2026_1782713222215'));
      expect(SessionManager.selectedRecruitmentIdSync(), equals('RPSC_FIRST_GRADE2026_2026_1782713222215'));
    });

    test('5. Mission switch clears old engine state and eliminates cross-mission bleed', () async {
      final engine = KnowledgeEngine.instance;
      final missionA = mockMissions.firstWhere((r) => r.id == 'jee_main_2026');
      final missionB = mockMissions.firstWhere((r) => r.id == 'RPSC_FIRST_GRADE2026_2026_1782713222215');

      await engine.initialize(recruitment: missionA, force: true);
      expect(engine.activeRecruitment?.id, equals('jee_main_2026'));

      // Switch to Mission B
      await engine.initialize(recruitment: missionB, force: true);
      expect(engine.activeRecruitment?.id, equals('RPSC_FIRST_GRADE2026_2026_1782713222215'));
      expect(engine.nodeStates, isEmpty);
      expect(engine.atomicMasteryStates, isEmpty);
    });

    test('6. Student status label fails safe to Preparing on unknown or empty status', () {
      expect(Recruitment.studentStatusLabel('UNKNOWN_STATUS'), equals('Preparing'));
      expect(Recruitment.studentStatusLabel(''), equals('Preparing'));
      expect(Recruitment.studentStatusLabel('DRAFT'), equals('Draft'));
      expect(Recruitment.studentStatusLabel('HOLD'), equals('On Hold'));
      expect(Recruitment.studentStatusLabel('AVAILABLE'), equals('Available'));
    });
  });
}
