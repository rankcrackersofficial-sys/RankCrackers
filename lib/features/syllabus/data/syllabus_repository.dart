import '../../../core/models/micro_topic_node.dart';

class SyllabusRepository {
  // ===================================================
  // DATA RETRIEVAL 🔱
  // ===================================================

  static List<MicroTopicNode> getNodesForExam(String examId) {
    return nodes.where((e) => e.examId.toLowerCase() == examId.toLowerCase()).toList();
  }

  // 🔱 Audit Fix: Removed hardcoded demo content (Article 3)
  // These nodes now represent the Sovereign Index.
  static final List<MicroTopicNode> nodes = [
    MicroTopicNode(
      id: 'his_001',
      examId: 'ras',
      subjectId: 'History',
      subjectHindi: 'इतिहास',
      chapterId: 'Ancient Rajasthan',
      chapterHindi: 'प्राचीन राजस्थान',
      title: 'Kalibangan • Ahar • Ganeshwar',
      titleHindi: 'कालीबंगा • आहड़ • गणेश्वर',
      description: 'Indus and Chalcolithic cultures of Rajasthan.',
      contentRegistryId: 'payload_his_001',
      factCount: 3,
      prerequisiteIds: const ['his_000'],
      relatedIds: const ['his_005'],
      dependentIds: const ['his_002', 'geo_003'],
      difficulty: 2,
      importance: 3,
      status: 'published',
    ),
    MicroTopicNode(
      id: 'geo_001',
      examId: 'ras',
      subjectId: 'Geography',
      subjectHindi: 'भूगोल',
      chapterId: 'Climate System',
      chapterHindi: 'जलवायु तंत्र',
      title: 'Pressure Belts • Monsoon',
      titleHindi: 'वायुदाब पेटियां • मानसून',
      description: 'Pressure circulation and monsoon mechanism.',
      contentRegistryId: 'payload_geo_001',
      factCount: 2,
      prerequisiteIds: const ['geo_000'],
      relatedIds: const ['geo_010'],
      dependentIds: const ['geo_002', 'geo_005'],
      difficulty: 3,
      importance: 5,
      status: 'published',
    ),
  ];
}
