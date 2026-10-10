import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/recruitment_realm.dart';

/// RECRUITMENT REALM REPOSITORY (Constitution v1.0)
/// Sovereign authority for Realm life-cycle management.
class RealmRepository {
  static final _firestore = FirebaseFirestore.instance;
  static const String _collection = 'recruitment_realms';

  /// PERSIST REALM
  static Future<void> saveRealm(RecruitmentRealm realm) async {
    await _firestore.collection(_collection).doc(realm.realmId).set(realm.toMap());
  }

  /// FETCH REALM
  static Future<RecruitmentRealm?> getRealm(String realmId) async {
    final doc = await _firestore.collection(_collection).doc(realmId).get();
    if (!doc.exists) return null;
    return RecruitmentRealm.fromMap(doc.data()!);
  }

  /// RESOLVE BY ADVT NO (Sprint E.1)
  static Future<List<RecruitmentRealm>> getRealmsByAdvtNo(String advtNo) async {
    final snap = await _firestore.collection(_collection)
      .where('advertisement_number', isEqualTo: advtNo)
      .get();
    return snap.docs.map((doc) => RecruitmentRealm.fromMap(doc.data())).toList();
  }

  /// FETCH ALL REALMS
  static Future<List<RecruitmentRealm>> getAllRealms() async {
    final snap = await _firestore.collection(_collection).get();
    return snap.docs.map((doc) => RecruitmentRealm.fromMap(doc.data())).toList();
  }

  /// LIVE REALM STREAM
  static Stream<List<RecruitmentRealm>> streamRealms() {
    return _firestore.collection(_collection).snapshots().map((snap) => 
      snap.docs.map((doc) => RecruitmentRealm.fromMap(doc.data())).toList());
  }

  /// UPDATE STATUS (Constitutional State Change)
  static Future<void> updateStatus(String realmId, String status) async {
    await _firestore.collection(_collection).doc(realmId).update({'status': status});
  }
}
