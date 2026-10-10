import 'package:equatable/equatable.dart';

/// DIGIBOOK UNIT (Blueprint v1.2 - Hardened Audit Fix)
/// Law: 1 Atomic Topic = 1 DigiBook Unit
class DigiBookUnit extends Equatable {
  final String id;
  final String atomicTopicId; // Mandatory Syllabus Mapping
  final String chapterId;
  final String realmId;
  
  final String concept;
  final String definition;
  final String explanation;
  final List<String> examples;
  final List<String> keywords;

  // PYQ LINKAGE (GAP-2)
  final List<String> pyqIds;
  final int pyqCount;
  final double pyqWeightage;
  
  // CRUCIBLE DEPENDENCY (GAP-5)
  final bool crucibleMapped;
  final List<String> crucibleNodeIds;

  final int difficulty; // 1-5
  final String status; // draft, under_review, verified, published
  final int version;

  const DigiBookUnit({
    required this.id,
    required this.atomicTopicId,
    required this.chapterId,
    required this.realmId,
    required this.concept,
    required this.definition,
    required this.explanation,
    this.examples = const [],
    this.keywords = const [],
    this.pyqIds = const [],
    this.pyqCount = 0,
    this.pyqWeightage = 0.0,
    this.crucibleMapped = false,
    this.crucibleNodeIds = const [],
    this.difficulty = 3,
    this.status = 'draft',
    this.version = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'atomic_topic_id': atomicTopicId,
      'chapter_id': chapterId,
      'realm_id': realmId,
      'concept': concept,
      'definition': definition,
      'explanation': explanation,
      'examples': examples,
      'keywords': keywords,
      'pyq_ids': pyqIds,
      'pyq_count': pyqCount,
      'pyq_weightage': pyqWeightage,
      'crucible_mapped': crucibleMapped,
      'crucible_node_ids': crucibleNodeIds,
      'difficulty': difficulty,
      'status': status,
      'version': version,
    };
  }

  factory DigiBookUnit.fromMap(Map<String, dynamic> map) {
    return DigiBookUnit(
      id: map['id'] ?? '',
      atomicTopicId: map['atomic_topic_id'] ?? '',
      chapterId: map['chapter_id'] ?? '',
      realmId: map['realm_id'] ?? '',
      concept: map['concept'] ?? '',
      definition: map['definition'] ?? '',
      explanation: map['explanation'] ?? '',
      examples: List<String>.from(map['examples'] ?? []),
      keywords: List<String>.from(map['keywords'] ?? []),
      pyqIds: List<String>.from(map['pyq_ids'] ?? []),
      pyqCount: map['pyq_count'] ?? 0,
      pyqWeightage: (map['pyq_weightage'] ?? 0.0).toDouble(),
      crucibleMapped: map['crucible_mapped'] ?? false,
      crucibleNodeIds: List<String>.from(map['crucible_node_ids'] ?? []),
      difficulty: map['difficulty'] ?? 3,
      status: map['status'] ?? 'draft',
      version: map['version'] ?? 1,
    );
  }

  @override
  List<Object?> get props => [id, atomicTopicId, chapterId, realmId, status, version];
}
