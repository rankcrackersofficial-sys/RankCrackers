import 'package:equatable/equatable.dart';

/// 🔱 INGESTION RECORD (Hardened v8.2.6)
/// Tracks the physical entry of a source file into the refinery with full metadata.
class IngestionRecord extends Equatable {
  final String id;
  final String fileName;
  final String fileType; 
  final String mimeType;
  final int fileSize;
  final String fileHash; 
  final String status; 
  final String? sourceUrl;
  final String? storagePath; // 🔱 Added: Physical Traceability for Purge
  final DateTime createdAt;
  
  // 🔱 Governance Fields (Constitution v1.0)
  final bool archived;
  final DateTime? archivedAt;
  final String? archivedBy;
  
  // 🔱 Metadata Pipeline (Audit P12H)
  final String assetType; // notification, syllabus, pyq, study_material
  final String recruitmentId;
  final String documentStatus; // LIVE, HISTORICAL
  
  final Map<String, dynamic> metadata;
  final Map<String, dynamic> extraMetadata;

  const IngestionRecord({
    required this.id,
    required this.fileName,
    required this.fileType,
    required this.mimeType,
    required this.fileSize,
    required this.fileHash,
    required this.status,
    this.sourceUrl,
    this.storagePath,
    required this.createdAt,
    this.archived = false,
    this.archivedAt,
    this.archivedBy,
    this.assetType = 'unknown',
    this.recruitmentId = 'unmapped',
    this.documentStatus = 'LIVE',
    this.metadata = const {},
    this.extraMetadata = const {},
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'fileName': fileName,
      'fileType': fileType,
      'mimeType': mimeType,
      'fileSize': fileSize,
      'fileHash': fileHash,
      'status': status,
      'sourceUrl': sourceUrl,
      'storagePath': storagePath,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'archived': archived,
      'archivedAt': archivedAt?.millisecondsSinceEpoch,
      'archivedBy': archivedBy,
      'assetType': assetType,
      'recruitmentId': recruitmentId,
      'documentStatus': documentStatus,
      'metadata': metadata,
      'extraMetadata': extraMetadata,
    };
  }

  factory IngestionRecord.fromMap(Map<String, dynamic> map) {
    return IngestionRecord(
      id: map['id'] ?? '',
      fileName: map['fileName'] ?? '',
      fileType: map['fileType'] ?? '',
      mimeType: map['mimeType'] ?? '',
      fileSize: map['fileSize'] ?? 0,
      fileHash: map['fileHash'] ?? '',
      status: map['status'] ?? 'received',
      sourceUrl: map['sourceUrl'],
      storagePath: map['storagePath'],
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt'] ?? 0),
      archived: map['archived'] ?? false,
      archivedAt: map['archivedAt'] != null 
          ? DateTime.fromMillisecondsSinceEpoch(map['archivedAt']) 
          : null,
      archivedBy: map['archivedBy'],
      assetType: map['assetType'] ?? 'unknown',
      recruitmentId: map['recruitmentId'] ?? 'unmapped',
      documentStatus: map['documentStatus'] ?? 'LIVE',
      metadata: Map<String, dynamic>.from(map['metadata'] ?? {}),
      extraMetadata: Map<String, dynamic>.from(map['extraMetadata'] ?? {}),
    );
  }

  @override
  List<Object?> get props => [id, fileName, fileHash, status, assetType, recruitmentId];
}
