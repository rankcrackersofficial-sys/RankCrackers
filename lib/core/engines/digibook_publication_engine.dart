import '../../features/digibook/models/digibook_content.dart';
import '../models/digibook_block.dart';
import '../models/atomic_fact.dart';
import '../models/question_model.dart';
import '../models/micro_topic_node.dart';

/// PAYLOAD ASSEMBLY RESULT
/// Bundles the delivery payload with its sovereign audit record.
class PayloadAssemblyResult {
  final DigiBookContent payload;
  final Map<String, dynamic> audit;
  PayloadAssemblyResult({required this.payload, required this.audit});
}

/// DIGIBOOK PUBLICATION ENGINE (v2.2 - Human-Centered Factory)
/// Sovereign authority for aggregating and auditing heavy truth payloads.
class DigiBookPublicationEngine {
  
  /// PEDAGOGICAL SEQUENCE CONTRACT
  static const List<String> pedagogicalOrder = [
    'refresher',
    'intuition',
    'core_concept',
    'explanation',
    'diagram',
    'formula',
    'example',
    'misconception',
    'pyq',
    'checkpoint',
    'quick_revision',
  ];

  /// ASSEMBLE & AUDIT
  /// Aggregates only VERIFIED blocks in strict pedagogical order.
  static PayloadAssemblyResult assemble({
    required MicroTopicNode node,
    required List<DigiBookBlock> blocks,
    required String adminId,
    String version = '1.0.0',
    List<QuestionModel> easyMcqs = const [],
    List<QuestionModel> mediumMcqs = const [],
    List<QuestionModel> hardMcqs = const [],
  }) {
    // FLAG-1: Referential Integrity Enforcement
    if (node.contentRegistryId != 'payload_${node.id}') {
      throw Exception("CONSTITUTIONAL VIOLATION: Registry Integrity Broken for ${node.id}. Expected 'payload_${node.id}', found '${node.contentRegistryId}'");
    }

    // GAP-1: Verification Filter
    final verifiedBlocks = blocks.where((b) => 
      b.status == 'verified' && b.verifiedBy != null
    ).toList();
    
    // FLAG-2: Empty Payload Prevention
    if (verifiedBlocks.isEmpty) {
      throw Exception("PUBLICATION BLOCKED: No verified atoms found for Node ${node.id}. Truth cannot be empty.");
    }

    // HUMAN-CENTERED SORTING
    verifiedBlocks.sort((a, b) {
      int indexA = pedagogicalOrder.indexOf(a.type);
      int indexB = pedagogicalOrder.indexOf(b.type);
      if (indexA == -1) indexA = 99; // Unknown types at end
      if (indexB == -1) indexB = 99;
      return indexA.compareTo(indexB);
    });

    String beginner = "";
    String intermediate = "";
    String pro = "";
    String academic = "";
    List<String> oneLiners = [];
    List<String> revisionPoints = [];
    List<String> pyqStrings = [];

    // G4: Source Aggregation
    final Set<String> sourceFactIds = {};
    final Set<String> sourceDocumentIds = {};

    for (final block in verifiedBlocks) {
      sourceFactIds.addAll(block.sourceFactIds);
      if (block.sourceDocumentId != null) sourceDocumentIds.add(block.sourceDocumentId!);

      // Legacy & New Type Mapping
      switch (block.type) {
        case 'refresher':
        case 'brief_note':
          beginner += "### Refresher\n${block.content}\n\n";
          break;
        case 'intuition':
          beginner += "### Intuition\n${block.content}\n\n";
          break;
        case 'core_concept':
        case 'concept_note':
          pro += "### Core Concept\n${block.content}\n\n";
          break;
        case 'explanation':
          intermediate += "### Explanation\n${block.content}\n\n";
          break;
        case 'diagram':
          academic += "### Diagram Context\n${block.content}\n\n";
          break;
        case 'formula':
          pro += "### Formula\n${block.content}\n\n";
          break;
        case 'example':
          intermediate += "### Example\n${block.content}\n\n";
          break;
        case 'misconception':
          pro += "### Common Misconception\n${block.content}\n\n";
          break;
        case 'pyq':
          pyqStrings.add(block.content);
          break;
        case 'checkpoint':
          intermediate += "### Checkpoint\n${block.content}\n\n";
          break;
        case 'quick_revision':
        case 'memory_aid':
          revisionPoints.add(block.content);
          break;
        case 'one_liner':
          oneLiners.add(block.content);
          break;
      }
    }

    if (intermediate.isEmpty) intermediate = beginner;
    if (pro.isEmpty) pro = intermediate;
    if (academic.isEmpty) academic = pro;

    // HARDENED AUDIT (G4 Alignment)
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
      academicContent: academic.trim(),
      facts: const [], // Note: facts list in content is legacy; we use sourceAtomicFactIds in audit now
      oneLiners: oneLiners,
      revisionPoints: revisionPoints,
      easyMcqs: easyMcqs,
      mediumMcqs: mediumMcqs,
      hardMcqs: hardMcqs,
      pyqs: pyqStrings,
      publicationAudit: audit,
    );

    return PayloadAssemblyResult(payload: payload, audit: audit);
  }
}
