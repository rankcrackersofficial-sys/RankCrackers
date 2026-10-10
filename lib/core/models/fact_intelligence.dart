import 'package:equatable/equatable.dart';

/// FACT INTELLIGENCE (Document 50I-B Audit Finding 1)
/// Stores enriched metadata for an Atomic Fact.
/// Separated from the Fact core to maintain version lineage.
class FactIntelligence extends Equatable {
  final String id;
  final String factId;
  final int difficulty; // 1-5
  final int importance; // 1-10
  final int frequency; // 1-10
  final int riskWeight; // 1-10
  
  final String workerVersion;
  final String? lineageId;

  const FactIntelligence({
    required this.id,
    required this.factId,
    required this.difficulty,
    required this.importance,
    required this.frequency,
    required this.riskWeight,
    required this.workerVersion,
    this.lineageId,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'factId': factId,
      'difficulty': difficulty,
      'importance': importance,
      'frequency': frequency,
      'riskWeight': riskWeight,
      'workerVersion': workerVersion,
      'lineageId': lineageId,
    };
  }

  factory FactIntelligence.fromMap(Map<String, dynamic> map) {
    return FactIntelligence(
      id: map['id'] ?? '',
      factId: map['factId'] ?? '',
      difficulty: map['difficulty'] ?? 3,
      importance: map['importance'] ?? 5,
      frequency: map['frequency'] ?? 5,
      riskWeight: map['riskWeight'] ?? 5,
      workerVersion: map['workerVersion'] ?? '1.0.0',
      lineageId: map['lineageId'],
    );
  }

  @override
  List<Object?> get props => [id, factId, difficulty, importance];
}
