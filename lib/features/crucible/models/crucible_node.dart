import 'package:equatable/equatable.dart';
import '../../../core/models/canonical_academic_ref.dart';

/// CRUCIBLE NODE (Blueprint v1.0)
/// Law: 1 Atomic Topic -> 1 DigiBook Unit -> N Crucible Nodes
class CrucibleNode extends Equatable {
  final String id;
  final String realmId;
  final String atomicTopicId;
  final String digibookUnitId;

  final String nodeType; // MCQ, ASSERTION_REASON, CONCEPT_TRAP, REVISION, DIAGNOSTIC
  final int difficulty; // 1-5
  final double confidence; // AI extraction confidence
  
  final List<String> pyqIds; // Linked PYQs for this specific assessment
  final bool founderVerified;
  final Map<String, dynamic> content; // The actual assessment payload (question, options, etc.)

  const CrucibleNode({
    required this.id,
    required this.realmId,
    required this.atomicTopicId,
    required this.digibookUnitId,
    required this.nodeType,
    this.difficulty = 3,
    this.confidence = 0.0,
    this.pyqIds = const [],
    this.founderVerified = false,
    this.content = const {},
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'realm_id': realmId,
      'atomic_topic_id': atomicTopicId,
      'digibook_unit_id': digibookUnitId,
      'node_type': nodeType,
      'difficulty': difficulty,
      'confidence': confidence,
      'pyq_ids': pyqIds,
      'founder_verified': founderVerified,
      'content': content,
    };
  }

  factory CrucibleNode.fromMap(Map<String, dynamic> map) {
    return CrucibleNode(
      id: map['id'] ?? '',
      realmId: map['realm_id'] ?? '',
      atomicTopicId: map['atomic_topic_id'] ?? '',
      digibookUnitId: map['digibook_unit_id'] ?? '',
      nodeType: map['node_type'] ?? 'MCQ',
      difficulty: map['difficulty'] ?? 3,
      confidence: (map['confidence'] ?? 0.0).toDouble(),
      pyqIds: List<String>.from(map['pyq_ids'] ?? []),
      founderVerified: map['founder_verified'] ?? false,
      content: Map<String, dynamic>.from(map['content'] ?? {}),
    );
  }

  /// Canonical Academic Reference adapter for universal routing
  CanonicalAcademicRef get canonicalRef => CanonicalAcademicRef(
        canonicalMissionId: realmId,
        canonicalNodeId: atomicTopicId,
        generationUnitId: digibookUnitId.isNotEmpty ? digibookUnitId : atomicTopicId,
        atomicFactIds: const [],
      );

  @override
  List<Object?> get props => [id, realmId, atomicTopicId, digibookUnitId, nodeType, founderVerified];
}
