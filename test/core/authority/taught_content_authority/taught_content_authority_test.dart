import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/authority/taught_content_authority/models/subject_teacher_authority.dart';
import 'package:rank_crackers/core/authority/taught_content_authority/models/pedagogy_authority.dart';
import 'package:rank_crackers/core/authority/taught_content_authority/models/material_version.dart';
import 'package:rank_crackers/core/authority/taught_content_authority/models/teaching_execution.dart';
import 'package:rank_crackers/core/authority/taught_content_authority/models/taught_content_state.dart';
import 'package:rank_crackers/core/authority/taught_content_authority/models/taught_content_failure_codes.dart';
import 'package:rank_crackers/core/authority/taught_content_authority/services/taught_content_authority_engine.dart';

void main() {
  group('Taught Content Authority Architecture Tests (R15-I1 / R17C)', () {
    const String validMissionId = 'jee_main_2027';
    const String validSubjectId = 'physics';
    const String validAtomId = 'atom_kinematics_1';
    const String validMaterialHash = 'hash_mat_v1_abc';

    SubjectTeacherAuthority makeTeacher({
      String id = 'teacher_1',
      String subject = validSubjectId,
      String? mission = validMissionId,
      bool active = true,
      String status = 'active',
    }) {
      return SubjectTeacherAuthority(
        teacherAuthorityId: id,
        version: '1.0',
        subjectId: subject,
        missionId: mission,
        isActive: active,
        status: status,
      );
    }

    PedagogyAuthority makePedagogy({
      String id = 'pedagogy_1',
      List<String> subjects = const [validSubjectId],
      List<String> teachers = const ['teacher_1'],
      bool active = true,
      String status = 'active',
    }) {
      return PedagogyAuthority(
        pedagogyAuthorityId: id,
        version: '1.0',
        supportedSubjects: subjects,
        supportedTeacherAuthorityIds: teachers,
        authorityHash: 'hash_ped_v1',
        isActive: active,
        status: status,
      );
    }

    MaterialVersion makeMaterial({
      String id = 'mat_1',
      String version = 'v1',
      String hash = validMaterialHash,
    }) {
      return MaterialVersion(
        materialId: id,
        version: version,
        contentHash: hash,
      );
    }

    TeachingExecution makeExecution({
      String executionId = 'exec_001',
      String mission = validMissionId,
      String subject = validSubjectId,
      String atom = validAtomId,
      MaterialVersion? material,
      SubjectTeacherAuthority? teacher,
      PedagogyAuthority? pedagogy,
      TaughtExecutionState state = TaughtExecutionState.executed,
    }) {
      return TeachingExecution(
        executionId: executionId,
        idempotencyKey: 'idemp_key_001',
        missionId: mission,
        subjectId: subject,
        syllabusAtomId: atom,
        syllabusVersion: 'syll_v1',
        materialVersion: material ?? makeMaterial(),
        teacherAuthority: teacher ?? makeTeacher(),
        pedagogyAuthority: pedagogy ?? makePedagogy(),
        executorId: 'executor_sys',
        executorVersion: '1.0',
        state: state,
      );
    }

    test('1. Deterministic identity and canonical serialization', () {
      final exec1 = makeExecution();
      final exec2 = makeExecution();

      expect(exec1.computeExecutionHash(), equals(exec2.computeExecutionHash()));
      expect(exec1.canonicalPayloadString(), equals(exec2.canonicalPayloadString()));

      final engine = TaughtContentAuthorityEngine();
      final res1 = engine.evaluateAndDerive(
        execution: exec1,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      final res2 = engine.evaluateAndDerive(
        execution: exec2,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(res1.isValid, isTrue);
      expect(res2.isValid, isTrue);
      expect(res1.authority?.taughtAuthorityId, equals(res2.authority?.taughtAuthorityId));
      expect(res1.authority?.derivedHash, equals(res2.authority?.derivedHash));
    });

    test('2 & 3. Material N cannot authorize N+1 and hash mismatch fails', () {
      final engine = TaughtContentAuthorityEngine();
      final matNplus1 = makeMaterial(version: 'v2', hash: 'hash_mat_v2_wrong');
      final exec = makeExecution(material: matNplus1);

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash, // expected is v1 hash
      );

      expect(result.isValid, isFalse);
      expect(result.failureCodes, contains(TaughtAuthorityFailureCode.materialHashMismatch));
    });

    test('4. Cross-mission reuse fails with CROSS_SCOPE_REFERENCE', () {
      final engine = TaughtContentAuthorityEngine();
      final exec = makeExecution(mission: 'neet_mission_2027'); // different from teacher mission jee_main_2027

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(result.isValid, isFalse);
      expect(result.failureCodes, contains(TaughtAuthorityFailureCode.crossScopeReference));
    });

    test('5. Cross-subject reuse fails with CROSS_SCOPE_REFERENCE', () {
      final engine = TaughtContentAuthorityEngine();
      final teacherWrong = makeTeacher(subject: 'mathematics');
      final exec = makeExecution(subject: validSubjectId, teacher: teacherWrong);

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(result.isValid, isFalse);
      expect(result.failureCodes, contains(TaughtAuthorityFailureCode.crossScopeReference));
    });

    test('6. Revoked teacher fails with TEACHER_AUTHORITY_INVALID', () {
      final engine = TaughtContentAuthorityEngine();
      final teacherRevoked = makeTeacher(active: false, status: 'revoked');
      final exec = makeExecution(teacher: teacherRevoked);

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(result.isValid, isFalse);
      expect(result.failureCodes, contains(TaughtAuthorityFailureCode.teacherAuthorityInvalid));
    });

    test('7. Revoked pedagogy fails with PEDAGOGY_AUTHORITY_INVALID', () {
      final engine = TaughtContentAuthorityEngine();
      final pedagogyRevoked = makePedagogy(active: false, status: 'revoked');
      final exec = makeExecution(pedagogy: pedagogyRevoked);

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(result.isValid, isFalse);
      expect(result.failureCodes, contains(TaughtAuthorityFailureCode.pedagogyAuthorityInvalid));
    });

    test('8. INVALIDATED execution state fails with AUTHORITY_INVALIDATED', () {
      final engine = TaughtContentAuthorityEngine();
      final exec = makeExecution(state: TaughtExecutionState.invalidated);

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(result.isValid, isFalse);
      expect(result.failureCodes, contains(TaughtAuthorityFailureCode.authorityInvalidated));
    });

    test('9. SUPERSEDED execution state fails with AUTHORITY_SUPERSEDED', () {
      final engine = TaughtContentAuthorityEngine();
      final exec = makeExecution(state: TaughtExecutionState.superseded);

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(result.isValid, isFalse);
      expect(result.failureCodes, contains(TaughtAuthorityFailureCode.authoritySuperceded));
    });

    test('10. Identical replay succeeds / is idempotent', () {
      final engine = TaughtContentAuthorityEngine();
      final exec = makeExecution();

      final res1 = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      final res2 = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(res1.isValid, isTrue);
      expect(res2.isValid, isTrue);
      expect(res1.authority?.taughtAuthorityId, equals(res2.authority?.taughtAuthorityId));
    });

    test('11. Conflicting replay fails with EXECUTION_REPLAY_CONFLICT', () {
      final engine = TaughtContentAuthorityEngine();
      final execOriginal = makeExecution(executionId: 'exec_conflict_test');
      
      final res1 = engine.evaluateAndDerive(
        execution: execOriginal,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );
      expect(res1.isValid, isTrue);

      // Same executionId, but different material version/hash (conflicting payload)
      final execConflict = makeExecution(
        executionId: 'exec_conflict_test',
        material: makeMaterial(hash: 'different_hash'),
      );

      final res2 = engine.evaluateAndDerive(
        execution: execConflict,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: 'different_hash',
      );

      expect(res2.isValid, isFalse);
      expect(res2.failureCodes, contains(TaughtAuthorityFailureCode.executionReplayConflict));
    });

    test('12. Publication / read / mastery / Student state cannot satisfy authority', () {
      final engine = TaughtContentAuthorityEngine();
      final exec = makeExecution();

      final resultMastery = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
        isStudentMastered: true, // Student state injected
      );

      expect(resultMastery.isValid, isFalse);
      expect(resultMastery.failureCodes, contains(TaughtAuthorityFailureCode.studentStateInvalidAuthority));
    });

    test('13. Missing atom verification fails closed with ATOM_NOT_VERIFIED', () {
      final engine = TaughtContentAuthorityEngine();
      final exec = makeExecution(atom: '');

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: false,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(result.isValid, isFalse);
      expect(result.failureCodes, contains(TaughtAuthorityFailureCode.atomNotVerified));
    });

    test('14. Deterministic serialization and map representation', () {
      final teacher = makeTeacher();
      final map = teacher.toMap();
      expect(map['teacherAuthorityId'], equals('teacher_1'));
      expect(map['subjectId'], equals(validSubjectId));
      expect(map['isActive'], isTrue);
    });

    test('15. Zero external-service requirement (pure in-memory verification)', () {
      final engine = TaughtContentAuthorityEngine();
      final exec = makeExecution();

      final result = engine.evaluateAndDerive(
        execution: exec,
        isAtomVerified: true,
        isMissionActive: true,
        expectedMaterialHash: validMaterialHash,
      );

      expect(result.isValid, isTrue);
      expect(result.authority, isNotNull);
    });
  });
}
