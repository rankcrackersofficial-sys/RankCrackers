import 'package:firebase_auth/firebase_auth.dart';
import '../models/atomic_risk_state.dart';
import '../firebase/firestore_service.dart';

/// 🔱 ATOMIC RISK REPOSITORY
/// Sovereign storage authority for granular vulnerability intelligence.
class AtomicRiskRepository {
  static Future<void> save(AtomicRiskState state) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    await FirestoreService.saveAtomicRisk(user.uid, state);
  }

  static Stream<List<AtomicRiskState>> stream() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return Stream.value([]);
    return FirestoreService.streamAtomicRisk(user.uid);
  }
}
