import 'package:equatable/equatable.dart';

/// MISSION VARIANT
/// Defines a specific sub-target within a parent recruitment (e.g., Subject-wise papers).
/// Implements Document 26 Section 30.
class MissionVariant extends Equatable {
  final String id;
  final String name;
  final String parentRecruitmentId;
  final String examBlueprintId;
  final String status; // draft, review, verified, published, archived
  final int version;

  const MissionVariant({
    required this.id,
    required this.name,
    required this.parentRecruitmentId,
    required this.examBlueprintId,
    this.status = 'draft',
    this.version = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'parentRecruitmentId': parentRecruitmentId,
      'examBlueprintId': examBlueprintId,
      'status': status,
      'version': version,
    };
  }

  factory MissionVariant.fromMap(Map<String, dynamic> map) {
    return MissionVariant(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      parentRecruitmentId: map['parentRecruitmentId'] ?? '',
      examBlueprintId: map['examBlueprintId'] ?? '',
      status: map['status'] ?? 'draft',
      version: map['version'] ?? 1,
    );
  }

  @override
  List<Object?> get props => [id, name, parentRecruitmentId, examBlueprintId, status, version];
}
