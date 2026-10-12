import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine_provider.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';

void main() {
  final cachedJeeNode = MicroTopicNode(
    id: 'jee-node',
    examId: 'jee_main_2026',
    subjectId: 'Physics',
    chapterId: 'Mechanics',
    title: 'Motion',
    titleHindi: 'गति',
    subjectHindi: 'भौतिकी',
    chapterHindi: 'यांत्रिकी',
    description: '',
    contentRegistryId: 'registry',
    difficulty: 1,
    importance: 1,
  );

  test('cached syllabus is hidden while selected mission differs from engine graph', () {
    expect(
      missionScopedCachedNodes(
        selectedExamId: 'neet_ug_2027',
        engineExamId: 'jee_main_2026',
        cachedNodes: [cachedJeeNode],
      ),
      isEmpty,
    );
  });

  test('cached syllabus is usable only for its selected mission', () {
    expect(
      missionScopedCachedNodes(
        selectedExamId: 'jee_main_2026',
        engineExamId: 'jee_main_2026',
        cachedNodes: [cachedJeeNode],
      ).map((node) => node.examId),
      ['jee_main_2026'],
    );
  });

  test('an unbound session cannot use a cached mission graph', () {
    expect(
      missionScopedCachedNodes(
        selectedExamId: '',
        engineExamId: 'jee_main_2026',
        cachedNodes: [cachedJeeNode],
      ),
      isEmpty,
    );
  });
}
