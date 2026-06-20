import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/warrior_profile.dart';
import 'profile_completion_engine.dart';

/// 🔱 WARRIOR PROFILE SERVICE
/// Handles data persistence for the deep demographic profile.
class WarriorProfileService {
  static final _firestore = FirebaseFirestore.instance;
  static const String _collection = 'warrior_profiles';

  /// 🔱 AUTO-SAVE PROTOCOL
  /// Persists changes immediately to ensure truth is captured without manual submission.
  static Future<void> autoSave(WarriorProfile profile) async {
    final double completion = ProfileCompletionEngine.calculate(profile);
    final updatedProfile = profile.copyWith(completionPercent: completion);

    await _firestore
        .collection(_collection)
        .doc(updatedProfile.uid)
        .set(updatedProfile.toMap(), SetOptions(merge: true));
  }

  /// 🔱 FETCH PROFILE
  static Future<WarriorProfile?> getProfile(String uid) async {
    final doc = await _firestore.collection(_collection).doc(uid).get();
    if (doc.exists && doc.data() != null) {
      return WarriorProfile.fromMap(doc.data()!);
    }
    return null;
  }
}
