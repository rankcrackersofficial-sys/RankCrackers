import '../models/micro_topic_node.dart';

class OfflineCache {
  // 🔱 Manages local caching for offline-first architecture
  static Future<void> cacheNodes(List<MicroTopicNode> nodes) async {
    // Logic to store nodes in local DB (e.g., Isar)
  }

  static Future<List<MicroTopicNode>> getCachedNodes() async {
    return [];
  }
}
