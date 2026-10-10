import 'package:equatable/equatable.dart';
import 'taught_content_state.dart';
import 'material_version.dart';

/// Taught Content Authority derived representation model.
class TaughtContentAuthority extends Equatable {
  final String taughtAuthorityId;
  final String executionId;
  final String missionId;
  final String subjectId;
  final String syllabusAtomId;
  final MaterialVersion materialVersion;
  final String teacherAuthorityId;
  final String pedagogyAuthorityId;
  final TaughtAuthorityState state;
  final String derivedHash;

  const TaughtContentAuthority({
    required this.taughtAuthorityId,
    required this.executionId,
    required this.missionId,
    required this.subjectId,
    required this.syllabusAtomId,
    required this.materialVersion,
    required this.teacherAuthorityId,
    required this.pedagogyAuthorityId,
    required this.state,
    required this.derivedHash,
  });

  Map<String, dynamic> toMap() => {
        'taughtAuthorityId': taughtAuthorityId,
        'executionId': executionId,
        'missionId': missionId,
        'subjectId': subjectId,
        'syllabusAtomId': syllabusAtomId,
        'materialVersion': materialVersion.toMap(),
        'teacherAuthorityId': teacherAuthorityId,
        'pedagogyAuthorityId': pedagogyAuthorityId,
        'state': state.name,
        'derivedHash': derivedHash,
      };

  String canonicalString() {
    return 'taughtAuthorityId:$taughtAuthorityId|executionId:$executionId|missionId:$missionId|subjectId:$subjectId|atomId:$syllabusAtomId|${materialVersion.canonicalString()}|teacherId:$teacherAuthorityId|pedagogyId:$pedagogyAuthorityId|state:${state.name}|derivedHash:$derivedHash';
  }

  @override
  List<Object?> get props => [
        taughtAuthorityId,
        executionId,
        missionId,
        subjectId,
        syllabusAtomId,
        materialVersion,
        teacherAuthorityId,
        pedagogyAuthorityId,
        state,
        derivedHash,
      ];
}
