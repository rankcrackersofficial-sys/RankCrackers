import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/digibook_block.dart';

/// DIGIBOOK REPOSITORY
/// Sovereign storage authority for mission-specific learning knowledge.
class DigiBookRepository {
  static final _firestore = FirebaseFirestore.instance;
  static const String _collection = 'digibook_refinery';

  static Future<void> saveBlock(DigiBookBlock block) async {
    await _firestore.collection(_collection).doc(block.id).set(block.toMap());
  }

  static Future<List<DigiBookBlock>> fetchByAtomicTopic(String atomicId) async {
    final snap = await _firestore.collection(_collection).where('atomicTopicId', isEqualTo: atomicId).get();
    return snap.docs.map((d) => DigiBookBlock.fromMap(d.data())).toList();
  }

  static Future<List<DigiBookBlock>> fetchByMission(String examId) async {
    // Exam Isolation Law (G1 Fix): Query only blocks linked to this specific mission
    final snap = await _firestore
        .collection(_collection)
        .where('examId', isEqualTo: examId)
        .where('status', isEqualTo: 'verified')
        .get();

    return snap.docs.map((d) => DigiBookBlock.fromMap(d.data())).toList();
  }

  /// Traceability: Stream only verified learning material.
  static Stream<List<DigiBookBlock>> streamPublished() {
    return _firestore
        .collection(_collection)
        .where('status', isEqualTo: 'published')
        .snapshots()
        .map((snap) => snap.docs.map((d) => DigiBookBlock.fromMap(d.data())).toList());
  }

  static Stream<List<DigiBookBlock>> streamReview() {
    return _firestore
        .collection(_collection)
        .where('status', isEqualTo: 'review')
        .snapshots()
        .map((snap) => snap.docs.map((d) => DigiBookBlock.fromMap(d.data())).toList());
  }
}
