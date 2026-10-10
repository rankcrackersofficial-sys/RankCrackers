import 'package:cloud_firestore/cloud_firestore.dart';

/// OPPORTUNITY STATS SERVICE
/// Provides aggregate counts for dashboard visibility.
class OpportunityStatsService {
  static final _firestore = FirebaseFirestore.instance;

  /// GET ACTIVE COUNT
  static Stream<int> streamActiveCount() {
    return _firestore
        .collection('recruitments')
        .where('status', isEqualTo: 'published')
        .snapshots()
        .map((snapshot) => snapshot.docs.length);
  }

  /// GET LATEST UPDATES COUNT
  /// Count of updates in the last 7 days.
  static Stream<int> streamLatestUpdatesCount() {
    final sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7)).millisecondsSinceEpoch;
    return _firestore
        .collection('opportunity_updates')
        .where('timestamp', isGreaterThanOrEqualTo: sevenDaysAgo)
        .snapshots()
        .map((snapshot) => snapshot.docs.length);
  }
}
