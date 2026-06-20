import 'dart:convert';
import 'package:equatable/equatable.dart';

/// 🔱 ATOMIC FACT v2.1 (Document 50J Article 1.2 & 1.7 Amended)
/// Smallest machine-reasoning truth unit using SVO structure.
class AtomicFact extends Equatable {
  // Layer 1: Identity & Lineage
  final String id;
  final String sourceDocumentId;
  final String derivedFromUnitId;
  final String? lineageId; // Reference to transformation_lineage
  final int factVersion;

  // Layer 2: SVO Core (The Atomic Truth)
  final String subject;
  final String predicate;
  final String object;
  final String? context; // Qualifiers (e.g., "In Rajasthan")

  // Layer 3: Intelligence & Taxonomy
  final FactType factType;
  final double confidence; // 0.0 - 1.0
  final int difficulty; // 1-5
  final int importance; // 1-10
  final bool isCore;

  // Layer 4: Universal Metadata (Amendment 50J-B)
  final String schemaVersion;
  final String workerVersion;
  final String promptVersion;
  final String sourceHash;

  const AtomicFact({
    required this.id,
    required this.sourceDocumentId,
    required this.derivedFromUnitId,
    this.lineageId,
    this.factVersion = 1,
    required this.subject,
    required this.predicate,
    required this.object,
    this.context,
    required this.factType,
    this.confidence = 1.0,
    required this.difficulty,
    required this.importance,
    required this.isCore,
    this.schemaVersion = '1.1.0',
    required this.workerVersion,
    required this.promptVersion,
    required this.sourceHash,
  });

  /// 🔱 DERIVED STATEMENT (Article 5 Amendment)
  /// Subject + Predicate + Object = Natural Language Truth
  String get statement => '$subject $predicate $object${context != null ? " ($context)" : ""}';

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sourceDocumentId': sourceDocumentId,
      'derivedFromUnitId': derivedFromUnitId,
      'lineageId': lineageId,
      'factVersion': factVersion,
      'subject': subject,
      'predicate': predicate,
      'object': object,
      'context': context,
      'factType': factType.name,
      'confidence': confidence,
      'difficulty': difficulty,
      'importance': importance,
      'isCore': isCore,
      'schemaVersion': schemaVersion,
      'workerVersion': workerVersion,
      'promptVersion': promptVersion,
      'sourceHash': sourceHash,
    };
  }

  factory AtomicFact.fromMap(Map<String, dynamic> map) {
    return AtomicFact(
      id: map['id'] ?? '',
      sourceDocumentId: map['sourceDocumentId'] ?? '',
      derivedFromUnitId: map['derivedFromUnitId'] ?? '',
      lineageId: map['lineageId'],
      factVersion: map['factVersion'] ?? 1,
      subject: map['subject'] ?? '',
      predicate: map['predicate'] ?? '',
      object: map['object'] ?? '',
      context: map['context'],
      factType: FactType.values.firstWhere(
        (e) => e.name == (map['factType'] ?? 'fact'),
        orElse: () => FactType.fact,
      ),
      confidence: (map['confidence'] ?? 1.0).toDouble(),
      difficulty: map['difficulty'] ?? 3,
      importance: map['importance'] ?? 5,
      isCore: map['isCore'] ?? true,
      schemaVersion: map['schemaVersion'] ?? '1.1.0',
      workerVersion: map['workerVersion'] ?? '1.0.0',
      promptVersion: map['promptVersion'] ?? '1.0.0',
      sourceHash: map['sourceHash'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory AtomicFact.fromJson(String source) =>
      AtomicFact.fromMap(json.decode(source));

  @override
  List<Object?> get props => [id, subject, predicate, object, factVersion];
}

enum FactType {
  definition,
  rule,
  date,
  formula,
  eligibility,
  fact,
  exception,
  instruction,
}
