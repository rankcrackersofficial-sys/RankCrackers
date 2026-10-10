import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../core/models/worker_registry.dart';

/// WORKER REGISTRY REPOSITORY
/// Command interface for physical worker governance.
class WorkerRegistryRepository {
  static final _firestore = FirebaseFirestore.instance;
  static const String _collection = 'worker_registry';

  static Stream<List<WorkerRegistry>> streamRegistry() {
    return _firestore.collection(_collection).snapshots().map((snap) {
      return snap.docs.map((doc) {
        final data = doc.data();
        // Forensic Fix: Ensure ID is preserved from document ID if missing in data
        if (!data.containsKey('id') || data['id'] == null || data['id'].toString().isEmpty) {
          data['id'] = doc.id;
        }
        return WorkerRegistry.fromMap(data);
      }).toList();
    });
  }

  static Future<void> updateWorker(String workerId, Map<String, dynamic> data) async {
    await _firestore.collection(_collection).doc(workerId).set({
      ...data,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  static Future<void> resetErrorCount(String workerId) async {
    if (workerId.isEmpty) return;
    await _firestore.collection(_collection).doc(workerId).update({
      'errorCount': 0,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Initial Registration of all Workers in the Battalion
  static Future<void> bootstrapBattalion() async {
    final List<Map<String, dynamic>> initialWorkers = [
      {'id': 'notification_scout', 'name': 'Notification Scout Worker'},
      {'id': 'syllabus_scout', 'name': 'Syllabus Scout Worker'},
      {'id': 'exam_date_scout', 'name': 'Exam Date Scout Worker'},
      {'id': 'amendment_scout', 'name': 'Amendment Scout Worker'},
      {'id': 'sentinel_worker', 'name': 'Sentinel Worker', 'priority': 'high'},
      {'id': 'promotion_worker', 'name': 'Promotion Worker', 'priority': 'critical'},
      {'id': 'digibook_worker', 'name': 'DigiBook Worker'},
      {'id': 'mcq_worker', 'name': 'MCQ Worker'},
      {'id': 'diagnostic_worker', 'name': 'Diagnostic Worker'},
      {'id': 'micro_test_worker', 'name': 'Micro Test Worker'},
      {'id': 'macro_test_worker', 'name': 'Macro Test Worker'},
      {'id': 'major_test_worker', 'name': 'Major Test Worker'},
      {'id': 'coverage_worker', 'name': 'Coverage Worker'},
      {'id': 'risk_worker', 'name': 'Risk Worker'},
      {'id': 'mastery_worker', 'name': 'Mastery Worker'},
      {'id': 'crucible_worker', 'name': 'Crucible Worker'},
    ];

    for (var w in initialWorkers) {
      final doc = await _firestore.collection(_collection).doc(w['id']).get();
      if (!doc.exists) {
        await _firestore.collection(_collection).doc(w['id']).set({
          ...w,
          'enabled': true,
          'mode': 'manual',
          'priority': w['priority'] ?? 'normal',
          'status': 'OFFLINE',
          'queueSize': 0,
          'errorCount': 0,
          'monthlyTokenUsage': 0,
          'monthlyCost': 0.0,
          'monthlyTokenLimit': 500000,
          'monthlyCostLimit': 1000.0,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    }
  }
}
