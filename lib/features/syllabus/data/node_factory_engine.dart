import '../../../core/models/micro_topic_node.dart';

class NodeFactoryEngine {
  static List<MicroTopicNode> generate({
    required String examId,
    required List<Map<String, dynamic>> rawNodes,
  }) {
    return rawNodes.map((m) => MicroTopicNode.fromMap(m)).toList();
  }
}
