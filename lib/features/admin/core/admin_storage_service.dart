import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';

class AdminStorageService {
  // ===================================================
  // UPLOAD FILE 🔱
  // ===================================================
  
  /// Uploads a file (Mobile/Desktop) or bytes (Web) to Firebase Storage.
  /// Hardened to handle cancellations and platform-specific quirks.
  static Future<String> upload({
    File? file,
    Uint8List? bytes,
    required String path,
    String? contentType,
  }) async {
    final storage = FirebaseStorage.instance;
    final bucket = storage.bucket;
    debugPrint("🔱 STORAGE BUCKET = $bucket");
    debugPrint("🔱 STORAGE PATH = $path");
    
    final ref = storage.ref(path);
    final metadata = SettableMetadata(contentType: contentType);

    try {
      UploadTask task;

      // 🔱 Optimization: Use bytes by preference for reliability on Mobile/Web
      if (bytes != null) {
        task = ref.putData(bytes, metadata);
      } else if (file != null) {
        task = ref.putFile(file, metadata);
      } else {
        throw Exception("🔱 STORAGE ERROR: No data provided for upload.");
      }

      // Monitor completion
      task.snapshotEvents.listen((event) {
        debugPrint("🔱 STORAGE PROGRESS: ${event.bytesTransferred}/${event.totalBytes} - ${event.state}");
      });

      final snapshot = await task;
      
      debugPrint("🔱 FINAL STATE = ${snapshot.state}");
      debugPrint("🔱 BYTES = ${snapshot.bytesTransferred}/${snapshot.totalBytes}");

      // 🔱 Audit: Verify object existence before URL retrieval
      try {
        final checkRef = storage.ref(path);
        final meta = await checkRef.getMetadata();
        debugPrint("🔱 OBJECT EXISTS = ${meta.fullPath}");
      } catch (e) {
        debugPrint("🔱 OBJECT DOES NOT EXIST AFTER UPLOAD: $e");
        throw Exception("🔱 STORAGE ERROR: Physical object not found after upload completion.");
      }

      if (snapshot.state == TaskState.success) {
        final url = await ref.getDownloadURL();
        debugPrint("🔱 DOWNLOAD URL = $url");
        return url;
      } else {
        throw Exception("🔱 STORAGE ERROR: Task failed with state: ${snapshot.state}");
      }
    } on FirebaseException catch (e) {
      debugPrint("🔱 FIREBASE EXCEPTION: [${e.code}] ${e.message}");
      if (e.code == 'canceled') {
        throw Exception("🔱 STORAGE ERROR: Upload was cancelled by user or system.");
      }
      rethrow;
    } catch (e) {
      debugPrint("🔱 STORAGE CRITICAL FAILURE: $e");
      rethrow;
    }
  }
}
