import '../../features/digibook/models/digibook_content.dart';
import '../models/digibook_block.dart';
import '../models/atomic_fact.dart';
import '../models/question_model.dart';
import '../models/micro_topic_node.dart';

/// 🔱 PAYLOAD ASSEMBLY RESULT
/// Bundles the delivery payload with its sovereign audit record.
class PayloadAssemblyResult {
  final DigiBookContent payload;
  final Map<String, dynamic> audit;
  PayloadAssemblyResult({required this.payload, required this.audit});
}

/// 🔱 DIGIBOOK PUBLICATION ENGINE (v2.1 - Hardened Audit G4)
/// Sovereign authority for aggregating and auditing heavy truth payloads.
class DigiBookPublicationEngine {
  
  /// 🔱 ASSEMBLE & AUDIT
  /// Aggregates only VERIFIED blocks and generates a traceable audit record.
  static PayloadAssemblyResult assemble({
    required MicroTopicNode node,
    required List<DigiBookBlock> blocks,
    required String adminId,
    String version = '1.0.0',
    List<QuestionModel> easyMcqs = const [],
    List<QuestionModel> mediumMcqs = const [],
    List<QuestionModel> hardMcqs = const [],
  }) {
    // 🔱 FLAG-1: Referential Integrity Enforcement
    if (node.contentRegistryId != 'payload_${node.id}') {
      throw Exception("CONSTITUTIONAL VIOLATION: Registry Integrity Broken for ${node.id}. Expected 'payload_${node.id}', found '${node.contentRegistryId}'");
    }

    // 🔱 GAP-1: Verification Filter
    final verifiedBlocks = blocks.where((b) => 
      b.status == 'verified' && b.verifiedBy != null
    ).toList();
    
    // 🔱 FLAG-2: Empty Payload Prevention
    if (verifiedBlocks.isEmpty) {
      throw Exception("PUBLICATION BLOCKED: No verified atoms found for Node ${node.id}. Truth cannot be empty.");
    }

    String beginner = "";
    String intermediate = "";
    String pro = "";
    List<String> oneLiners = [];
    List<String> revisionPoints = [];
    
    // 🔱 G4: Source Aggregation
    final Set<String> sourceFactIds = {};
    final Set<String> sourceDocumentIds = {};

    for (final block in verifiedBlocks) {
      sourceFactIds.addAll(block.sourceFactIds);
      if (block.sourceDocumentId != null) sourceDocumentIds.add(block.sourceDocumentId!);

      switch (block.type) {
        case 'brief_note':
          beginner += "${block.content}\n\n";
          break;
        case 'concept_note':
          pro += "${block.content}\n\n";
          break;
        case 'one_liner':
          oneLiners.add(block.content);
          break;
        case 'memory_aid':
          revisionPoints.add(block.content);
          break;
        case 'example':
          intermediate += "Example: ${block.content}\n\n";
          break;
      }
    }

    if (intermediate.isEmpty) intermediate = beginner;

    // 🔱 HARDENED AUDIT (G4 Alignment)
    final audit = {
      'id': 'audit_${node.id}_v$version',
      'payloadId': node.contentRegistryId,
      'nodeId': node.id,
      'sourceBlockIds': verifiedBlocks.map((b) => b.id).toList(),
      'sourceAtomicFactIds': sourceFactIds.toList(),
      'sourceDocumentIds': sourceDocumentIds.toList(),
      'assembledBy': adminId,
      'assembledAt': DateTime.now().millisecondsSinceEpoch,
      'version': version,
      'status': 'published',
    };

    final payload = DigiBookContent(
      nodeId: node.id,
      beginnerContent: beginner.trim(),
      intermediateContent: intermediate.trim(),
      proContent: pro.trim(),
      academicContent: "",
      facts: const [], // 🔱 Note: facts list in content is legacy; we use sourceAtomicFactIds in audit now
      oneLiners: oneLiners,
      revisionPoints: revisionPoints,
      easyMcqs: easyMcqs,
      mediumMcqs: mediumMcqs,
      hardMcqs: hardMcqs,
      pyqs: const [],
      publicationAudit: audit,
    );

    return PayloadAssemblyResult(payload: payload, audit: audit);
  }
}
