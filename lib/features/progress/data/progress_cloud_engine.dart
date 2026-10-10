import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/firebase/firestore_service.dart';
import '../../../core/engines/write_buffer_engine.dart';
import './models/user_progress.dart';

/// PROGRESS CLOUD ENGINE
/// Sovereign authority for persisting preparation data to the cloud.
class ProgressCloudEngine {
  // ===================================================
  // SAVE MASTERY 
  // ===================================================
  static Future<void> saveMastery({
    required String nodeId,
    required double mastery,
    String? factId,
    UserProgress? existingProgress, // Required for buffering complete state
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    // Update Local State
    final updated = (existingProgress ?? UserProgress.empty(nodeId)).copyWith(
      mastery: mastery,
      lastReviewed: DateTime.now(),
      // Add more updates as needed for battles won/lost
    );

    // Priority C: Local Write Buffer (Document 50 Component)
    await WriteBufferEngine.instance.bufferUpdate(updated);
  }

  /// LEGACY DIRECT SAVE (Emergency use only)
  static Future<void> directSave(String nodeId, Map<String, dynamic> data) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    await FirestoreService.saveProgress(uid: user.uid, nodeId: nodeId, data: data);
  }
}
