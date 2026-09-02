import 'package:equatable/equatable.dart';

/// 🔱 EDUCATION RECORD (Document 50A Phase 8)
/// Represents a structured point in a student's academic history.
class EducationRecord extends Equatable {
  final String id;
  final String level; // Class 10, Class 12, Bachelor's, Master's, etc.
  final String? boardOrInstitution;
  final String? stream; // PCB, PCM, Commerce, etc.
  final String? degreeId; // btech, bsc, ba
  final String? specializationId;
  final String status; // Completed, Pursuing
  final String? completionYear;
  final List<String> subjectIds;

  const EducationRecord({
    required this.id,
    required this.level,
    this.boardOrInstitution,
    this.stream,
    this.degreeId,
    this.specializationId,
    required this.status,
    this.completionYear,
    this.subjectIds = const [],
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'level': level,
      'boardOrInstitution': boardOrInstitution,
      'stream': stream,
      'degreeId': degreeId,
      'specializationId': specializationId,
      'status': status,
      'completionYear': completionYear,
      'subjectIds': subjectIds,
    };
  }

  factory EducationRecord.fromMap(Map<String, dynamic> map) {
    return EducationRecord(
      id: map['id'] ?? '',
      level: map['level'] ?? '',
      boardOrInstitution: map['boardOrInstitution'],
      stream: map['stream'],
      degreeId: map['degreeId'],
      specializationId: map['specializationId'],
      status: map['status'] ?? 'Completed',
      completionYear: map['completionYear'],
      subjectIds: List<String>.from(map['subjectIds'] ?? []),
    );
  }

  @override
  List<Object?> get props => [
    id, level, stream, degreeId, status, completionYear, subjectIds
  ];
}
