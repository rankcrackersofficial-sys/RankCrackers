import 'package:equatable/equatable.dart';

/// 🔱 TRANSFORMATION LINEAGE (Document 50J Article 4.1)
/// Records each transformation step in the refinery pipeline.
/// Enables full auditability from Question back to Source Document.
class TransformationLineage extends Equatable {
  final String id;
  final String inputCollection; 
  final String inputId; 
  final String outputCollection; 
  final List<String> outputIds; // 🔱 Batch Support (Audit Finding 4)
  final String workerId; 
  final String promptVersion;
  final TransformationType type;
  final DateTime timestamp;

  const TransformationLineage({
    required this.id,
    required this.inputCollection,
    required this.inputId,
    required this.outputCollection,
    required this.outputIds,
    required this.workerId,
    required this.promptVersion,
    required this.type,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'inputCollection': inputCollection,
      'inputId': inputId,
      'outputCollection': outputCollection,
      'outputIds': outputIds,
      'workerId': workerId,
      'promptVersion': promptVersion,
      'type': type.name,
      'timestamp': timestamp.millisecondsSinceEpoch,
    };
  }

  factory TransformationLineage.fromMap(Map<String, dynamic> map) {
    return TransformationLineage(
      id: map['id'] ?? '',
      inputCollection: map['inputCollection'] ?? '',
      inputId: map['inputId'] ?? '',
      outputCollection: map['outputCollection'] ?? '',
      outputIds: List<String>.from(map['outputIds'] ?? []),
      workerId: map['workerId'] ?? '',
      promptVersion: map['promptVersion'] ?? '1.0.0',
      type: TransformationType.values.firstWhere(
        (e) => e.name == (map['type'] ?? 'extraction'),
        orElse: () => TransformationType.extraction,
      ),
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] ?? 0),
    );
  }

  @override
  List<Object?> get props => [id, inputId, outputIds, type];
}

enum TransformationType {
  parsing,      // Raw File -> Text/JSON
  segmentation, // Text -> Semantic Units
  extraction,   // Units -> Atomic Facts (SVO)
  linking,      // Facts -> Fact Relationships
  intelligence, // Fact -> Difficulty/Importance Scoring
  assembly,     // Facts -> Payload/DigiBook
}
