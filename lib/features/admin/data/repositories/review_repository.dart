import 'package:cloud_firestore/cloud_firestore.dart';

class ReviewRepository {
  static final _firestore = FirebaseFirestore.instance;

  static Stream<int> streamPendingDigiBookCount() {
    return _firestore
        .collection('digibook_refinery')
        .where('status', isEqualTo: 'review')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamPendingQuestionCount() {
    return _firestore
        .collection('question_bank')
        .where('status', isEqualTo: 'review')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamPendingSyllabusCount() {
    return _firestore
        .collection('micro_nodes')
        .where('status', isEqualTo: 'draft')
        .snapshots()
        .map((snap) => snap.size);
  }
}
