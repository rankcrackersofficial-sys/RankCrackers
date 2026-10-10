import 'package:flutter/foundation.dart';
import 'ai_provider_config.dart';
import 'models/ai_provider.dart';
import 'models/ai_task_type.dart';
import 'workers/mcq_factory_worker.dart';
import 'workers/digibook_factory_worker.dart';
import 'workers/canonical_correction_worker.dart';
import 'workers/sentinel_extraction_worker.dart';
import 'workers/pdf_parse_worker.dart';
import 'workers/docx_parse_worker.dart';
import 'workers/xlsx_parse_worker.dart';

class AIWorkerRouter {
  // ===================================================
  // ROUTE TASK 
  // ===================================================
  static Future<void> route({
    required AITaskType task,
    required Map<String, dynamic> payload,
  }) async {
    final provider = AIProviderConfig.provider(task);
    debugPrint("Routing AI Task: ${task.name} via ${provider.name}");

    // Worker abstraction (Phase 9 Step 1)
    switch (task) {
      case AITaskType.pdfParse:
        await PdfParseWorker.processPdf(
          recordId: payload['id'], 
          fileHash: payload['fileHash'], 
          fileName: payload['fileName'],
          filePath: payload['filePath'],
        );
        return;
      case AITaskType.docxParse:
        await DocxParseWorker.processDocx(
          recordId: payload['id'], 
          fileHash: payload['fileHash'], 
          fileName: payload['fileName'],
          filePath: payload['filePath'],
        );
        return;
      case AITaskType.xlsxParse:
        await XlsxParseWorker.processXlsx(
          recordId: payload['id'], 
          fileHash: payload['fileHash'], 
          fileName: payload['fileName'],
          filePath: payload['filePath'],
        );
        return;
      case AITaskType.syllabus:
      case AITaskType.graph:
        await SentinelExtractionWorker.processExtraction(
          sourceId: payload['id'] ?? 'unknown',
          type: task.name,
          rawData: payload,
          workerVersion: '2.5.0',
        );
        return;
      case AITaskType.canonicalRepair:
        await CanonicalCorrectionWorker.repairText(
          sourceId: payload['id'] ?? 'unknown', 
          rawExtractedText: payload['text'] ?? '', 
          workerVersion: '3.0.0',
        );
        return;
      case AITaskType.mcq:
        await MCQFactoryWorker.extractEvidence(
          nodeId: payload['id'] ?? 'unknown',
          sourceText: payload['topic'] ?? '',
          workerVersion: '2.0.1',
        );
        return;
      case AITaskType.digibook:
        await DigiBookFactoryWorker.structureContent(
          atomicTopicId: payload['id'] ?? 'unknown',
          structuredData: payload,
          workerVersion: '1.5.0',
        );
        return;
      case AITaskType.oneLiner:
        await CanonicalCorrectionWorker.repairText(
          sourceId: payload['id'] ?? 'unknown', 
          rawExtractedText: payload['text'] ?? '', 
          workerVersion: '3.0.0',
        );
        return;
      default:
        break;
    }

    // Redirecting all API routes to Gemini
    if (provider == AIProvider.local) {
      await _handleLocal(task, payload);
    } else {
      await _handleGemini(task, payload);
    }
  }

  static Future<void> _handleGemini(AITaskType task, Map<String, dynamic> payload) async {
    // Worker logic for Gemini (Only supported API provider)
  }

  static Future<void> _handleLocal(AITaskType task, Map<String, dynamic> payload) async {
    // Worker logic for Local Processing
  }
}
