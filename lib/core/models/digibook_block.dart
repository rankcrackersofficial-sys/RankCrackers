import 'package:equatable/equatable.dart';

/// 🔱 DIGIBOOK BLOCK (v2.1 Hardened - Source Traceability)
/// A granular unit of learning material mapped to an Atomic Topic.
class DigiBookBlock extends Equatable {
  final String id;
  final String atomicTopicId;
  final String type; // brief_note, one_liner, concept_note, example, memory_aid, pyq
  final String content;
  final String? contentHindi;
  
  // 🔱 GOVERNANCE FIELDS
  final String status; // draft, review, verified, published, archived
  final int version;
  final String lastAdminId;
  final String lastAction;
  final DateTime updatedAt;
  final String? verifiedBy;
  final DateTime? verifiedAt;

  // 🔱 TRACEABILITY FIELDS (G4 Alignment)
  final List<String> sourceFactIds;
  final String? sourceDocumentId;
  final String? examId; // 🔱 Added: Mission Isolation

  const DigiBookBlock({
    required this.id,
    required this.atomicTopicId,
    required this.type,
    required this.content,
    this.contentHindi,
    this.status = 'draft',
    this.version = 1,
    this.lastAdminId = 'system',
    this.lastAction = 'created',
    required this.updatedAt,
    this.verifiedBy,
    this.verifiedAt,
    this.sourceFactIds = const [],
    this.sourceDocumentId,
    this.examId,
  });

  DigiBookBlock copyWith({
    String? id,
    String? atomicTopicId,
    String? type,
    String? content,
    String? contentHindi,
    String? status,
    int? version,
    String? lastAdminId,
    String? lastAction,
    DateTime? updatedAt,
    String? verifiedBy,
    DateTime? verifiedAt,
    List<String>? sourceFactIds,
    String? sourceDocumentId,
  }) {
    return DigiBookBlock(
      id: id ?? this.id,
      atomicTopicId: atomicTopicId ?? this.atomicTopicId,
      type: type ?? this.type,
      content: content ?? this.content,
      contentHindi: contentHindi ?? this.contentHindi,
      status: status ?? this.status,
      version: version ?? this.version,
      lastAdminId: lastAdminId ?? this.lastAdminId,
      lastAction: lastAction ?? this.lastAction,
      updatedAt: updatedAt ?? this.updatedAt,
      verifiedBy: verifiedBy ?? this.verifiedBy,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      sourceFactIds: sourceFactIds ?? this.sourceFactIds,
      sourceDocumentId: sourceDocumentId ?? this.sourceDocumentId,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'atomicTopicId': atomicTopicId,
      'type': type,
      'content': content,
      'contentHindi': contentHindi,
      'status': status,
      'version': version,
      'lastAdminId': lastAdminId,
      'lastAction': lastAction,
      'updatedAt': updatedAt.millisecondsSinceEpoch,
      'verifiedBy': verifiedBy,
      'verifiedAt': verifiedAt?.millisecondsSinceEpoch,
      'sourceFactIds': sourceFactIds,
      'sourceDocumentId': sourceDocumentId,
      'examId': examId,
    };
  }

  factory DigiBookBlock.fromMap(Map<String, dynamic> map) {
    return DigiBookBlock(
      id: map['id'] ?? '',
      atomicTopicId: map['atomicTopicId'] ?? '',
      type: map['type'] ?? 'brief_note',
      content: map['content'] ?? '',
      contentHindi: map['contentHindi'],
      status: map['status'] ?? 'draft',
      version: map['version'] ?? 1,
      lastAdminId: map['lastAdminId'] ?? 'system',
      lastAction: map['lastAction'] ?? 'verified',
      updatedAt: DateTime.fromMillisecondsSinceEpoch(map['updatedAt'] ?? 0),
      verifiedBy: map['verifiedBy'],
      verifiedAt: map['verifiedAt'] != null 
          ? DateTime.fromMillisecondsSinceEpoch(map['verifiedAt']) 
          : null,
      sourceFactIds: List<String>.from(map['sourceFactIds'] ?? []),
      sourceDocumentId: map['sourceDocumentId'],
      examId: map['examId'],
    );
  }

  @override
  List<Object?> get props => [
        id,
        atomicTopicId,
        type,
        content,
        contentHindi,
        status,
        version,
        lastAdminId,
        lastAction,
        updatedAt,
        verifiedBy,
        verifiedAt,
        sourceFactIds,
        sourceDocumentId,
      ];
}
