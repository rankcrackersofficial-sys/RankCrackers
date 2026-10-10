import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/sentinel_draft.dart';
import '../firebase/firestore_service.dart';

/// SENTINEL REPOSITORY (Document 50)
/// Sovereign authority for managing the Isolation Zone.
/// Enforces Draft -> Production separation.
class SentinelRepository {
  
  /// Injects raw intelligence into the Draft Zone.
  /// Strictly prohibited from writing to production collections.
  static Future<void> injectDrafts(List<SentinelDraft> drafts) async {
    final List<Map<String, dynamic>> maps = drafts.map((d) => d.toMap()).toList();
    await FirestoreService.uploadBatch(FirestoreService.sentinelDraftCollection, maps);
  }

  /// Streams the list of pending drafts for validation and approval.
  /// Hardened: server-side filtering and ordering for scalability.
  static Stream<List<SentinelDraft>> streamPending() {
    return FirebaseFirestore.instance
        .collection(FirestoreService.sentinelDraftCollection)
        .where('status', whereIn: ['draft', 'under_review'])
        .orderBy('audit.processedAt', descending: true)
        .limit(50) // Hyperscale Protection
        .snapshots()
        .map((snap) => snap.docs.map((doc) => SentinelDraft.fromMap(doc.data())).toList());
  }

  /// Updates the status of a draft.
  static Future<void> updateStatus(String draftId, String status) async {
    await FirebaseFirestore.instance
        .collection(FirestoreService.sentinelDraftCollection)
        .doc(draftId)
        .update({
      'status': status,
      'audit.lastSeenAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  /// SCOUT DOWNLOAD REGISTRY
  /// Reads from the automated scout discovery collection.
  static Stream<List<SentinelDraft>> streamScoutDownloads() {
    return FirebaseFirestore.instance
        .collection('scout_downloads')
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => SentinelDraft.fromMap(doc.data())).toList());
  }

  /// REFINERY STATUS UPDATE
  static Future<void> updateIngestionStatus(String recordId, String status) async {
    await FirebaseFirestore.instance
        .collection('ingestion_refinery')
        .doc(recordId)
        .update({'status': status});
  }
}
