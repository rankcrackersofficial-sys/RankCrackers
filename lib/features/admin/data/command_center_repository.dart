import 'package:cloud_firestore/cloud_firestore.dart';

/// FOUNDER COMMAND CENTER REPOSITORY
/// Physical authority for live operational intelligence.
class CommandCenterRepository {
  static final _firestore = FirebaseFirestore.instance;

  // ===================================================
  // BUSINESS METRICS
  // ===================================================

  static Stream<int> streamActiveMissionsCount() {
    return _firestore
        .collection('mission_realms')
        .snapshots()
        .map((snap) => snap.docs.where((doc) {
              final data = doc.data();
              final status = (data['status'] ?? '').toString().toUpperCase();
              return data['archived'] != true &&
                  (status == 'ACTIVE' || status == 'LIVE' || status == 'PUBLISHED');
            }).length);
  }

  static Stream<int> streamPublishedDigiBooksCount() {
    return _firestore
        .collection('digibook_refinery')
        .where('status', isEqualTo: 'published')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamPublishedQuestionsCount() {
    return _firestore
        .collection('question_bank')
        .where('status', isEqualTo: 'published')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamTotalPendingReviews() {
    // Optimization: Use a dedicated system_metrics document for high-scale counters
    return _firestore
        .collection('system_metrics')
        .doc('content_summary')
        .snapshots()
        .map((snap) {
          if (!snap.exists) return 0;
          final data = snap.data()!;
          return (data['pendingDigibooks'] ?? 0) +
              (data['pendingQuestions'] ?? 0) +
              (data['pendingNodes'] ?? 0) +
              (data['pendingSentinel'] ?? 0);
        });
  }

  // ===================================================
  // BUDGET & SYSTEM METRICS
  // ===================================================

  static Stream<int> streamAiBudgetUsage() {
    // Aggregated System Budget from global collection
    final monthId = DateTime.now().toIso8601String().substring(0, 7);
    return _firestore
        .collection('system_budget')
        .doc(monthId)
        .snapshots()
        .map((snap) => (snap.data()?['monthlyTokens'] ?? 0) as int);
  }

  static Stream<Map<String, int>> streamWorkerMetrics() {
    return _firestore.collection('worker_registry').snapshots().map((snap) {
      final now = DateTime.now();
      int online = 0;
      for (var doc in snap.docs) {
        final hb = (doc.data()['lastHeartbeat'] as Timestamp?)?.toDate();
        if (hb != null && now.difference(hb).inSeconds <= 60) {
          online++;
        }
      }
      return {'online': online, 'total': snap.size};
    });
  }

  static Stream<int> streamActiveWorkersCount() {
    // Definition of "Active" matching constitutional ONLINE rule (<= 60s)
    final threshold = DateTime.now().subtract(const Duration(seconds: 60));
    return _firestore
        .collection('worker_registry')
        .where('lastHeartbeat', isGreaterThan: threshold)
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<List<Map<String, dynamic>>> streamWorkerStatuses() {
    return _firestore
        .collection('worker_registry')
        .snapshots()
        .map(
          (snap) =>
              snap.docs.map((doc) => {...doc.data(), 'id': doc.id}).toList(),
        );
  }

  static Future<void> toggleWorker(String workerId, bool enabled) async {
    await _firestore.collection('worker_registry').doc(workerId).set({
      'enabled': enabled,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  // ===================================================
  // REVIEW QUEUE METRICS (LEGACY SUPPORT)
  // ===================================================

  static Stream<int> streamPendingDigiBookCount() {
    return _firestore
        .collection('digibook_refinery')
        .where('status', isEqualTo: 'review')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamPendingQuestionCount() {
    return _firestore
        .collection('question_bank')
        .where('status', isEqualTo: 'review')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamPendingSyllabusCount() {
    return _firestore
        .collection('micro_nodes')
        .where('status', isEqualTo: 'draft')
        .snapshots()
        .map((snap) => snap.size);
  }

  // ===================================================
  // PEOPLE & ACCESS METRICS
  // ===================================================

  static Stream<Map<String, int>> streamAccessMetrics() {
    return _firestore.collection('users').snapshots().map((snap) {
      int founders = 0;
      int admins = 0;
      int managers = 0;
      int reviewers = 0;

      for (var doc in snap.docs) {
        final role = doc.data()['role']?.toString().toLowerCase();
        if (role == 'founder') {
          founders++;
        } else if (role == 'admin') {
          admins++;
        } else if (role == 'manager' || role == 'content_manager') {
          managers++;
        } else if (role == 'reviewer') {
          reviewers++;
        }
      }

      return {
        'founders': founders,
        'admins': admins,
        'managers': managers,
        'reviewers': reviewers,
        'total': snap.size,
      };
    });
  }

  // ===================================================
  // SYSTEM HEALTH METRICS
  // ===================================================

  static Stream<int> streamAIQueueSize() {
    return _firestore
        .collection('ai_queue')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamAIFailuresCount() {
    return _firestore
        .collection('ai_failed_tasks')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamPendingDiscoveriesCount() {
    return _firestore
        .collection('sentinel_drafts')
        .where('status', isEqualTo: 'under_review') // Corrected Status
        .snapshots()
        .map((snap) => snap.size);
  }
}
