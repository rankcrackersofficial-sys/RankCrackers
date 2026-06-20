import '../../../../core/firebase/firestore_service.dart';

import '../../../../core/models/micro_topic_node.dart';

class KnowledgeRepository {

  static List<MicroTopicNode>
  nodes = [];

  // ===================================================
  // LOAD CLOUD NODES
  // ===================================================

  static Future<void>
  loadNodes() async {

    nodes =

    await FirestoreService
        .fetchNodes();
  }
}