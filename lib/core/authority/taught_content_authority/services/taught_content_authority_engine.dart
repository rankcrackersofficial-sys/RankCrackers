import '../models/teaching_execution.dart';
import '../models/taught_content_authority.dart';
import '../models/taught_content_state.dart';
import '../models/taught_content_failure_codes.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

class TaughtContentAuthorityValidationResult {
  final bool isValid;
  final TaughtContentAuthority? authority;
  final List<TaughtAuthorityFailureCode> failureCodes;

  const TaughtContentAuthorityValidationResult({
    required this.isValid,
    this.authority,
    required this.failureCodes,
  });

  factory TaughtContentAuthorityValidationResult.success(TaughtContentAuthority authority) {
    return TaughtContentAuthorityValidationResult(
      isValid: true,
      authority: authority,
      failureCodes: [],
    );
  }

  factory TaughtContentAuthorityValidationResult.failure(List<TaughtAuthorityFailureCode> codes) {
    return TaughtContentAuthorityValidationResult(
      isValid: false,
      authority: null,
      failureCodes: codes,
    );
  }
}

/// Validation and derivation engine for Taught Content Authority.
class TaughtContentAuthorityEngine {
  final Map<String, _ExecutionCacheEntry> _replayCache = {};

  TaughtContentAuthorityValidationResult evaluateAndDerive({
    required TeachingExecution execution,
    required bool isAtomVerified,
    required bool isMissionActive,
    required String expectedMaterialHash,
    bool isStudentPublished = false,
    bool isStudentRead = false,
    bool isStudentMastered = false,
    bool isStudentCompleted = false,
  }) {
    final List<TaughtAuthorityFailureCode> failures = [];

    // Semantic Law: Student state can NEVER satisfy taught authority
    if (isStudentPublished || isStudentRead || isStudentMastered || isStudentCompleted) {
      failures.add(TaughtAuthorityFailureCode.studentStateInvalidAuthority);
    }

    // 1. Atom verification check
    if (!isAtomVerified || execution.syllabusAtomId.isEmpty) {
      failures.add(TaughtAuthorityFailureCode.atomNotVerified);
    }

    // 2. Mission active check
    if (!isMissionActive || execution.missionId.isEmpty) {
      failures.add(TaughtAuthorityFailureCode.missionInactive);
    }

    // 3. Material hash match check
    if (execution.materialVersion.contentHash != expectedMaterialHash) {
      failures.add(TaughtAuthorityFailureCode.materialHashMismatch);
    }

    // 4. Teacher authority validity check
    final teacher = execution.teacherAuthority;
    if (!teacher.isActive || teacher.status.toLowerCase() != 'active') {
      failures.add(TaughtAuthorityFailureCode.teacherAuthorityInvalid);
    }
    if (teacher.subjectId != execution.subjectId) {
      failures.add(TaughtAuthorityFailureCode.crossScopeReference);
    }
    if (teacher.missionId != null && teacher.missionId!.isNotEmpty && teacher.missionId != execution.missionId) {
      failures.add(TaughtAuthorityFailureCode.crossScopeReference);
    }

    // 5. Pedagogy authority validity check
    final pedagogy = execution.pedagogyAuthority;
    if (!pedagogy.isActive || pedagogy.status.toLowerCase() != 'active') {
      failures.add(TaughtAuthorityFailureCode.pedagogyAuthorityInvalid);
    }
    if (!pedagogy.supportedSubjects.contains(execution.subjectId)) {
      failures.add(TaughtAuthorityFailureCode.crossScopeReference);
    }
    if (!pedagogy.supportedTeacherAuthorityIds.contains(teacher.teacherAuthorityId)) {
      failures.add(TaughtAuthorityFailureCode.teacherAuthorityInvalid);
    }

    // 6. Cross-scope reference checks
    if (execution.missionId.isEmpty || execution.subjectId.isEmpty) {
      failures.add(TaughtAuthorityFailureCode.crossScopeReference);
    }

    // 7. State checks
    if (execution.state == TaughtExecutionState.invalidated) {
      failures.add(TaughtAuthorityFailureCode.authorityInvalidated);
    }
    if (execution.state == TaughtExecutionState.superseded) {
      failures.add(TaughtAuthorityFailureCode.authoritySuperceded);
    }

    // 8. Replay check (Idempotency vs Conflict)
    final executionHash = execution.computeExecutionHash();
    if (_replayCache.containsKey(execution.executionId)) {
      final cached = _replayCache[execution.executionId]!;
      if (cached.executionHash != executionHash) {
        failures.add(TaughtAuthorityFailureCode.executionReplayConflict);
      }
    }

    if (failures.isNotEmpty) {
      return TaughtContentAuthorityValidationResult.failure(failures);
    }

    // Derive deterministic TaughtContentAuthority ID and representation
    final authorityIdSeed = 'taught_auth:${execution.executionId}:${execution.missionId}:${execution.subjectId}:${execution.syllabusAtomId}:${execution.materialVersion.version}:${teacher.teacherAuthorityId}:${pedagogy.pedagogyAuthorityId}';
    final taughtAuthorityId = 'tauth_' + sha256.convert(utf8.encode(authorityIdSeed)).toString().substring(0, 16);
    
    final derivedHashSeed = 'derived:${execution.computeExecutionHash()}|${execution.materialVersion.contentHash}';
    final derivedHash = sha256.convert(utf8.encode(derivedHashSeed)).toString();

    final authority = TaughtContentAuthority(
      taughtAuthorityId: taughtAuthorityId,
      executionId: execution.executionId,
      missionId: execution.missionId,
      subjectId: execution.subjectId,
      syllabusAtomId: execution.syllabusAtomId,
      materialVersion: execution.materialVersion,
      teacherAuthorityId: teacher.teacherAuthorityId,
      pedagogyAuthorityId: pedagogy.pedagogyAuthorityId,
      state: TaughtAuthorityState.validated,
      derivedHash: derivedHash,
    );

    _replayCache[execution.executionId] = _ExecutionCacheEntry(
      executionHash: executionHash,
      authority: authority,
    );

    return TaughtContentAuthorityValidationResult.success(authority);
  }
}

class _ExecutionCacheEntry {
  final String executionHash;
  final TaughtContentAuthority authority;

  _ExecutionCacheEntry({
    required this.executionHash,
    required this.authority,
  });
}
