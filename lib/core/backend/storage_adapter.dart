import '../models/micro_topic_node.dart';

abstract class StorageAdapter {
  // 🔱 Decouples core logic from governed storage implementations.
  Future<void> saveNode(MicroTopicNode node);
  Future<List<MicroTopicNode>> fetchNodes();
  Stream<List<MicroTopicNode>> streamNodes();

  Future<void> updateProgress(
      {required String nodeId, required Map<String, dynamic> data});
  Future<void> saveProgress(String nodeId, Map<String, dynamic> data);
  Future<List<Map<String, dynamic>>> fetchProgress();
  Stream<List<Map<String, dynamic>>> progressStream();
}
