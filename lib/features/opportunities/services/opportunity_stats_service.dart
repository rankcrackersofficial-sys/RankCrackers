import 'package:cloud_firestore/cloud_firestore.dart';

/// OPPORTUNITY STATS SERVICE
/// Provides aggregate counts for dashboard visibility.
class OpportunityStatsService {
  static final _firestore = FirebaseFirestore.instance;

  /// GET ACTIVE COUNT
  static Stream<int> streamActiveCount() {
    return _firestore
        .collection('mission_realms')
        .snapshots()
        .map((snapshot) => snapshot.docs.where((doc) {
              final data = doc.data();
              final status = (data['status'] ?? '').toString().toUpperCase();
              return data['archived'] != true &&
                  (status == 'ACTIVE' || status == 'LIVE' || status == 'PUBLISHED');
            }).length);
  }

  /// GET LATEST UPDATES COUNT
  /// Count of updates in the last 7 days.
  static Stream<int> streamLatestUpdatesCount() {
    final sevenDaysAgo = DateTime.now()
        .subtract(const Duration(days: 7))
        .millisecondsSinceEpoch;
    return _firestore
        .collection('opportunity_updates')
        .where('timestamp', isGreaterThanOrEqualTo: sevenDaysAgo)
        .snapshots()
        .map((snapshot) => snapshot.docs.length);
  }
}
