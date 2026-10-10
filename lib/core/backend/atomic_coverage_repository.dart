import 'package:firebase_auth/firebase_auth.dart';
import '../models/atomic_coverage_state.dart';
import '../firebase/firestore_service.dart';

/// ATOMIC COVERAGE REPOSITORY
/// Sovereign storage authority for granular scope completion truth.
class AtomicCoverageRepository {
  static Future<void> save(AtomicCoverageState state) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    await FirestoreService.saveAtomicCoverage(user.uid, state);
  }

  static Stream<List<AtomicCoverageState>> stream() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return Stream.value([]);
    return FirestoreService.streamAtomicCoverage(user.uid);
  }
}
