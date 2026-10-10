import 'package:equatable/equatable.dart';

/// SEMANTIC UNIT (Document 50J Article 1.1)
/// The structural atom of a source document. 
/// Precedes Atomic Fact extraction in the Refinery Pipeline.
class SemanticUnit extends Equatable {
  final String id; 
  final String sourceDocumentId; // Reference to ingestion_refinery ID (hash)
  final int pageNumber;
  final String sectionHeading;
  final String rawText;
  final SemanticType semanticType;
  final int structureIndex; // Sequential order in source
  
  // Sizing (Audit Finding 3)
  final int tokenCount;
  final int charCount;

  // Metadata & Lineage (Amended 50J)
  final String workerVersion;
  final String promptVersion;
  final String? lineageId; // Reference to transformation_lineage record

  const SemanticUnit({
    required this.id,
    required this.sourceDocumentId,
    required this.pageNumber,
    required this.sectionHeading,
    required this.rawText,
    required this.semanticType,
    required this.structureIndex,
    this.tokenCount = 0,
    this.charCount = 0,
    required this.workerVersion,
    required this.promptVersion,
    this.lineageId,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sourceDocumentId': sourceDocumentId,
      'pageNumber': pageNumber,
      'sectionHeading': sectionHeading,
      'rawText': rawText,
      'semanticType': semanticType.name,
      'structureIndex': structureIndex,
      'tokenCount': tokenCount,
      'charCount': charCount,
      'workerVersion': workerVersion,
      'promptVersion': promptVersion,
      'lineageId': lineageId,
    };
  }

  factory SemanticUnit.fromMap(Map<String, dynamic> map) {
    return SemanticUnit(
      id: map['id'] ?? '',
      sourceDocumentId: map['sourceDocumentId'] ?? '',
      pageNumber: map['pageNumber'] ?? 0,
      sectionHeading: map['sectionHeading'] ?? '',
      rawText: map['rawText'] ?? '',
      semanticType: SemanticType.values.firstWhere(
        (e) => e.name == (map['semanticType'] ?? 'paragraph'),
        orElse: () => SemanticType.paragraph,
      ),
      structureIndex: map['structureIndex'] ?? 0,
      tokenCount: map['tokenCount'] ?? 0,
      charCount: map['charCount'] ?? 0,
      workerVersion: map['workerVersion'] ?? '1.0.0',
      promptVersion: map['promptVersion'] ?? '1.0.0',
      lineageId: map['lineageId'],
    );
  }

  @override
  List<Object?> get props => [id, sourceDocumentId, structureIndex, semanticType];
}

enum SemanticType {
  paragraph,
  table_row,
  heading,
  footnote,
  list_item,
  image_caption,
  annexure,
}
