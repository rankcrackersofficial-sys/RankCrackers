import 'package:equatable/equatable.dart';

/// Subject Teacher Authority pure model.
class SubjectTeacherAuthority extends Equatable {
  final String teacherAuthorityId;
  final String version;
  final String subjectId;
  final String? missionId; // optional scope justification
  final bool isActive;
  final String status; // 'active', 'revoked'

  const SubjectTeacherAuthority({
    required this.teacherAuthorityId,
    required this.version,
    required this.subjectId,
    this.missionId,
    required this.isActive,
    required this.status,
  });

  Map<String, dynamic> toMap() => {
        'teacherAuthorityId': teacherAuthorityId,
        'version': version,
        'subjectId': subjectId,
        'missionId': missionId,
        'isActive': isActive,
        'status': status,
      };

  String canonicalString() {
    return 'teacherAuthorityId:$teacherAuthorityId|version:$version|subjectId:$subjectId|missionId:${missionId ?? ""}|isActive:$isActive|status:$status';
  }

  @override
  List<Object?> get props => [
        teacherAuthorityId,
        version,
        subjectId,
        missionId,
        isActive,
        status,
      ];
}
