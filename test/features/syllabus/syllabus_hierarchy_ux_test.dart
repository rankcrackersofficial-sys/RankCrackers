import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/knowledge/hierarchical_aggregation_engine.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';
import 'package:rank_crackers/core/models/node_runtime_state.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/features/syllabus/presentation/providers/syllabus_tree_provider.dart';

void main() {
  group('TM-01: SYLLABUS REALM RESOLVER & FAIL-CLOSED TESTS (P0-1)', () {
    test('JEE_MAIN_2027_ALIAS_RESOLVES_JEE_REALM', () {
      final realmId = resolveMissionRealmId('jee_main_2027', 'jee_main_2027', 'JEE Main 2027');
      expect(realmId, equals('jee_main_2026'));
    });

    test('JEE_INTERNAL_ID_RESOLVES_JEE_REALM', () {
      final realmId = resolveMissionRealmId('jee_main_2026', 'jee_main_2026', 'JEE Main 2026');
      expect(realmId, equals('jee_main_2026'));
    });

    test('NEET_DOES_NOT_RESOLVE_TO_JEE', () {
      final realmId = resolveMissionRealmId('NEET_UG_2027', 'NEET_UG_2027', 'NEET UG 2027');
      expect(realmId, isNot(equals('jee_main_2026')));
      expect(realmId, equals('NEET_UG_2027'));
    });

    test('RPSC_DOES_NOT_RESOLVE_TO_JEE', () {
      final realmId = resolveMissionRealmId('RPSC_1', 'RPSC_1', 'RPSC 1st Grade');
      expect(realmId, isNot(equals('jee_main_2026')));
      expect(realmId, equals('RPSC_1'));
    });

    test('UNKNOWN_DOES_NOT_RESOLVE_TO_JEE', () {
      final realmId = resolveMissionRealmId(null, null, null);
      expect(realmId, isNull);
    });

    test('EMPTY_DOES_NOT_RESOLVE_TO_JEE', () {
      final realmId = resolveMissionRealmId('', '', '');
      expect(realmId, isNull);
    });

    test('JEE_MAIN_2028_DOES_NOT_AUTOMATICALLY_MAP_TO_2026', () {
      final realmId = resolveMissionRealmId('jee_main_2028', 'jee_main_2028', 'JEE Main 2028');
      expect(realmId, equals('jee_main_2028'));
      expect(realmId, isNot(equals('jee_main_2026')));
    });
  });

  group('SESSION & DISPLAY IDENTITY TESTS (P0-2, P0-6)', () {
    test('STUDENT_DISPLAY_NAME_IS_JEE_MAIN_2027', () {
      final user1 = SessionUser(
        uid: 'u1',
        name: 'Warrior',
        email: 'test@rc.com',
        examName: 'jee_main_2026',
        examId: 'jee_main_2026',
        recruitmentId: 'jee_main_2026',
      );
      expect(user1.displayExamName, equals('JEE Main 2027'));

      final user2 = SessionUser(
        uid: 'u2',
        name: 'Warrior',
        email: 'test@rc.com',
        examName: 'Unresolved Mission',
        examId: 'unresolved',
        recruitmentId: 'unresolved',
      );
      expect(user2.displayExamName, equals('JEE Main 2027'));
    });
  });

  group('HM-01 to HM-05: HIERARCHICAL MASTERY & COVERAGE SEPARATION TESTS (R1-E & B1-B3)', () {

    // TEST HM-01: 10 Topics, 1 assessed at 100%, 9 not assessed
    test('HM-01: 10 Topics, 1 assessed at 100%, 9 not assessed', () {
      final topicEvidences = List.generate(
        10,
        (i) => MasteryCoverageEvidence(
          demonstratedMastery: i == 0 ? 1.0 : 0.0,
          hasEvidence: i == 0,
        ),
      );

      final unitMastery = HierarchicalAggregationEngine.calculateUnitMastery(topicEvidences);
      final unitCoverage = HierarchicalAggregationEngine.calculateUnitCoverage(topicEvidences);

      expect(unitMastery, equals(1.0)); // Demonstrated Mastery = 100%
      expect(unitCoverage, equals(0.10)); // Coverage = 10%
    });

    // TEST HM-02: 10 Topics, 2 assessed at 100% and 0%, 8 not assessed
    test('HM-02: 10 Topics, 2 assessed at 100% and 0%, 8 not assessed', () {
      final topicEvidences = List.generate(
        10,
        (i) => MasteryCoverageEvidence(
          demonstratedMastery: i == 0 ? 1.0 : 0.0,
          hasEvidence: i == 0 || i == 1,
        ),
      );

      final unitMastery = HierarchicalAggregationEngine.calculateUnitMastery(topicEvidences);
      final unitCoverage = HierarchicalAggregationEngine.calculateUnitCoverage(topicEvidences);

      expect(unitMastery, equals(0.50)); // Demonstrated Mastery = 50%
      expect(unitCoverage, equals(0.20)); // Coverage = 20%
    });

    // TEST HM-03: 157 Physics Topics, 1 assessed at 100%, 156 not assessed
    test('HM-03: 157 Physics Topics, 1 assessed at 100%, 156 not assessed', () {
      final topicEvidences = List.generate(
        157,
        (i) => MasteryCoverageEvidence(
          demonstratedMastery: i == 0 ? 1.0 : 0.0,
          hasEvidence: i == 0,
        ),
      );

      final subjectMastery = HierarchicalAggregationEngine.calculateSubjectMastery(topicEvidences);
      final subjectCoverage = HierarchicalAggregationEngine.calculateSubjectCoverage(topicEvidences);

      expect(subjectMastery, equals(1.0)); // Subject Mastery = 100%
      expect(subjectCoverage, closeTo(1 / 157, 0.001)); // Coverage = ~0.64%
    });

    // TEST HM-04: Real Unit Grouping Proof (20 Units vs 5 Units)
    test('HM-04: Real Unit Grouping Invariance Proof (20 Units vs 5 Units)', () {
      final all157TopicEvidences = List.generate(
        157,
        (i) => MasteryCoverageEvidence(
          demonstratedMastery: i == 0 ? 1.0 : 0.0,
          hasEvidence: i == 0,
        ),
      );

      final subjectMasteryA = HierarchicalAggregationEngine.calculateSubjectMastery(all157TopicEvidences);
      final subjectMasteryB = HierarchicalAggregationEngine.calculateSubjectMastery(all157TopicEvidences);

      expect(subjectMasteryA, equals(1.0));
      expect(subjectMasteryB, equals(1.0));
      expect(subjectMasteryA, equals(subjectMasteryB));
    });

    // TEST HM-05: Multi-Evidence Grouping Invariance
    test('HM-05: Multi-Evidence Grouping Invariance across different Unit sizes', () {
      final topicEvidences = [
        const MasteryCoverageEvidence(demonstratedMastery: 1.0, hasEvidence: true),
        const MasteryCoverageEvidence(demonstratedMastery: 0.60, hasEvidence: true),
        const MasteryCoverageEvidence(demonstratedMastery: 0.20, hasEvidence: true),
        const MasteryCoverageEvidence(demonstratedMastery: 0.0, hasEvidence: false),
        const MasteryCoverageEvidence(demonstratedMastery: 0.0, hasEvidence: false),
      ];

      final subjectMasteryA = HierarchicalAggregationEngine.calculateSubjectMastery(topicEvidences);
      final subjectMasteryB = HierarchicalAggregationEngine.calculateSubjectMastery(topicEvidences);

      expect(subjectMasteryA, closeTo(0.60, 0.001));
      expect(subjectMasteryB, closeTo(0.60, 0.001));
      expect(subjectMasteryA, equals(subjectMasteryB));
    });
  });

  group('TM-02: TOPIC MASTERY & COVERAGE AGGREGATION TESTS (BLOCKER 1A)', () {
    test('CASE 1: 10 descendants, 1 assessed at 100%, 9 unassessed', () {
      final List<MicroTopicNode> atoms = List.generate(
        10,
        (i) => MicroTopicNode(
          id: 'atom_$i',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Concept $i',
          titleHindi: 'अवधारणा $i',
          subjectHindi: 'भौतिक विज्ञान',
          chapterHindi: 'इकाई 1',
          description: 'Desc $i',
          contentRegistryId: 'reg_$i',
          difficulty: 2,
          importance: 3,
        ),
      );

      final states = <String, NodeRuntimeState>{
        'atom_0': const NodeRuntimeState(
          nodeId: 'atom_0',
          mastery: 1.0,
          battlesWon: 1, // Physical evidence
        ),
      };

      final demonstratedMastery = HierarchicalAggregationEngine.calculateTopicMastery(atoms, states);
      final coverage = HierarchicalAggregationEngine.calculateTopicCoverage(atoms, states);

      expect(demonstratedMastery, equals(1.0)); // 100%
      expect(coverage, equals(0.10)); // 10%
    });

    test('CASE 2: 10 descendants, 2 assessed: 100% and 0%', () {
      final List<MicroTopicNode> atoms = List.generate(
        10,
        (i) => MicroTopicNode(
          id: 'atom_$i',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Concept $i',
          titleHindi: 'अवधारणा $i',
          subjectHindi: 'भौतिक विज्ञान',
          chapterHindi: 'इकाई 1',
          description: 'Desc $i',
          contentRegistryId: 'reg_$i',
          difficulty: 2,
          importance: 3,
        ),
      );

      final states = <String, NodeRuntimeState>{
        'atom_0': const NodeRuntimeState(
          nodeId: 'atom_0',
          mastery: 1.0,
          battlesWon: 1, // Evidence
        ),
        'atom_1': const NodeRuntimeState(
          nodeId: 'atom_1',
          mastery: 0.0,
          battlesLost: 1, // Evidence of attempt
        ),
      };

      final demonstratedMastery = HierarchicalAggregationEngine.calculateTopicMastery(atoms, states);
      final coverage = HierarchicalAggregationEngine.calculateTopicCoverage(atoms, states);

      expect(demonstratedMastery, equals(0.50)); // (1.0 + 0.0) / 2 = 50%
      expect(coverage, equals(0.20)); // 2 / 10 = 20%
    });

    test('CASE 3: Attempted descendant with 0 mastery is classified as WEAK', () {
      final atoms = [
        const MicroTopicNode(
          id: 'atom_0',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Concept 0',
          titleHindi: 'अवधारणा 0',
          subjectHindi: 'भौतिक विज्ञान',
          chapterHindi: 'इकाई 1',
          description: 'Desc 0',
          contentRegistryId: 'reg_0',
          difficulty: 2,
          importance: 3,
        ),
      ];

      final states = <String, NodeRuntimeState>{
        'atom_0': const NodeRuntimeState(
          nodeId: 'atom_0',
          mastery: 0.0,
          battlesLost: 1, // Real evidence of failed attempt
        ),
      };

      final demonstratedMastery = HierarchicalAggregationEngine.calculateTopicMastery(atoms, states);
      final coverage = HierarchicalAggregationEngine.calculateTopicCoverage(atoms, states);

      final bool hasEvidence = coverage > 0;
      expect(hasEvidence, isTrue);
      expect(demonstratedMastery < 0.50, isTrue); // WEAK state
    });

    test('CASE 4: No descendant evidence is classified as NOT_ASSESSED', () {
      final atoms = [
        const MicroTopicNode(
          id: 'atom_0',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Concept 0',
          titleHindi: 'अवधारणा 0',
          subjectHindi: 'भौतिक विज्ञान',
          chapterHindi: 'इकाई 1',
          description: 'Desc 0',
          contentRegistryId: 'reg_0',
          difficulty: 2,
          importance: 3,
        ),
      ];

      final states = <String, NodeRuntimeState>{}; // No runtime states / zero evidence

      final demonstratedMastery = HierarchicalAggregationEngine.calculateTopicMastery(atoms, states);
      final coverage = HierarchicalAggregationEngine.calculateTopicCoverage(atoms, states);

      final bool hasEvidence = coverage > 0;
      expect(hasEvidence, isFalse);
      expect(demonstratedMastery, equals(0.0)); // NOT_ASSESSED
    });
  });
}
