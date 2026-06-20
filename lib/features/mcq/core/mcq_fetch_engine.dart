import 'package:cloud_firestore/cloud_firestore.dart';

class MCQFetchEngine {
  // ===================================================
  // STREAM MCQs 🔱
  // ===================================================
  static Stream<DocumentSnapshot<Map<String, dynamic>>> stream(String nodeId) {
    return FirebaseFirestore.instance
        .collection('generated_mcqs')
        .doc(nodeId)
        .snapshots();
  }
}
