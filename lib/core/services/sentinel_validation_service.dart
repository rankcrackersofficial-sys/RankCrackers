import '../models/sentinel_draft.dart';
import '../models/recruitment.dart';
import '../models/exam_blueprint.dart';
import '../models/micro_topic_node.dart';
import '../models/question_model.dart';
import '../models/digibook_block.dart';
import '../backend/sentinel_repository.dart';
import '../firebase/firestore_service.dart';
import '../backend/question_repository.dart';
import '../backend/digibook_repository.dart';

/// SENTINEL VALIDATION SERVICE
/// Handles validation drills and the promotion of drafts to production.
/// Implements Phase 4D (Validation Drills) and Promotion Flow.
class SentinelValidationService {
  
  // ===================================================
  // DRILL A: DUPLICATE ATTACK (ENHANCED) 
  // ===================================================

  /// Simulates a duplicate attack with discovery count tracking.
  static Future<void> simulateDuplicateAttack(SentinelDraft draft, int iterations) async {
    for (int i = 0; i < iterations; i++) {
      final updatedDraft = draft.copyWith(
        audit: draft.audit.copyWith(
          lastSeenAt: DateTime.now(),
          discoveryCount: (draft.audit.discoveryCount + i + 1),
        ),
      );
      await SentinelRepository.injectDrafts([updatedDraft]);
    }
  }

  /// Drill A3: Concurrency Simulation
  static Future<void> simulateConcurrentAttack(SentinelDraft draft, int workerCount) async {
    final List<Future> attacks = List.generate(workerCount, (_) => 
      SentinelRepository.injectDrafts([draft])
    );
    await Future.wait(attacks);
  }

  // ===================================================
  // DRILL B: CORRIGENDUM ATTACK 
  // ===================================================

  /// Updates a draft with new data and verifies hash-based detection.
  static Future<void> simulateCorrigendum({
    required SentinelDraft existingDraft, 
    required Map<String, dynamic> newRawData, 
    required String newSourceHash,
    required String newDocumentHash,
  }) async {
    final bool isContentChanged = existingDraft.audit.documentHash != newDocumentHash;

    String nextStatus = existingDraft.audit.validationStatus;
    int nextContentVersion = existingDraft.audit.contentVersion;

    if (isContentChanged) {
      nextStatus = 'corrigendum_detected';
      nextContentVersion += 1;
    }

    final updatedDraft = existingDraft.copyWith(
      rawData: newRawData,
      status: isContentChanged ? 'under_review' : existingDraft.status,
      audit: existingDraft.audit.copyWith(
        sourceHash: newSourceHash,
        documentHash: newDocumentHash,
        validationStatus: nextStatus,
        contentVersion: nextContentVersion,
        lastSeenAt: DateTime.now(),
        discoveryCount: existingDraft.audit.discoveryCount + 1,
      ),
    );

    await SentinelRepository.injectDrafts([updatedDraft]);
  }

  // ===================================================
  // DRILL C: HALLUCINATION ATTACK 
  // ===================================================

  /// Validates extracted data against strict rules to detect AI hallucinations.
  static Future<SentinelDraft> validateExtraction({
    required SentinelDraft draft,
    required Map<String, dynamic> sourceGroundTruth,
  }) async {
    final List<String> validationErrors = [];
    final extracted = draft.rawData;

    if (extracted.containsKey('ageLimit')) {
      final groundAge = sourceGroundTruth['ageLimit'];
      if (extracted['ageLimit'] != groundAge) {
        validationErrors.add('Scenario C1: Incorrect Age Limit extraction');
      }
    }

    if (extracted.containsKey('vacancyCount')) {
      if (extracted['vacancyCount'] != sourceGroundTruth['vacancyCount']) {
        validationErrors.add('Scenario C2: Vacancy count mismatch');
      }
    }

    final List<String> requiredFields = ['id', 'title', 'state', 'year'];
    for (final field in requiredFields) {
      if (extracted[field] == null || extracted[field].toString().isEmpty) {
        validationErrors.add('Scenario C3: Missing required field: $field');
      }
    }

    if (extracted['negativeMarking'] != null && sourceGroundTruth['negativeMarking'] == null) {
      validationErrors.add('Scenario C4: Fabricated negative marking detected');
    }

    final bool isFailed = validationErrors.isNotEmpty;
    
    final updatedDraft = draft.copyWith(
      status: isFailed ? 'under_review' : 'verified',
      audit: draft.audit.copyWith(
        validationStatus: isFailed ? 'failed' : 'success',
        validatedAt: DateTime.now(),
        confidenceScore: isFailed ? 0.45 : 0.98,
        impactLevel: isFailed ? 'HIGH' : 'LOW',
      ),
    );

    await SentinelRepository.injectDrafts([updatedDraft]);
    return updatedDraft;
  }

  // ===================================================
  // DRILL D: DRAFT -> PUBLISH GATE 
  // ===================================================

  /// Promotes a Sentinel Draft to a Production Recruitment.
  /// Implements Document 50 Section 5 (Draft -> Publish separation).
  /// Hardened for Scenarios D1-D6 and Phase 4E-A (Batch Tracing).
  static Future<bool> promoteToProduction({
    required SentinelDraft draft,
    required String? adminId,
    required String? batchId, // Scenario E1: Promotion Batch ID for Rollback
  }) async {
    // Scenario D1 & D2: Status Verification
    if (draft.audit.validationStatus == 'pending' || draft.audit.validationStatus == 'failed') {
      print('PROMOTION DENIED: Constitutional validation not passed (${draft.audit.validationStatus})');
      return false;
    }

    // Scenario D3: Authorization Check
    if (adminId == null || adminId.isEmpty) {
      print('PROMOTION DENIED: Admin authorization missing.');
      return false;
    }

    if (batchId == null || batchId.isEmpty) {
      print('PROMOTION DENIED: Promotion Batch ID missing.');
      return false;
    }

    // Scenario D4 & D5: State Finality Check
    if (draft.audit.validationStatus != 'success') {
      print('PROMOTION DENIED: Draft status must be SUCCESS for promotion.');
      return false;
    }

    if (draft.type != 'recruitment') {
      print('PROMOTION DENIED: Target type mismatch.');
      return false;
    }

    try {
      // Scenario D5: Transaction Integrity
      // We use the same map-driven construction to ensure parity
      final recruitment = Recruitment.fromMap(draft.rawData).copyWith(
        status: 'published',
        version: draft.audit.contentVersion.toString(),
      );

      // Scenario D6: Double Promotion Protection (Idempotency)
      // Firestore uploadRecruitment uses .set() which is idempotent by ID
      await FirestoreService.uploadRecruitment(recruitment);

      // Audit Completion
      final updatedAudit = draft.audit.copyWith(
        publishedBy: adminId,
        promotionBatchId: batchId,
        publishedAt: DateTime.now(),
        validationStatus: 'success', // Re-assert success
      );
      
      final updatedDraft = draft.copyWith(
        status: 'published',
        audit: updatedAudit,
      );

      await SentinelRepository.injectDrafts([updatedDraft]);
      
      print('PROMOTION SUCCESS: Draft ${draft.id} is now LIVE as ${recruitment.title}');
      return true;
    } catch (e) {
      print('PROMOTION TRANSACTION FAILED: $e');
      return false;
    }
  }

  // ===================================================
  // PHASE 4E-B: BLUEPRINT PROMOTION 
  // ===================================================

  /// Promotes a Blueprint Draft ensuring referential integrity with a published Recruitment.
  static Future<bool> promoteBlueprintToProduction({
    required SentinelDraft draft,
    required String? adminId,
    required String? batchId,
  }) async {
    // Integrity Check B1, B2: Recruitment must exist and be published
    final String recruitmentId = draft.rawData['recruitmentId'] ?? '';
    final recruitment = await FirestoreService.fetchRecruitment(recruitmentId);

    if (recruitment == null || recruitment.status != 'published') {
      print('PROMOTION DENIED: Orphaned Blueprint. Parent recruitment must be published first.');
      return false;
    }

    // Validation B3: Validation status check
    if (draft.audit.validationStatus != 'success') {
      print('PROMOTION DENIED: Blueprint validation failed.');
      return false;
    }

    try {
      // Promotion B4: Persist batchId and elevate status
      final blueprint = ExamBlueprint.fromMap(draft.rawData).copyWith(
        status: 'published',
        version: draft.audit.contentVersion,
        promotionBatchId: batchId,
      );

      await FirestoreService.uploadBlueprint(blueprint);

      // Audit Sync
      final updatedDraft = draft.copyWith(
        status: 'published',
        audit: draft.audit.copyWith(
          publishedBy: adminId,
          promotionBatchId: batchId,
          publishedAt: DateTime.now(),
        ),
      );

      await SentinelRepository.injectDrafts([updatedDraft]);
      print('PROMOTION SUCCESS: Blueprint ${blueprint.id} is now LIVE for ${recruitment.title}');
      return true;
    } catch (e) {
      print('BLUEPRINT PROMOTION FAILED: $e');
      return false;
    }
  }

  // ===================================================
  // PHASE 4E-C: MICRO NODE PROMOTION 
  // ===================================================

  /// Promotes a Micro Node Draft ensuring referential integrity with a published Blueprint.
  /// Hardened for Scenarios C1-C6.
  static Future<bool> promoteNodeToProduction({
    required SentinelDraft draft,
    required String? adminId,
    required String? batchId,
  }) async {
    // Integrity Check C1, C2: Blueprint must exist and be published
    final String blueprintId = draft.rawData['blueprintId'] ?? ''; // or extracted from DNA
    final blueprint = await FirestoreService.fetchBlueprint(blueprintId);

    if (blueprint == null || blueprint.status != 'published') {
      print('PROMOTION DENIED: Orphaned Node. Parent blueprint must be published first.');
      return false;
    }

    // Validation B3: Validation status check
    if (draft.audit.validationStatus != 'success') {
      print('PROMOTION DENIED: Node validation failed.');
      return false;
    }

    try {
      // Promotion C5: Persist batchId and elevate status
      final node = MicroTopicNode.fromMap(draft.rawData).copyWith(
        status: 'published',
        promotionBatchId: batchId,
      );

      // C4: Duplicate Node Defense (Idempotent merge by ID)
      await FirestoreService.uploadNode(node);

      // Audit Sync
      final updatedDraft = draft.copyWith(
        status: 'published',
        audit: draft.audit.copyWith(
          publishedBy: adminId,
          promotionBatchId: batchId,
          publishedAt: DateTime.now(),
        ),
      );

      await SentinelRepository.injectDrafts([updatedDraft]);
      print('PROMOTION SUCCESS: Node ${node.id} (${node.title}) is now LIVE.');
      return true;
    } catch (e) {
      print('NODE PROMOTION FAILED: $e');
      return false;
    }
  }

  // ===================================================
  // PHASE 4E-D: QUESTION PROMOTION 
  // ===================================================

  /// Promotes an Assessment Evidence Draft to a Production Question.
  static Future<bool> promoteQuestionToProduction({
    required SentinelDraft draft,
    required String? adminId,
  }) async {
    if (draft.audit.validationStatus != 'success') return false;

    try {
      final question = QuestionModel.fromMap(draft.rawData).copyWith(
        status: 'published',
        verifiedBy: adminId,
        verifiedAt: DateTime.now(),
      );

      await QuestionRepository.save(question);

      final updatedDraft = draft.copyWith(
        status: 'published',
        audit: draft.audit.copyWith(
          publishedBy: adminId,
          publishedAt: DateTime.now(),
        ),
      );

      await SentinelRepository.injectDrafts([updatedDraft]);
      return true;
    } catch (e) {
      print('QUESTION PROMOTION FAILED: $e');
      return false;
    }
  }

  // ===================================================
  // PHASE 4E-E: DIGIBOOK BLOCK PROMOTION 
  // ===================================================

  /// Promotes a DigiBook Block Draft to Production.
  static Future<bool> promoteDigiBookToProduction({
    required SentinelDraft draft,
    required String? adminId,
  }) async {
    if (draft.audit.validationStatus != 'success') return false;

    try {
      final block = DigiBookBlock.fromMap(draft.rawData).copyWith(
        status: 'published',
        verifiedBy: adminId,
        verifiedAt: DateTime.now(),
      );

      await DigiBookRepository.saveBlock(block);

      final updatedDraft = draft.copyWith(
        status: 'published',
        audit: draft.audit.copyWith(
          publishedBy: adminId,
          publishedAt: DateTime.now(),
        ),
      );

      await SentinelRepository.injectDrafts([updatedDraft]);
      return true;
    } catch (e) {
      print('DIGIBOOK PROMOTION FAILED: $e');
      return false;
    }
  }
}
