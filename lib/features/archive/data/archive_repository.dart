import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:rank_crackers/core/models/recruitment_realm.dart';

class ArchiveRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  /// Streams all active recruitment realms for the student archive
  Stream<List<RecruitmentRealm>> streamActiveRealms() {
    return _firestore
        .collection('mission_realms')
        .where('status', isEqualTo: 'ACTIVE')
        .where('userPanelVisible', isEqualTo: true)
        .where('archived', isEqualTo: false)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => RecruitmentRealm.fromMap(doc.data()))
            .toList());
  }

  /// Fetches a specific realm's assets
  Future<List<Map<String, dynamic>>> getRealmAssets(String realmId) async {
    final doc = await _firestore.collection('mission_realms').doc(realmId).get();
    if (doc.exists) {
      final data = doc.data()!;
      return List<Map<String, dynamic>>.from(data['assets'] ?? []);
    }
    return [];
  }

  /// Generates a secure, time-limited signed URL for an asset
  Future<String?> getSecureUrl(String assetUrl, {String? realmId, String? assetType}) async {
    try {
      final result = await _functions.httpsCallable('getSecureAssetUrl').call({
        'assetUrl': assetUrl,
        'realmId': realmId,
        'assetType': assetType,
      });
      if (result.data['success'] == true) {
        return result.data['signedUrl'] as String;
      }
    } catch (e) {
      print("SECURE URL ERROR: $e");
    }
    return null;
  }
}
