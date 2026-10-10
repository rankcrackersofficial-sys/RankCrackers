import 'package:flutter/foundation.dart';
import '../../models/sentinel_draft.dart';
import '../../models/audit_record.dart';
import '../../backend/sentinel_repository.dart';

/// NODE FACTORY WORKER
/// Implements the Structural Authority: AI maps nodes, Humans verify them.
class NodeFactoryWorker {
  
  /// NODE ASSEMBLY PROTOCOL
  /// Transforms raw syllabus extraction into a structured MicroTopicNode Draft.
  static Future<void> assembleNode({
    required String sourceId,
    required Map<String, dynamic> rawNodeData,
    required String workerVersion,
  }) async {
    debugPrint("NODE WORKER: Assembling structure for $sourceId");

    // 1. Map to Sentinel Draft
    final draft = SentinelDraft(
      id: 'node_draft_${DateTime.now().millisecondsSinceEpoch}_$sourceId',
      type: 'node_structure',
      rawData: rawNodeData,
      status: 'draft', 
      audit: AuditRecord(
        sourceUrl: 'rc://refinery/syllabus/$sourceId',
        sourceHash: 'node_hash_${rawNodeData.hashCode}',
        documentHash: 'node_doc_${rawNodeData.toString().hashCode}',
        validationStatus: 'pending',
        workerVersion: workerVersion,
        provider: 'unknown',
        discoveryCount: 1,
        createdAt: DateTime.now(),
        discoveredAt: DateTime.now(),
        lastSeenAt: DateTime.now(),
      ),
    );

    // 2. Isolated Injection
    await SentinelRepository.injectDrafts([draft]);
    
    debugPrint("NODE WORKER: Assembly complete. Node structure isolated for verification.");
  }
}
