import '../../../core/firebase/firestore_service.dart';

import 'repositories/knowledge_repository.dart';

class FirebaseNodeSync {

  // ===================================================
  // UPLOAD ALL NODES
  // ===================================================

  static Future<void>
  uploadAllNodes() async {

    final existing =

    await FirestoreService
        .fetchNodes();

    if (existing.isNotEmpty) {
      return;
    }

    for (final node
    in KnowledgeRepository.nodes) {

      await FirestoreService
          .uploadNode(node);
    }
  }
}