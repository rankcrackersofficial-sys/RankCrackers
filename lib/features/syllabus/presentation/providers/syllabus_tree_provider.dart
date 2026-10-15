import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/models/micro_topic_node.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';
import '../../../../core/language/language_controller.dart';

class SyllabusNode {
  final String id;
  final String title;
  final String type; // 'subject', 'unit', 'topic', 'atom'
  final String parentId;
  final String subjectId;
  final List<SyllabusNode> children;
  final int unitCount;
  final int topicCount;
  final int atomCount;
  final int masteredTopicCount;
  final int developingTopicCount;
  final int weakTopicCount;
  final int notAssessedTopicCount;
  final double averageMastery;
  final double averageCoverage;

  const SyllabusNode({
    required this.id,
    required this.title,
    required this.type,
    this.parentId = '',
    this.subjectId = '',
    this.children = const [],
    this.unitCount = 0,
    this.topicCount = 0,
    this.atomCount = 0,
    this.masteredTopicCount = 0,
    this.developingTopicCount = 0,
    this.weakTopicCount = 0,
    this.notAssessedTopicCount = 0,
    this.averageMastery = 0.0,
    this.averageCoverage = 0.0,
  });
}

final syllabusTreeProvider = Provider<List<SyllabusNode>>((ref) {
  final nodes = ref.watch(allNodesProvider);
  final engine = ref.watch(knowledgeEngineProvider);
  final language = ref.watch(languageControllerProvider);

  if (nodes.isEmpty) return const [];

  // Dynamically discover all unique subject names/IDs present in mission nodes
  final Set<String> discoveredSubjects = {};
  for (final node in nodes) {
    final sub = node.subject.isNotEmpty ? node.subject : node.subjectId;
    if (sub.trim().isNotEmpty) {
      discoveredSubjects.add(sub.trim());
    }
  }

  final List<String> activeSubjectIds = discoveredSubjects.isNotEmpty
      ? discoveredSubjects.toList()
      : const ['Physics', 'Chemistry', 'Mathematics'];
  final List<SyllabusNode> tree = [];

  for (final sId in activeSubjectIds) {
    final subjectNodes = nodes.where((n) =>
        n.subject.toLowerCase() == sId.toLowerCase() ||
        n.subjectId.toLowerCase() == sId.toLowerCase()).toList();

    if (subjectNodes.isEmpty) continue;

    // Group into Units (Chapters)
    final Map<String, List<MicroTopicNode>> chapterMap = {};
    for (final node in subjectNodes) {
      final ch = node.chapter.isNotEmpty ? node.chapter : (node.chapterHindi.isNotEmpty ? node.chapterHindi : 'General Unit');
      chapterMap.putIfAbsent(ch, () => []).add(node);
    }

    final List<SyllabusNode> unitNodes = [];
    chapterMap.forEach((chapterName, chNodes) {
      final List<SyllabusNode> topicNodes = chNodes.map((n) {
        final state = engine.getState(n.id);
        final mastery = state?.mastery ?? 0.0;
        final coverage = (state?.completed ?? false) ? 1.0 : (state?.readingEvidence ?? 0.0) > 0 ? 0.5 : 0.0;

        int mastered = 0;
        int developing = 0;
        int weak = 0;
        int notAssessed = 0;

        if (coverage <= 0) {
          notAssessed = 1;
        } else if (mastery >= 0.85) {
          mastered = 1;
        } else if (mastery >= 0.50) {
          developing = 1;
        } else {
          weak = 1;
        }

        return SyllabusNode(
          id: n.id,
          title: language.isHindi && n.titleHindi.trim().isNotEmpty
              ? n.titleHindi
              : (n.title.isNotEmpty ? n.title : n.topic),
          type: 'topic',
          parentId: chapterName,
          subjectId: sId,
          atomCount: 1,
          averageMastery: mastery,
          averageCoverage: coverage,
          masteredTopicCount: mastered,
          developingTopicCount: developing,
          weakTopicCount: weak,
          notAssessedTopicCount: notAssessed,
        );
      }).toList();

      final unitMastery = topicNodes.isEmpty
          ? 0.0
          : topicNodes.fold(0.0, (sum, t) => sum + t.averageMastery) / topicNodes.length;
      final unitCoverage = topicNodes.isEmpty
          ? 0.0
          : topicNodes.fold(0.0, (sum, t) => sum + t.averageCoverage) / topicNodes.length;

      unitNodes.add(SyllabusNode(
        id: '${sId}_$chapterName',
        title: language.isHindi && chNodes.first.chapterHindi.trim().isNotEmpty
            ? chNodes.first.chapterHindi
            : chapterName,
        type: 'unit',
        parentId: sId,
        subjectId: sId,
        children: topicNodes,
        topicCount: topicNodes.length,
        atomCount: topicNodes.length,
        masteredTopicCount: topicNodes.fold(0, (sum, t) => sum + t.masteredTopicCount),
        developingTopicCount: topicNodes.fold(0, (sum, t) => sum + t.developingTopicCount),
        weakTopicCount: topicNodes.fold(0, (sum, t) => sum + t.weakTopicCount),
        notAssessedTopicCount: topicNodes.fold(0, (sum, t) => sum + t.notAssessedTopicCount),
        averageMastery: unitMastery,
        averageCoverage: unitCoverage,
      ));
    });

    final subjectMastery = unitNodes.isEmpty
        ? 0.0
        : unitNodes.fold(0.0, (sum, u) => sum + u.averageMastery) / unitNodes.length;
    final subjectCoverage = unitNodes.isEmpty
        ? 0.0
        : unitNodes.fold(0.0, (sum, u) => sum + u.averageCoverage) / unitNodes.length;

    tree.add(SyllabusNode(
      id: sId,
      title: language.isHindi && subjectNodes.first.subjectHindi.trim().isNotEmpty
          ? subjectNodes.first.subjectHindi
          : sId,
      type: 'subject',
      subjectId: sId,
      children: unitNodes,
      unitCount: unitNodes.length,
      topicCount: unitNodes.fold(0, (sum, u) => sum + u.topicCount),
      atomCount: unitNodes.fold(0, (sum, u) => sum + u.atomCount),
      masteredTopicCount: unitNodes.fold(0, (sum, u) => sum + u.masteredTopicCount),
      developingTopicCount: unitNodes.fold(0, (sum, u) => sum + u.developingTopicCount),
      weakTopicCount: unitNodes.fold(0, (sum, u) => sum + u.weakTopicCount),
      notAssessedTopicCount: unitNodes.fold(0, (sum, u) => sum + u.notAssessedTopicCount),
      averageMastery: subjectMastery,
      averageCoverage: subjectCoverage,
    ));
  }

  return tree;
});

final structuredNodesProvider = StreamProvider<dynamic>((ref) {
  return Stream.value(ref.watch(allNodesProvider));
});

String? resolveMissionRealmId(String? examId, String? recruitmentId, String? examName) {
  if (examId == null && recruitmentId == null && examName == null) return null;
  final raw = (examId ?? recruitmentId ?? examName ?? '').trim();
  if (raw.isEmpty) return null;
  if (raw.toLowerCase() == 'jee_main_2027') return 'jee_main_2026';
  return raw;
}
