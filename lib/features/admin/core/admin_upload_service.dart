import 'package:cloud_firestore/cloud_firestore.dart';

class AdminUploadService {
  // ===================================================
  // SAVE ENTRY 
  // ===================================================
  static Future<void> save({
    required String id,
    required String type,
    required String exam,
    required String url,
  }) async {
    await FirebaseFirestore.instance.collection('admin_uploads').doc(id).set({
      'type': type,
      'exam': exam,
      'url': url,
      'createdAt': DateTime.now().millisecondsSinceEpoch,
    });
  }
}
