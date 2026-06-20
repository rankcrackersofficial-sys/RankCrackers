import '../models/syllabus_chunk.dart';
import '../../../core/models/micro_topic_node.dart';

class NodeFactoryWorker {
  // ===================================================
  // CREATE NODES 🔱
  // ===================================================
  static List<MicroTopicNode> generate({
    required String exam,
    required List<SyllabusChunk> chunks,
  }) {
    final List<MicroTopicNode> nodes = [];

    for (final chunk in chunks) {
      for (final topic in chunk.microTopics) {
        final id = topic.replaceAll(' ', '_').toUpperCase();

        nodes.add(
          MicroTopicNode(
            id: id,
            examId: exam,
            subjectId: chunk.subject,
            chapterId: chunk.chapter,
            title: topic,
            titleHindi: topic,
            subjectHindi: chunk.subject,
            chapterHindi: chunk.chapter,
            description: '',
            contentRegistryId: 'payload_$id', // 🔱 Sovereign decoupling pointer
            difficulty: 2,
            importance: 3,
            status: 'draft',
          ),
        );
      }
    }

    return nodes;
  }
}
