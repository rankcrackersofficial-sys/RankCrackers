/// Failure code taxonomy for Taught Content Authority architecture.
enum TaughtAuthorityFailureCode {
  atomNotVerified,
  missionInactive,
  materialVersionMismatch,
  materialHashMismatch,
  teacherAuthorityInvalid,
  pedagogyAuthorityInvalid,
  executionEvidenceMissing,
  executionReplayConflict,
  authorityInvalidated,
  authoritySuperceded,
  taughtAuthorityMissing,
  crossScopeReference,
  studentStateInvalidAuthority,
}

extension TaughtAuthorityFailureCodeExtension on TaughtAuthorityFailureCode {
  String get code {
    switch (this) {
      case TaughtAuthorityFailureCode.atomNotVerified:
        return 'ATOM_NOT_VERIFIED';
      case TaughtAuthorityFailureCode.missionInactive:
        return 'MISSION_INACTIVE';
      case TaughtAuthorityFailureCode.materialVersionMismatch:
        return 'MATERIAL_VERSION_MISMATCH';
      case TaughtAuthorityFailureCode.materialHashMismatch:
        return 'MATERIAL_HASH_MISMATCH';
      case TaughtAuthorityFailureCode.teacherAuthorityInvalid:
        return 'TEACHER_AUTHORITY_INVALID';
      case TaughtAuthorityFailureCode.pedagogyAuthorityInvalid:
        return 'PEDAGOGY_AUTHORITY_INVALID';
      case TaughtAuthorityFailureCode.executionEvidenceMissing:
        return 'EXECUTION_EVIDENCE_MISSING';
      case TaughtAuthorityFailureCode.executionReplayConflict:
        return 'EXECUTION_REPLAY_CONFLICT';
      case TaughtAuthorityFailureCode.authorityInvalidated:
        return 'AUTHORITY_INVALIDATED';
      case TaughtAuthorityFailureCode.authoritySuperceded:
        return 'AUTHORITY_SUPERSEDED';
      case TaughtAuthorityFailureCode.taughtAuthorityMissing:
        return 'TAUGHT_AUTHORITY_MISSING';
      case TaughtAuthorityFailureCode.crossScopeReference:
        return 'CROSS_SCOPE_REFERENCE';
      case TaughtAuthorityFailureCode.studentStateInvalidAuthority:
        return 'STUDENT_STATE_INVALID_AUTHORITY';
    }
  }
}
