import 'package:equatable/equatable.dart';

/// VERIFICATION CANDIDATE (Document 50I-B Audit Finding 2)
/// Aggregated refinery output waiting for Sentinel review.
class VerificationCandidate extends Equatable {
  final String id;
  final String sourceDocumentId;
  final List<String> semanticUnitIds;
  final List<String> atomicFactIds;
  final List<String> relationshipIds;
  final List<String> intelligenceIds;
  
  final String status; // pending, under_review, verified, rejected
  final DateTime createdAt;
  final String workerVersion;

  const VerificationCandidate({
    required this.id,
    required this.sourceDocumentId,
    this.semanticUnitIds = const [],
    this.atomicFactIds = const [],
    this.relationshipIds = const [],
    this.intelligenceIds = const [],
    this.status = 'pending',
    required this.createdAt,
    required this.workerVersion,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sourceDocumentId': sourceDocumentId,
      'semanticUnitIds': semanticUnitIds,
      'atomicFactIds': atomicFactIds,
      'relationshipIds': relationshipIds,
      'intelligenceIds': intelligenceIds,
      'status': status,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'workerVersion': workerVersion,
    };
  }

  factory VerificationCandidate.fromMap(Map<String, dynamic> map) {
    return VerificationCandidate(
      id: map['id'] ?? '',
      sourceDocumentId: map['sourceDocumentId'] ?? '',
      semanticUnitIds: List<String>.from(map['semanticUnitIds'] ?? []),
      atomicFactIds: List<String>.from(map['atomicFactIds'] ?? []),
      relationshipIds: List<String>.from(map['relationshipIds'] ?? []),
      intelligenceIds: List<String>.from(map['intelligenceIds'] ?? []),
      status: map['status'] ?? 'pending',
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt'] ?? 0),
      workerVersion: map['workerVersion'] ?? '1.0.0',
    );
  }

  @override
  List<Object?> get props => [id, sourceDocumentId, status];
}
