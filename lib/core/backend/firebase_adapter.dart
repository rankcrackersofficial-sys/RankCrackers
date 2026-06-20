import 'package:firebase_auth/firebase_auth.dart';

import '../models/micro_topic_node.dart';
import 'storage_adapter.dart';
import '../firebase/firestore_service.dart';

class FirebaseAdapter implements StorageAdapter {
  @override
  Future<void> saveNode(
      MicroTopicNode node,
      ) async {
    await FirestoreService.uploadNode(node);
  }

  @override
  Future<List<MicroTopicNode>> fetchNodes() async {
    return FirestoreService.fetchNodes();
  }

  @override
  Stream<List<MicroTopicNode>> streamNodes() {
    return FirestoreService.streamNodes();
  }

  @override
  Future<void> updateProgress({
    required String nodeId,
    required Map<String, dynamic> data,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    await FirestoreService.saveProgress(
      uid: user.uid,
      nodeId: nodeId,
      data: data,
    );
  }

  @override
  Future<void> saveProgress(String nodeId, Map<String, dynamic> data) async {
    await updateProgress(nodeId: nodeId, data: data);
  }

  @override
  Future<List<Map<String, dynamic>>> fetchProgress() async {
    final user =
        FirebaseAuth.instance.currentUser;

    if (user == null) {
      return [];
    }

    return FirestoreService.loadProgress(
      user.uid,
    );
  }

  @override
  Stream<List<Map<String, dynamic>>> progressStream() {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return Stream.value([]);
    }

    return FirestoreService.streamProgress(user.uid);
  }
}
