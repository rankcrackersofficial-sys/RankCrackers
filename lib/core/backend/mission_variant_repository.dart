import '../models/mission_variant.dart';
import '../firebase/firestore_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// MISSION VARIANT REPOSITORY
/// Access layer for sub-targets within a recruitment.
class MissionVariantRepository {
  static final _firestore = FirebaseFirestore.instance;
  static const String _collection = FirestoreService.variantCollection;

  /// Learner Discovery: Stream only published variants for a recruitment.
  static Stream<List<MissionVariant>> streamPublishedByRecruitment(String recruitmentId) {
    return _firestore
        .collection(_collection)
        .where('parentRecruitmentId', isEqualTo: recruitmentId)
        .where('status', isEqualTo: 'published')
        .snapshots()
        .map((snap) => snap.docs.map((doc) => MissionVariant.fromMap(doc.data())).toList());
  }

  static Future<List<MissionVariant>> fetchByRecruitment(String recruitmentId) async {
    final snap = await _firestore
        .collection(_collection)
        .where('parentRecruitmentId', isEqualTo: recruitmentId)
        .get();
    return snap.docs.map((doc) => MissionVariant.fromMap(doc.data())).toList();
  }
}
