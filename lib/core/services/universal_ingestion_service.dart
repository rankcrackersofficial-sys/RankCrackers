import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/ingestion_record.dart';
import '../firebase/firestore_service.dart';
import '../ai/ai_queue_service.dart';
import '../ai/models/ai_task_type.dart';
import '../../features/admin/core/admin_storage_service.dart';

/// UNIVERSAL INGESTION SERVICE (Hardened v9.2.0 Sovereign)
/// AI-Driven Automated Mission Factory Pipeline.
/// Physically manifests the Notification Ingestion Constitution v1.0.
class UniversalIngestionService {
  
  static Future<IngestionRecord> registerSource({
    required String fileName,
    required Uint8List bytes,
    File? file,
    required String assetType,
    required String recruitmentId,
    required String documentStatus,
    Map<String, dynamic> extraMetadata = const {},
  }) async {
    debugPrint('INGESTION: Starting registration for $fileName');
    final fileType = fileName.split('.').last.toLowerCase();
    final fileHash = sha256.convert(bytes).toString();
    final recordId = 'hash_$fileHash';
    debugPrint('INGESTION: File Hash: $fileHash');

    final docRef = FirebaseFirestore.instance.collection('ingestion_refinery').doc(recordId);
    final doc = await docRef.get();

    String downloadUrl;
    String storagePath;
    
    if (doc.exists) {
      debugPrint('INGESTION: Physical collision detected. Re-triggering AI Analysis Chain.');
      final existingData = doc.data()!;
      downloadUrl = existingData['sourceUrl'];
      storagePath = existingData['storagePath'] ?? 'ingestion_refinery/$fileHash.$fileType';
      
      await docRef.update({
        'assetType': assetType,
        'status': 'received', // Resetting to received
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      final record = IngestionRecord.fromMap({...existingData, 'id': recordId, 'storagePath': storagePath});
      await _triggerIngestionPipeline(record);
      return record;
    } else {
      debugPrint('INGESTION: New file detected. Uploading to storage...');
      storagePath = 'ingestion_refinery/$fileHash.$fileType';
      downloadUrl = await AdminStorageService.upload(
        bytes: bytes,
        file: file,
        path: storagePath,
        contentType: _getMimeType(fileType),
      );
      debugPrint('INGESTION: Upload complete. URL: $downloadUrl');
    }

    final record = IngestionRecord(
      id: recordId,
      fileName: fileName,
      fileType: fileType,
      mimeType: _getMimeType(fileType),
      fileSize: bytes.length,
      fileHash: fileHash,
      status: 'received',
      sourceUrl: downloadUrl, 
      storagePath: storagePath,
      createdAt: DateTime.now(),
      archived: false,
      archivedAt: null,
      archivedBy: null,
      assetType: assetType,
      recruitmentId: recruitmentId,
      documentStatus: documentStatus,
      extraMetadata: extraMetadata,
    );

    // Forensic Fix: Use server timestamp for precise UI ordering
    final recordMap = record.toMap();
    recordMap['createdAt'] = FieldValue.serverTimestamp();

    debugPrint('INGESTION: Committing record to refinery...');
    await FirestoreService.uploadBatch('ingestion_refinery', [recordMap]);
    
    // Trigger Constitution-Grade AI Chain
    await _triggerIngestionPipeline(record);

    return record;
  }

  static Future<void> _triggerIngestionPipeline(IngestionRecord record) async {
    debugPrint('INGESTION: Triggering pipeline for ${record.id}');
    // Phase 1: Physical Extraction (Constitution Stage 2)
    await AIQueueService.push(
      type: AITaskType.pdfParse,
      payload: {
        'id': record.id,
        'fileName': record.fileName,
        'filePath': record.sourceUrl,
        'storagePath': record.storagePath, // ADDED FOR WORKER RELIABILITY
        'fileType': record.fileType,
        'intent': record.assetType,
        'status': 'parsing',
        'fileHash': record.fileHash
      },
    );
  }

  static String _getMimeType(String ext) {
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'application/octet-stream';
    }
  }
}
