import 'dart:io';
import 'package:flutter/foundation.dart';
import '../../models/sentinel_draft.dart';
import '../../models/audit_record.dart';
import '../../backend/sentinel_repository.dart';
import '../../services/docx_extraction_service.dart';

/// 🔱 DOCX PARSE WORKER (v2 Hardened)
/// Implements Phase 9: Real Structure Extraction from XML.
class DocxParseWorker {
  
  /// 🔱 EXTRACTION PROTOCOL
  static Future<void> processDocx({
    required String recordId,
    required String fileHash,
    required String fileName,
    required String filePath,
  }) async {
    debugPrint("🔱 DOCX WORKER: Physically parsing $fileName");

    final file = File(filePath);
    if (!await file.exists()) {
      debugPrint("🔱 DOCX WORKER ERROR: Source file not found.");
      return;
    }

    try {
      // 🔱 Step 1: Real XML Parsing
      final extraction = await DocxExtractionService.extract(file);
      final List<Map<String, dynamic>> sections = extraction['sections'];
      final String fullText = extraction['fullText'];

      // 2. Register in Draft Zone with Metadata
      final draft = SentinelDraft(
        id: 'docx_draft_${DateTime.now().millisecondsSinceEpoch}_$recordId',
        type: 'docx_extraction',
        rawData: {
          'recordId': recordId,
          'fileName': fileName,
          'sections': sections,
          'fullText': fullText,
          'confidence': sections.isNotEmpty ? 0.96 : 0.45,
          'source_traceability': {
            'file': fileName,
            'hash': fileHash,
            'worker': 'DocxParseWorker_v2.0',
            'method': 'XML_Structure_Parsing',
          }
        },
        status: 'draft',
        audit: AuditRecord(
          sourceUrl: 'rc://ingest/$recordId',
          sourceHash: fileHash,
          documentHash: 'sections_${sections.length}',
          validationStatus: 'pending',
          workerVersion: '2.0.0',
          provider: 'local',
          discoveryCount: 1,
          createdAt: DateTime.now(),
          discoveredAt: DateTime.now(),
          lastSeenAt: DateTime.now(),
        ),
      );

      await SentinelRepository.injectDrafts([draft]);
      debugPrint("🔱 DOCX WORKER: Physical structural extraction complete.");
    } catch (e) {
      debugPrint("🔱 DOCX WORKER ERROR: $e");
    }
  }
}
