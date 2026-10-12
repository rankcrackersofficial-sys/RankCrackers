import '../../../core/models/micro_topic_node.dart';

/// Converts the activated mission-neutral syllabus projection into the
/// Student Panel's topic model without guessing exam, subject, or hierarchy IDs.
class StructuredSyllabusMapper {
  static List<MicroTopicNode> toStudentNodes({
    required String missionId,
    required List<Map<String, dynamic>> documents,
  }) {
    if (missionId.trim().isEmpty || documents.isEmpty) {
      return const <MicroTopicNode>[];
    }

    final byId = <String, Map<String, dynamic>>{};
    for (final document in documents) {
      final id = (document['id'] ?? document['nodeId'] ?? '').toString().trim();
      if (id.isNotEmpty) byId[id] = document;
    }

    final activeEpochs = byId.values
        .map((document) => document['activationEpoch'])
        .whereType<int>()
        .toList();
    if (activeEpochs.isEmpty) return const <MicroTopicNode>[];
    var activeEpoch = activeEpochs.first;
    for (final epoch in activeEpochs.skip(1)) {
      if (epoch > activeEpoch) activeEpoch = epoch;
    }

    final ordered = byId.values
        .where((document) => document['activationEpoch'] == activeEpoch)
        .toList()
      ..sort((a, b) => _sourceOrder(a).compareTo(_sourceOrder(b)));
    final output = <MicroTopicNode>[];

    for (final document in ordered) {
      if ((document['nodeType'] ?? '').toString().toLowerCase() != 'topic') {
        continue;
      }
      final id = (document['id'] ?? document['nodeId'] ?? '').toString().trim();
      final title =
          (document['canonicalTitle'] ?? document['title'] ?? '').toString().trim();
      final subjectId = (document['subjectId'] ?? '').toString().trim();
      if (id.isEmpty || title.isEmpty || subjectId.isEmpty) continue;

      final subject = byId[subjectId];
      final subjectTitle =
          (subject?['canonicalTitle'] ?? subject?['title'] ?? '').toString().trim();
      if (subjectTitle.isEmpty) continue;

      final ancestors = _ancestorChain(document, byId);
      final unit = ancestors.cast<Map<String, dynamic>>().firstWhere(
            (ancestor) {
              final type = (ancestor['nodeType'] ?? '').toString().toLowerCase();
              return type == 'unit' || type == 'group';
            },
            orElse: () => <String, dynamic>{},
          );
      final unitId = (unit['id'] ?? unit['nodeId'] ?? '').toString();
      final unitTitle =
          (unit['canonicalTitle'] ?? unit['title'] ?? '').toString().trim();

      output.add(
        MicroTopicNode(
          id: id,
          examId: missionId,
          paperId: (document['paperId'] ?? '').toString(),
          subjectId: subjectTitle,
          canonicalSubjectId: subjectId,
          unitId: unitId,
          chapterId: unitTitle.isEmpty ? 'General Unit' : unitTitle,
          topicId: id,
          title: title,
          titleHindi: '',
          subjectHindi: '',
          chapterHindi: '',
          description: '',
          contentRegistryId: '',
          difficulty: 0,
          importance: 0,
          status: 'published',
          canonicalKnowledgeNodeId: id,
        ),
      );
    }
    return output;
  }

  static int _sourceOrder(Map<String, dynamic> document) {
    final value = document['sourceOrder'];
    return value is int ? value : 0;
  }

  static List<Map<String, dynamic>> _ancestorChain(
    Map<String, dynamic> document,
    Map<String, Map<String, dynamic>> byId,
  ) {
    final ancestors = <Map<String, dynamic>>[];
    var parentId = (document['parentId'] ?? '').toString();
    final visited = <String>{};
    while (parentId.isNotEmpty && visited.add(parentId)) {
      final parent = byId[parentId];
      if (parent == null) break;
      ancestors.add(parent);
      parentId = (parent['parentId'] ?? '').toString();
    }
    return ancestors;
  }
}
