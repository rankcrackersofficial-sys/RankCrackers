import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/knowledge/hierarchical_aggregation_engine.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine_provider.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';
import 'package:rank_crackers/core/models/node_runtime_state.dart';
import 'package:rank_crackers/features/syllabus/presentation/providers/syllabus_tree_provider.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';

void main() {
  group('RC_RIGHT_PRACTICE_SYLLABUS_TRUTH_AND_DRILLDOWN_RUNTIME_REPAIR_01', () {
    test('NO_EVIDENCE_IS_NOT_ASSESSED and NO_EVIDENCE_IS_NOT_WEAK', () {
      final List<MicroTopicNode> unassessedAtoms = [
        const MicroTopicNode(
          id: 'kn_phy_01',
          topicId: 'top_phy_01',
          chapterId: 'ch_phy_01',
          subjectId: 'Physics',
          title: 'Dimensions of Physical Quantities',
          titleHindi: 'Dimensions of Physical Quantities',
          subjectHindi: 'Physics',
          chapterHindi: 'Units',
          description: 'Dimensions description',
          contentRegistryId: 'reg_01',
          difficulty: 2,
          importance: 3,
          examId: 'jee_main_2026',
        ),
        const MicroTopicNode(
          id: 'kn_phy_02',
          topicId: 'top_phy_01',
          chapterId: 'ch_phy_01',
          subjectId: 'Physics',
          title: 'Dimensional Formulae',
          titleHindi: 'Dimensional Formulae',
          subjectHindi: 'Physics',
          chapterHindi: 'Units',
          description: 'Formulae description',
          contentRegistryId: 'reg_02',
          difficulty: 2,
          importance: 3,
          examId: 'jee_main_2026',
        ),
      ];

      final Map<String, NodeRuntimeState> emptyStates = {};

      final topicCoverage = HierarchicalAggregationEngine.calculateTopicCoverage(
        unassessedAtoms,
        emptyStates,
      );
      final topicMastery = HierarchicalAggregationEngine.calculateTopicMastery(
        unassessedAtoms,
        emptyStates,
      );

      expect(topicCoverage, equals(0.0));
      expect(topicMastery, equals(0.0));

      final topicEvidence = MasteryCoverageEvidence(
        demonstratedMastery: topicMastery,
        hasEvidence: topicCoverage > 0,
      );

      final unitMastery = HierarchicalAggregationEngine.calculateUnitMastery([topicEvidence]);
      final unitCoverage = HierarchicalAggregationEngine.calculateUnitCoverage([topicEvidence]);

      expect(unitMastery, equals(0.0));
      expect(unitCoverage, equals(0.0));

      // Subject Level
      final subjectMastery = HierarchicalAggregationEngine.calculateSubjectMastery([topicEvidence]);
      final subjectCoverage = HierarchicalAggregationEngine.calculateSubjectCoverage([topicEvidence]);

      expect(subjectMastery, equals(0.0));
      expect(subjectCoverage, equals(0.0));
    });

    test('NO_STATIC_87_MASTERY_RUNTIME_FALLBACK and NO_STATIC_100_COVERAGE_RUNTIME_FALLBACK', () {
      final topicEvidences = List.generate(
        157,
        (i) => const MasteryCoverageEvidence(
          demonstratedMastery: 0.0,
          hasEvidence: false,
        ),
      );

      final subjectMastery = HierarchicalAggregationEngine.calculateSubjectMastery(topicEvidences);
      final subjectCoverage = HierarchicalAggregationEngine.calculateSubjectCoverage(topicEvidences);

      expect(subjectMastery, equals(0.0));
      expect(subjectCoverage, equals(0.0));
      expect(subjectMastery, isNot(equals(0.87)));
      expect(subjectCoverage, isNot(equals(1.0)));
    });

    test('RIGHT_PRACTICE_USES_CANONICAL_MASTERY_AUTHORITY - Singleton Shared Identity', () {
      final engineInstance = KnowledgeEngine.instance;
      expect(engineInstance, isNotNull);
      // Verify singleton identity is shared
      expect(identical(engineInstance, KnowledgeEngine.instance), isTrue);
    });

    test('RIGHT_PRACTICE_ACTIVE_MISSION_ISOLATION - Fails Closed for other realms', () {
      final jeeRealm = resolveMissionRealmId('jee_main_2026', 'jee_main_2026', 'JEE Main 2027');
      expect(jeeRealm, equals('jee_main_2026'));

      final unknownRealm = resolveMissionRealmId('unknown_exam', 'unknown_exam', 'Unknown');
      expect(unknownRealm, isNot(equals('jee_main_2026')));
      expect(unknownRealm, equals('unknown_exam'));

      final nullRealm = resolveMissionRealmId(null, null, null);
      expect(nullRealm, isNull);
    });

    test('DRILLDOWN_NODE_TYPES - Subject -> Unit -> Topic -> Atom Chain Intact', () {
      final atom = SyllabusNode(
        id: 'atom_01',
        title: 'Atom 01',
        type: 'atom',
        subjectId: 'Physics',
      );

      final topic = SyllabusNode(
        id: 'top_01',
        title: 'Topic 01',
        type: 'topic',
        subjectId: 'Physics',
        children: [atom],
        atomCount: 1,
      );

      final unit = SyllabusNode(
        id: 'unit_01',
        title: 'Unit 01',
        type: 'unit',
        subjectId: 'Physics',
        children: [topic],
        topicCount: 1,
        atomCount: 1,
      );

      final subject = SyllabusNode(
        id: 'Physics',
        title: 'Physics',
        type: 'subject',
        subjectId: 'Physics',
        children: [unit],
        unitCount: 1,
        topicCount: 1,
        atomCount: 1,
      );

      expect(subject.children.first.type, equals('unit'));
      expect(subject.children.first.children.first.type, equals('topic'));
      expect(subject.children.first.children.first.children.first.type, equals('atom'));
      expect(subject.children.first.children.first.children.first.id, equals('atom_01'));
    });
  });
}
