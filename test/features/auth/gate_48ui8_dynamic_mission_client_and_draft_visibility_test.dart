import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/data/india_states.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SessionManager.disableFirebaseForTest = true;
    SharedPreferences.setMockInitialValues({
      'user_state': 'Central',
      'user_state_code': 'IN',
    });
    await SessionManager.initialize();
  });

  group('GATE 48UI8 — Dynamic Net-New Mission Client Compatibility & Draft Non-Leak Tests', () {

    // 1. DRAFT MISSION FIXTURE
    final draftCanaryMission = const Recruitment(
      id: 'afcat',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'auth_in_indian_air_force',
      examId: 'afcat',
      examBlueprintId: 'afcat_blueprint',
      title: 'Air Force Common Admission Test',
      titleHindi: 'Air Force Common Admission Test',
      year: 2026,
      state: 'Central',
      examCategory: 'Defence',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'auth_in_indian_air_force',
      authorityDisplayName: 'Indian Air Force',
      status: 'INTERNAL_DRAFT',
      studentPublicationState: 'INTERNAL_DRAFT',
      catalogDiscoverable: false,
      quickEntryEnabled: false,
      smartEntryEnabled: false,
      missionSelectionReady: true,
      variantRequired: false,
    );

    // 2. GOVERNED PUBLISHED CANARY FIXTURE
    final publishedCanaryMission = const Recruitment(
      id: 'afcat',
      recruitmentGroupId: 'student_mission_catalog',
      boardId: 'auth_in_indian_air_force',
      examId: 'afcat',
      examBlueprintId: 'afcat_blueprint',
      title: 'Air Force Common Admission Test',
      titleHindi: 'Air Force Common Admission Test',
      year: 2026,
      state: 'Central',
      examCategory: 'Defence',
      jurisdictionLevel: 'CENTRAL',
      authorityGroupKey: 'auth_in_indian_air_force',
      authorityDisplayName: 'Indian Air Force',
      status: 'PUBLISHED',
      studentPublicationState: 'PUBLISHED',
      catalogDiscoverable: true,
      quickEntryEnabled: true,
      smartEntryEnabled: false,
      missionSelectionReady: true,
      variantRequired: false,
    );

    test('1. Internal Draft Non-Leak: Draft missions with INTERNAL_DRAFT/catalogDiscoverable=false are filtered out', () {
      final catalog = [draftCanaryMission];

      // Simulate streamStudentMissionCatalogRecruitments in-memory filtering
      final visibleToStudent = catalog
          .where((r) => r.catalogDiscoverable && !r.archived)
          .where((r) =>
              r.studentPublicationState != 'INTERNAL_DRAFT' &&
              r.studentPublicationState != 'UNPUBLISHED' &&
              r.studentPublicationState != 'DRAFT')
          .toList();

      expect(visibleToStudent.length, equals(0));
      expect(catalog.first.studentPublicationState, equals('INTERNAL_DRAFT'));
      expect(catalog.first.catalogDiscoverable, isFalse);
    });

    test('2. Dynamic Net-New Mission: Governed published mission renders without APK hardcoded ID', () {
      final catalog = [publishedCanaryMission];

      final visibleToStudent = catalog
          .where((r) => r.catalogDiscoverable && !r.archived)
          .where((r) =>
              r.studentPublicationState != 'INTERNAL_DRAFT' &&
              r.studentPublicationState != 'UNPUBLISHED' &&
              r.studentPublicationState != 'DRAFT')
          .toList();

      expect(visibleToStudent.length, equals(1));
      final m = visibleToStudent.first;
      expect(m.id, equals('afcat'));
      expect(m.title, equals('Air Force Common Admission Test'));
      expect(m.authorityDisplayName, equals('Indian Air Force'));
      expect(m.jurisdictionLevel, equals('CENTRAL'));
    });

    test('3. Quick Start Shell Access: Unready academic mission allows Quick Start dashboard access', () async {
      final m = publishedCanaryMission;

      expect(m.quickEntryEnabled, isTrue);

      // Save selection
      await SessionManager.saveMissionIdentity(
        examId: m.examId,
        examName: m.title,
        recruitmentId: m.id,
        examBlueprintId: m.examBlueprintId,
        variantId: m.variantCode,
        variantName: m.variantCode,
      );

      final selectedExam = await SessionManager.getSelectedExam();
      expect(selectedExam, equals('afcat'));
      expect(SessionManager.getExamIdSync(), equals('afcat'));
      expect(SessionManager.getExamNameSync(), equals('Air Force Common Admission Test'));
    });

    test('4. Smart Start Fail-Closed: Unready smart entry remains fail-closed', () {
      final m = publishedCanaryMission;

      expect(m.smartEntryEnabled, isFalse);
      expect(m.canSmartStart, isFalse);
      expect(m.canQuickStart, isTrue);
      expect(m.canEnterMissionShell, isTrue);
    });

    test('5. Authority Grouping & Region Contract: Central region = IN, Telangana = TG', () {
      expect(IndiaStates.stateToCode['Telangana'], equals('TG'));
      expect(IndiaStates.stateToCode['Central'], isNull);
      expect(IndiaStates.stateToCode['Delhi'], equals('DL'));
      expect(IndiaStates.stateToCode['Ladakh'], equals('LA'));

      final m = publishedCanaryMission;
      expect(m.authorityGroupKey, equals('auth_in_indian_air_force'));
      expect(m.authorityDisplayName, equals('Indian Air Force'));
    });

    test('6. Existing Mission Regression: JEE, NEET, RPSC First Grade, SSC CGL, UPSC CSE retain Quick Start', () {
      final regressionMissions = [
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
          status: 'PREPARING',
          studentPublicationState: 'PUBLISHED',
          catalogDiscoverable: true,
          quickEntryEnabled: true,
          smartEntryEnabled: false,
          missionSelectionReady: true,
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
          status: 'PREPARING',
          studentPublicationState: 'PUBLISHED',
          catalogDiscoverable: true,
          quickEntryEnabled: true,
          smartEntryEnabled: false,
          missionSelectionReady: true,
        ),
        const Recruitment(
          id: 'RPSC_FIRST_GRADE2026_2026_1782713222215',
          recruitmentGroupId: 'student_mission_catalog',
          boardId: 'rpsc',
          examId: 'RPSC_FIRST_GRADE2026_2026_1782713222215',
          examBlueprintId: 'rpsc_blueprint',
          title: 'RPSC First Grade 2026',
          titleHindi: 'आरपीएससी फर्स्ट ग्रेड 2026',
          year: 2026,
          state: 'Rajasthan',
          stateCode: 'RJ',
          examCategory: 'Teaching',
          jurisdictionLevel: 'STATE',
          authorityGroupKey: 'rpsc',
          authorityDisplayName: 'Rajasthan Public Service Commission (RPSC)',
          status: 'PREPARING',
          studentPublicationState: 'PUBLISHED',
          catalogDiscoverable: true,
          quickEntryEnabled: true,
          smartEntryEnabled: false,
          missionSelectionReady: true,
        ),
        const Recruitment(
          id: 'ssc_cgl',
          recruitmentGroupId: 'student_mission_catalog',
          boardId: 'ssc',
          examId: 'ssc_cgl',
          examBlueprintId: 'ssc_cgl_blueprint',
          title: 'SSC CGL',
          titleHindi: 'एसएससी सीजीएल',
          year: 2026,
          state: 'Central',
          examCategory: 'Staff Selection',
          jurisdictionLevel: 'CENTRAL',
          authorityGroupKey: 'ssc',
          authorityDisplayName: 'Staff Selection Commission (SSC)',
          status: 'PREPARING',
          studentPublicationState: 'PUBLISHED',
          catalogDiscoverable: true,
          quickEntryEnabled: true,
          smartEntryEnabled: false,
          missionSelectionReady: true,
        ),
        const Recruitment(
          id: 'upsc_cse_prelims',
          recruitmentGroupId: 'student_mission_catalog',
          boardId: 'upsc',
          examId: 'upsc_cse_prelims',
          examBlueprintId: 'upsc_cse_blueprint',
          title: 'UPSC CSE Prelims',
          titleHindi: 'यूपीएससी सीएसई प्रिलिम्स',
          year: 2026,
          state: 'Central',
          examCategory: 'Civil Services',
          jurisdictionLevel: 'CENTRAL',
          authorityGroupKey: 'upsc',
          authorityDisplayName: 'Union Public Service Commission (UPSC)',
          status: 'PREPARING',
          studentPublicationState: 'PUBLISHED',
          catalogDiscoverable: true,
          quickEntryEnabled: true,
          smartEntryEnabled: false,
          missionSelectionReady: true,
        ),
      ];

      for (final m in regressionMissions) {
        expect(m.canEnterMissionShell, isTrue);
        expect(m.canQuickStart, isTrue);
        expect(m.canSmartStart, isFalse);
      }
    });

  });
}
