import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

/// PEOPLE & ACCESS REPOSITORY (P2 Audit Fix)
class AccessRepository {
  static final _firestore = FirebaseFirestore.instance;
  static final _functions = FirebaseFunctions.instance;

  static Future<void> manageUserAccess({
    required String targetUid,
    required String role,
    required String action,
  }) async {
    await _functions.httpsCallable('manageUserAccess').call({
      'targetUid': targetUid,
      'role': role,
      'action': action,
    });
  }

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
}
