import 'package:equatable/equatable.dart';

/// DIGIBOOK REVISION (Audit GAP-4)
/// Tracks corrections made by the Founder or AI Workers to a DigiBook Unit.
class DigiBookRevision extends Equatable {
  final String revisionId;
  final String unitId;
  final String field;
  final String oldValue;
  final String newValue;
  final String authorId; // Founder or Worker ID
  final DateTime timestamp;

  const DigiBookRevision({
    required this.revisionId,
    required this.unitId,
    required this.field,
    required this.oldValue,
    required this.newValue,
    required this.authorId,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'revision_id': revisionId,
      'unit_id': unitId,
      'field': field,
      'old_value': oldValue,
      'new_value': newValue,
      'author_id': authorId,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory DigiBookRevision.fromMap(Map<String, dynamic> map) {
    return DigiBookRevision(
      revisionId: map['revision_id'] ?? '',
      unitId: map['unit_id'] ?? '',
      field: map['field'] ?? '',
      oldValue: map['old_value'] ?? '',
      newValue: map['new_value'] ?? '',
      authorId: map['author_id'] ?? '',
      timestamp: DateTime.parse(map['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [revisionId, unitId, timestamp];
}
