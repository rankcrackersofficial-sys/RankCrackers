import 'package:equatable/equatable.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'material_version.dart';
import 'subject_teacher_authority.dart';
import 'pedagogy_authority.dart';
import 'taught_content_state.dart';

/// Teaching Execution pure identity and model.
class TeachingExecution extends Equatable {
  final String executionId;
  final String idempotencyKey;
  final String missionId;
  final String subjectId;
  final String syllabusAtomId;
  final String syllabusVersion;
  final MaterialVersion materialVersion;
  final SubjectTeacherAuthority teacherAuthority;
  final PedagogyAuthority pedagogyAuthority;
  final String executorId;
  final String executorVersion;
  final TaughtExecutionState state;
  final String? evidenceId;

  const TeachingExecution({
    required this.executionId,
    required this.idempotencyKey,
    required this.missionId,
    required this.subjectId,
    required this.syllabusAtomId,
    required this.syllabusVersion,
    required this.materialVersion,
    required this.teacherAuthority,
    required this.pedagogyAuthority,
    required this.executorId,
    required this.executorVersion,
    required this.state,
    this.evidenceId,
  });

  Map<String, dynamic> toMap() => {
        'executionId': executionId,
        'idempotencyKey': idempotencyKey,
        'missionId': missionId,
        'subjectId': subjectId,
        'syllabusAtomId': syllabusAtomId,
        'syllabusVersion': syllabusVersion,
        'materialVersion': materialVersion.toMap(),
        'teacherAuthority': teacherAuthority.toMap(),
        'pedagogyAuthority': pedagogyAuthority.toMap(),
        'executorId': executorId,
        'executorVersion': executorVersion,
        'state': state.name,
        'evidenceId': evidenceId,
      };

  String canonicalPayloadString() {
    return 'executionId:$executionId|idempotencyKey:$idempotencyKey|missionId:$missionId|subjectId:$subjectId|atomId:$syllabusAtomId|syllabusVersion:$syllabusVersion|${materialVersion.canonicalString()}|${teacherAuthority.canonicalString()}|${pedagogyAuthority.canonicalString()}|executorId:$executorId|executorVersion:$executorVersion|state:${state.name}|evidenceId:${evidenceId ?? ""}';
  }

  String computeExecutionHash() {
    return sha256.convert(utf8.encode(canonicalPayloadString())).toString();
  }

  @override
  List<Object?> get props => [
        executionId,
        idempotencyKey,
        missionId,
        subjectId,
        syllabusAtomId,
        syllabusVersion,
        materialVersion,
        teacherAuthority,
        pedagogyAuthority,
        executorId,
        executorVersion,
        state,
        evidenceId,
      ];
}
