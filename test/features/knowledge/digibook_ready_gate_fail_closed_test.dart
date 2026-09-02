import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';
import 'package:rank_crackers/core/models/recruitment.dart';

void main() {
  group('DigiBook READY Gate Fail-Closed Tests', () {
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

    tearDown(() async {
      await engine.clearSessionState();
    });

    test('1. Synthetic-only graph returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final syntheticNode = MicroTopicNode(
        id: 'node_synth_01',
        examId: 'jee_main_2027',
        subjectId: 'Physics',
        chapterId: 'Chapter 1',
        title: 'Synthetic Topic',
        titleHindi: 'सिंथेटिक विषय',
        subjectHindi: 'भौतिकी',
        chapterHindi: 'अध्याय 1',
        description: 'Materialized via RELIABILITY FF01 progressive publication.',
        contentRegistryId: 'payload_01',
        difficulty: 2,
        importance: 3,
        status: 'published',
      );

      await engine.loadStressData(
        recruitment: jeeRecruitment,
        nodes: [syntheticNode],
        progress: const [],
      );

      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('2. Structural/hold-only graph returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final structuralNode = MicroTopicNode(
        id: 'node_struct_01',
        examId: 'jee_main_2027',
        subjectId: 'Physics',
        chapterId: 'Chapter 1',
        title: 'Draft Structural Node',
        titleHindi: 'ड्राफ्ट विषय',
        subjectHindi: 'भौतिकी',
        chapterHindi: 'अध्याय 1',
        description: 'Structural node placeholder',
        contentRegistryId: 'payload_02',
        difficulty: 2,
        importance: 3,
        status: 'draft',
      );

      await engine.loadStressData(
        recruitment: jeeRecruitment,
        nodes: [structuralNode],
        progress: const [],
      );

      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('3. Mission mismatch / cross-mission node returns MISSION_CONTENT_NOT_PUBLISHED (NOT READY)', () async {
      final crossMissionNode = MicroTopicNode(
        id: 'node_jee2026_01',
        examId: 'jee_main_2026', // Mismatch vs active jee_main_2027
        subjectId: 'Physics',
        chapterId: 'Chapter 1',
        title: 'JEE 2026 Node',
        titleHindi: 'JEE 2026 विषय',
        subjectHindi: 'भौतिकी',
        chapterHindi: 'अध्याय 1',
        description: 'Governed node for 2026',
        contentRegistryId: 'payload_03',
        difficulty: 2,
        importance: 3,
        status: 'published',
      );

      await engine.loadStressData(
        recruitment: jeeRecruitment, // active is jee_main_2027
        nodes: [crossMissionNode],
        progress: const [],
      );

      expect(engine.getDigiBookPublicationState(), equals(PublicationState.MISSION_CONTENT_NOT_PUBLISHED));
    });

    test('4. Governed published node matching exact mission returns READY', () async {
      final governedNode = MicroTopicNode(
        id: 'node_governed_01',
        examId: 'jee_main_2027',
        subjectId: 'Physics',
        chapterId: 'Chapter 1',
        title: 'Real Governed Topic',
        titleHindi: 'वास्तविक विषय',
        subjectHindi: 'भौतिकी',
        chapterHindi: 'अध्याय 1',
        description: 'Verified governed content',
        contentRegistryId: 'payload_gov_01',
        difficulty: 2,
        importance: 3,
        status: 'published',
      );

      await engine.loadStressData(
        recruitment: jeeRecruitment,
        nodes: [governedNode],
        progress: const [],
      );

      expect(engine.getDigiBookPublicationState(), equals(PublicationState.READY));
    });
  });
}
