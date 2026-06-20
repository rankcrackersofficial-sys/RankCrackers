import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import '../../models/sentinel_draft.dart';
import '../../models/audit_record.dart';
import '../../backend/sentinel_repository.dart';
import '../../services/pdf_extraction_service.dart';
import '../../engines/chunking_engine.dart';
import 'notification_pipeline_workers.dart';
import 'syllabus_pipeline_workers.dart';

/// 🔱 PDF PARSE WORKER (Hardened v2.5 Sovereign)
/// Orchestrates Autonomous Extraction & Blueprint Decomposition.
class PdfParseWorker {
  
  /// EXTRACTION PROTOCOL
  static Future<void> processPdf({
    required String recordId,
    required String fileHash,
    required String fileName,
    required String filePath, // Local path or URL
  }) async {
    debugPrint("🔱 PDF WORKER: Extracting text from $fileName");

    File? file;
    
    try {
      if (filePath.startsWith('http')) {
        file = await _downloadToTemp(filePath, fileName);
      } else {
        file = File(filePath);
      }

      if (file == null || !await file.exists()) {
        debugPrint("🔱 PDF WORKER ERROR: Source file not found: $filePath");
        return;
      }

      final extraction = await PdfExtractionService.extract(file);
      final String extractedText = extraction['fullText'];
      final List<Map<String, dynamic>> pageMap = extraction['pageMap'];
      final bool ocrFlag = extraction['ocrFlag'];

      // 🔱 Phase 2: Notification Pipeline
      try {
        final canonicalReport = await NotificationReportBuilder.build(
          id: recordId,
          url: filePath,
          hash: fileHash,
          text: extractedText,
        );

        final draft = SentinelDraft(
          id: 'notif_${recordId}',
          type: 'notification',
          rawData: canonicalReport.toMap(),
          status: 'under_review', 
          audit: AuditRecord(
            sourceUrl: filePath,
            sourceHash: fileHash,
            documentHash: 'extracted_${extractedText.hashCode}',
            validationStatus: 'pending',
            workerVersion: '2.5.0',
            provider: 'notification_pipeline',
            discoveryCount: 1,
            createdAt: DateTime.now(),
            discoveredAt: DateTime.now(),
            lastSeenAt: DateTime.now(),
          ),
        );

        await SentinelRepository.injectDrafts([draft]);
        debugPrint("🔱 PDF WORKER: Notification Intelligence Pipeline Success.");
        return;
      } catch (e) {
        debugPrint("🔱 PDF WORKER: Notification Pipeline Bypassed - $e");
      }

      // 🔱 Phase 3: Syllabus Decomposition Pipeline
      try {
        final syllabusReports = await SyllabusReportBuilder.build(
          text: extractedText,
          id: recordId,
        );

        if (syllabusReports.isNotEmpty) {
          final drafts = syllabusReports.map((report) => SentinelDraft(
            id: 'syllabus_${recordId}_${report.subject.toLowerCase()}',
            type: 'syllabus',
            rawData: report.toMap(),
            status: 'under_review',
            audit: AuditRecord(
              sourceUrl: filePath,
              sourceHash: fileHash,
              documentHash: 'extracted_${extractedText.hashCode}',
              validationStatus: 'pending',
              workerVersion: '1.0.0',
              provider: 'syllabus_decomposition_pipeline',
              discoveryCount: 1,
              createdAt: DateTime.now(),
              discoveredAt: DateTime.now(),
              lastSeenAt: DateTime.now(),
            ),
          )).toList();

          await SentinelRepository.injectDrafts(drafts);
          debugPrint("🔱 PDF WORKER: Syllabus Atomic Decomposition Success. Staged ${drafts.length} drafts.");
          return;
        }
      } catch (e) {
        debugPrint("🔱 PDF WORKER: Syllabus Pipeline Bypassed - $e");
      }

      // 🔱 Fallback: Generic Extraction
      final chunks = ChunkingEngine.segment(extractedText);

      // 🔱 Isolation Zone Registration
      final draft = SentinelDraft(
        id: 'pdf_draft_${DateTime.now().millisecondsSinceEpoch}_$recordId',
        type: 'pdf_extraction',
        rawData: {
          'recordId': recordId,
          'fullText': extractedText,
          'pageMap': pageMap,
          'chunks': chunks,
          'ocr_required': ocrFlag,
          'confidence': ocrFlag ? 0.85 : 0.99, 
          'source_traceability': {
            'file': fileName,
            'hash': fileHash,
            'pages': pageMap.length,
            'chunks': chunks.length,
            'method': ocrFlag ? 'OCR_Fallback' : 'Direct_Text',
          }
        },
        status: 'draft',
        audit: AuditRecord(
          sourceUrl: filePath,
          sourceHash: fileHash,
          documentHash: 'extracted_${extractedText.hashCode}',
          validationStatus: 'pending',
          workerVersion: '2.3.0',
          provider: 'local_engine',
          discoveryCount: 1,
          createdAt: DateTime.now(),
          discoveredAt: DateTime.now(),
          lastSeenAt: DateTime.now(),
        ),
      );

      await SentinelRepository.injectDrafts([draft]);
      debugPrint("🔱 PDF WORKER: Extraction complete. Draft staged.");

    } catch (e) {
      debugPrint("🔱 PDF WORKER ERROR: Extraction failed - $e");
    } finally {
      // 🔱 Cleanup temporary assets
      if (filePath.startsWith('http') && file != null) {
        try {
          if (await file.exists()) await file.delete();
        } catch (e) {
          debugPrint("🔱 PDF WORKER: Cleanup failed - $e");
        }
      }
    }
  }

  static Future<File?> _downloadToTemp(String url, String fileName) async {
    try {
      final dio = Dio();
      final tempDir = await getTemporaryDirectory();
      final tempPath = "${tempDir.path}/$fileName";
      await dio.download(url, tempPath);
      return File(tempPath);
    } catch (e) {
      debugPrint("🔱 PDF WORKER: Download failed - $e");
      return null;
    }
  }
}
