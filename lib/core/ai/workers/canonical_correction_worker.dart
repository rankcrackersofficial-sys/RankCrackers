import 'package:flutter/foundation.dart';
import '../../models/sentinel_draft.dart';
import '../../models/audit_record.dart';
import '../../backend/sentinel_repository.dart';
import '../../services/truth_validation_service.dart';
import '../refinery_ai_orchestrator.dart';

/// CANONICAL CORRECTION WORKER (v6 Hardened Authority)

/// CANONICAL CORRECTION WORKER (v6 Hardened Authority)
/// Implements Phase 9 Step 2 & Phase 10: Semantic Repair + Truth Validation.
class CanonicalCorrectionWorker {
  
  /// REPAIR PROTOCOL
  static Future<void> repairText({
    required String sourceId,
    required String rawExtractedText,
    required String workerVersion,
  }) async {
    debugPrint("CORRECTION WORKER: Initiating Abstracted AI Repair for $sourceId");

    // 1. GEMINI REPAIR SYSTEM PROMPT
    const String systemPrompt = """
      You are the Constitutional Repair Worker for RankCrackers.
      Goal: Fix extraction noise only.
      Rules:
      1. Repair OCR typos (e.g., '1ndia' -> 'India').
      2. Repair broken word hyphens (e.g., 'Constitu- tional' -> 'Constitutional').
      3. Normalize whitespace and basic formatting.
      
      CRITICAL:
      - Do NOT add new facts.
      - Do NOT remove existing facts.
      - Do NOT summarize or paraphrase.
      - Maintain the exact same language (Hindi/English).
      
      Output JSON: {"corrected_text": string, "changes": [{"type": "ocr|format", "raw": string, "fixed": string}]}
    """;

    try {
      // 2. ORCHESTRATED AI CALL (Provider Abstraction) 
      final orchestrated = await RefineryAIOrchestrator.repair(
        sourceId: sourceId,
        text: rawExtractedText,
        systemPrompt: systemPrompt,
      );
      
      final repairResult = orchestrated['result'] ?? {};
      final String provider = orchestrated['provider'] ?? 'unknown';
      
      final String correctedText = repairResult['corrected_text'] ?? rawExtractedText;
      final List<dynamic> changes = repairResult['changes'] ?? [];
      
      // 3. Phase 10: TRUTH VALIDATION LAYER
      final validation = await TruthValidationService.validate(correctedText, contextId: sourceId);
      final double confidence = validation['confidence'];
      final List<String> conflicts = List<String>.from(validation['conflicts']);
      final String recommendedAction = validation['recommendedAction'];

      // 4. Register in Sentinel Staging (Isolation Zone)
      // AUTHORITY GATE: Status is always 'draft' or 'verified_suggested'.
      final draft = SentinelDraft(
        id: 'repair_draft_${DateTime.now().millisecondsSinceEpoch}_$sourceId',
        type: 'canonical_repair',
        rawData: {
          'sourceId': sourceId,
          'raw_text': rawExtractedText,
          'corrected_text': correctedText,
          'changes': changes,
          'confidence': confidence,
          'conflicts': conflicts,
          'recommendedAction': recommendedAction,
          'system_prompt_version': '2.0',
        },
        status: 'draft', // ENFORCED: Must be human-approved.
        audit: AuditRecord(
          sourceUrl: 'rc://refinery/repair/$sourceId',
          sourceHash: 'raw_${rawExtractedText.hashCode}',
          documentHash: 'repaired_${correctedText.hashCode}',
          validationStatus: recommendedAction == 'recommend_approval' ? 'success' : 'pending',
          workerVersion: workerVersion,
          provider: provider,
          discoveryCount: 1,
          createdAt: DateTime.now(),
          discoveredAt: DateTime.now(),
          lastSeenAt: DateTime.now(),
        ),
      );

      await SentinelRepository.injectDrafts([draft]);
      debugPrint("CORRECTION WORKER: AI Repair Success. Confidence: $confidence. Staged for Human Approval.");
    } catch (e) {
      debugPrint("CORRECTION WORKER ERROR: AI Pipeline Failed - $e");
    }
  }
}
