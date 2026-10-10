import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/digibook_unit.dart';
import '../models/digibook_chapter.dart';

/// DIGIBOOK REPOSITORY (Sprint G)
class DigiBookRepository {
  static final _firestore = FirebaseFirestore.instance;
  
  static const String unitCollection = 'digibook_units';
  static const String chapterCollection = 'digibook_chapters';

  /// SAVE DIGIBOOK UNIT
  static Future<void> saveUnit(DigiBookUnit unit) async {
    await _firestore.collection(unitCollection).doc(unit.id).set(unit.toMap());
  }

  /// SAVE DIGIBOOK CHAPTER
  static Future<void> saveChapter(DigiBookChapter chapter) async {
    await _firestore.collection(chapterCollection).doc(chapter.id).set(chapter.toMap());
  }

  /// FETCH UNITS FOR REALM
  static Stream<List<DigiBookUnit>> streamUnits(String realmId) {
    return _firestore.collection(unitCollection)
      .where('realm_id', isEqualTo: realmId)
      .snapshots()
      .map((snap) => snap.docs.map((doc) => DigiBookUnit.fromMap(doc.data())).toList());
  }

  /// FETCH CHAPTERS FOR REALM
  static Stream<List<DigiBookChapter>> streamChapters(String realmId) {
    return _firestore.collection(chapterCollection)
      .where('realm_id', isEqualTo: realmId)
      .orderBy('order')
      .snapshots()
      .map((snap) => snap.docs.map((doc) => DigiBookChapter.fromMap(doc.data())).toList());
  }
}
