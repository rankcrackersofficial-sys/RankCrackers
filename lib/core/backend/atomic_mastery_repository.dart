import 'package:firebase_auth/firebase_auth.dart';
import '../models/atomic_mastery_state.dart';
import '../firebase/firestore_service.dart';

/// 🔱 ATOMIC MASTERY REPOSITORY
/// Sovereign storage authority for granular competency truth.
class AtomicMasteryRepository {
  static Future<void> save(AtomicMasteryState state) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    await FirestoreService.saveAtomicMastery(user.uid, state);
  }

  static Stream<List<AtomicMasteryState>> stream() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return Stream.value([]);
    return FirestoreService.streamAtomicMastery(user.uid);
  }
}
