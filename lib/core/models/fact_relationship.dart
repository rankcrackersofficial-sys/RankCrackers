import 'package:equatable/equatable.dart';

/// FACT RELATIONSHIP (Document 50J Article 1.3)
/// Defines the connection between two Atomic Facts.
/// Building block of the Persistent Knowledge Graph.
class FactRelationship extends Equatable {
  final String id;
  final String sourceFactId;
  final String targetFactId;
  final FactRelationType type;
  final double strength; // 0.0 - 1.0 (Certainty of connection)

  // Layer 4: Universal Metadata (Amendment 50J-B & C)
  final String schemaVersion;
  final String workerVersion;
  final String promptVersion;
  final String? lineageId;

  const FactRelationship({
    required this.id,
    required this.sourceFactId,
    required this.targetFactId,
    required this.type,
    this.strength = 1.0,
    this.schemaVersion = '1.1.0',
    required this.workerVersion,
    required this.promptVersion,
    this.lineageId,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sourceFactId': sourceFactId,
      'targetFactId': targetFactId,
      'type': type.name,
      'strength': strength,
      'schemaVersion': schemaVersion,
      'workerVersion': workerVersion,
      'promptVersion': promptVersion,
      'lineageId': lineageId,
    };
  }

  factory FactRelationship.fromMap(Map<String, dynamic> map) {
    return FactRelationship(
      id: map['id'] ?? '',
      sourceFactId: map['sourceFactId'] ?? '',
      targetFactId: map['targetFactId'] ?? '',
      type: FactRelationType.values.firstWhere(
        (e) => e.name == (map['type'] ?? 'associative'),
        orElse: () => FactRelationType.associative,
      ),
      strength: (map['strength'] ?? 1.0).toDouble(),
      schemaVersion: map['schemaVersion'] ?? '1.1.0',
      workerVersion: map['workerVersion'] ?? '1.0.0',
      promptVersion: map['promptVersion'] ?? '1.0.0',
      lineageId: map['lineageId'],
    );
  }

  @override
  List<Object?> get props => [id, sourceFactId, targetFactId, type];
}

enum FactRelationType {
  prerequisite, // Fact A must be learned before Fact B
  depends_on,   // Fact B logic requires Fact A
  contradicts,  // Fact B invalidates Fact A (e.g., Amendment)
  amends,       // Fact B updates Fact A
  example_of,   // Fact B is an instance of Fact A
  associative,  // Fact A and B are related contextually
  supports,     // Fact B provides evidence for Fact A
}
