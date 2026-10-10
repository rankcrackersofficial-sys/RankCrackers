import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';
import 'package:rank_crackers/core/models/recruitment.dart';

void main() {
  group('DigiBook READY Gate Fail-Closed Governance Matrix Tests', () {
    final engine = KnowledgeEngine.instance;

    final jeeRecruitment = Recruitment(
      id: 'jee_main_2027',
      recruitmentGroupId: 'r_group',
      boardId: 'b_jee',
      examId: 'jee_main_2027',
      examBlueprintId: 'bp_jee',
      title: 'JEE Main 2027',
      titleHindi: 'JEE Main 2027',
      year: 2027,
      state: 'Central',
      examCategory: 'engineering',
      status: 'published',
      examDifficulty: 0.6,
      variantCode: 'jee_2027',
      missionVariables: const {},
      version: '1.0.0',
    );

    MicroTopicNode createTestNode({
      String id = 'node_01',
      String examId = 'jee_main_2027',
      String status = 'published',
      bool studentVisibilityAuthorized = true,
      bool isSynthetic = false,
      bool isStructuralHold = false,
      bool isStale = false,
      bool sourceApproved = true,
      String verificationStatus = 'VERIFIED',
      String? canonicalAtomId = 'atom_jee_2027_001',
      String? canonicalMissionId = 'jee_main_2027',
      String? approvedSourceId = 'src_ncert_01',
      String? verificationId = 'ver_991',
      String contentRegistryId = 'payload_01',
      String description = 'Verified governed content',
    }) {
      return MicroTopicNode(
        id: id,
        examId: examId,
        subjectId: 'Physics',
        chapterId: 'Chapter 1',
        title: 'Governed Topic',
        titleHindi: 'विषय',
        subjectHindi: 'भौतिकी',
        chapterHindi: 'अध्याय 1',
        description: description,
        contentRegistryId: contentRegistryId,
        difficulty: 2,
        importance: 3,
        status: status,
        studentVisibilityAuthorized: studentVisibilityAuthorized,
        isSynthetic: isSynthetic,
        isStructuralHold: isStructuralHold,
        isStale: isStale,
        sourceApproved: sourceApproved,
        verificationStatus: verificationStatus,
        canonicalAtomId: canonicalAtomId,
        canonicalMissionId: canonicalMissionId,
        approvedSourceId: approvedSourceId,
        verificationId: verificationId,
      );
    }

    tearDown(() async {
      await engine.clearSessionState();
    });

    test('1. Empty graph returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('2. Synthetic FF01 node returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(
        isSynthetic: true,
        description: 'Materialized via RELIABILITY FF01 progressive publication.',
      );
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('3. Structural HOLD node returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(isStructuralHold: true);
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('4. Draft status node returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(status: 'draft');
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('5. studentVisibilityAuthorized = false returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(studentVisibilityAuthorized: false);
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('6. sourceApproved = false returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(sourceApproved: false);
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('7. verificationStatus != VERIFIED returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(verificationStatus: 'UNVERIFIED');
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('8. Missing canonicalAtomId returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(canonicalAtomId: null);
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('9. Missing approvedSourceId returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(approvedSourceId: '');
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('10. Missing verificationId returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(verificationId: null);
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('11. Stale node returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(isStale: true);
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('12. Mission mismatch returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final node = createTestNode(examId: 'jee_main_2026', canonicalMissionId: 'jee_main_2026');
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [node], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('13. FULL GOVERNED TEST FIXTURE returns READY', () async {
      final governedNode = createTestNode();
      await engine.loadStressData(recruitment: jeeRecruitment, nodes: [governedNode], progress: const []);
      expect(engine.getDigiBookPublicationState(), equals(PublicationState.READY));
    });
  });
}
