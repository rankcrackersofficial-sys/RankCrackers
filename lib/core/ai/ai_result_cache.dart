import 'package:cloud_firestore/cloud_firestore.dart';

class AIResultCache {
  static Future<Map<String, dynamic>?> get(String id) async {
    final doc = await FirebaseFirestore.instance.collection('ai_results').doc(id).get();
    return doc.exists ? doc.data() : null;
  }
}
