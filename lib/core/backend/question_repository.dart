import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/question_model.dart';

/// QUESTION BANK REPOSITORY
/// Sovereign storage authority for assessment evidence.
class QuestionRepository {
  static final _firestore = FirebaseFirestore.instance;
  static const String _collection = 'published_questions';

  static Future<void> save(QuestionModel question) async {
    await _firestore.collection(_collection).doc(question.id).set(question.toMap());
  }

  static Future<List<QuestionModel>> fetchByNode(String nodeId) async {
    final snap = await _firestore.collection(_collection).where('nodeId', isEqualTo: nodeId).get();
    return snap.docs.map((d) => QuestionModel.fromMap(d.data())).toList();
  }

  static Future<List<QuestionModel>> fetchByExam(String examId) async {
    final snap = await _firestore.collection(_collection).where('examId', isEqualTo: examId).get();
    return snap.docs.map((d) => QuestionModel.fromMap(d.data())).toList();
  }

  static Future<List<QuestionModel>> fetchByTopic(String topicId) async {
    final snap = await _firestore.collection(_collection).where('atomicTopicId', isEqualTo: topicId).get();
    return snap.docs.map((d) => QuestionModel.fromMap(d.data())).toList();
  }

  /// Traceability & Verification: Stream only published questions for learners.
  static Stream<List<QuestionModel>> streamPublished() {
    return _firestore
        .collection(_collection)
        .where('status', isEqualTo: 'published')
        .snapshots()
        .map((snap) => snap.docs.map((d) => QuestionModel.fromMap(d.data())).toList());
  }

  static Stream<List<QuestionModel>> streamReview() {
    return _firestore
        .collection(_collection)
        .where('status', isEqualTo: 'review')
        .snapshots()
        .map((snap) => snap.docs.map((d) => QuestionModel.fromMap(d.data())).toList());
  }
}
