'use strict';
const assert = require('assert');
const i1 = require('./services/authority_intelligence/taught_content_authority_i1');
const { FAILURE_CODES: E, STATES: S } = i1;
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }
const teacher = i1.createSubjectTeacherAuthority({ version: '1', subjectId: 'physics', missionId: 'm1', status: 'ACTIVE' });
assert.strictEqual(teacher.authorityId, i1.createSubjectTeacherAuthority({ version: '1', subjectId: 'physics', missionId: 'm1', status: 'ACTIVE' }).authorityId);
const pedagogy = i1.createPedagogyAuthority({ pedagogyId: 'ped.physics', version: '1', subjectId: 'physics', teacherAuthorityId: teacher.authorityId, status: 'ACTIVE' });
const material = i1.createMaterialVersion({ materialId: 'lesson.1', version: 'N', contentHash: 'a'.repeat(64) });
function execution(overrides) { return i1.createTeachingExecution({ missionId: 'm1', subjectId: 'physics', syllabusAtomId: 'atom.1', syllabusVersion: 'v1', materialId: material.materialId, materialVersion: material.version, materialHash: material.contentHash, teacherAuthorityId: teacher.authorityId, teacherAuthorityVersion: teacher.version, pedagogyId: pedagogy.pedagogyId, pedagogyVersion: pedagogy.version, executorId: 'backend.i1', executorVersion: '1', executionId: 'exec.1', idempotencyKey: 'idem.1', evidenceHash: 'b'.repeat(64), status: S.VALIDATED, ...overrides }); }
test('deterministic canonical serialization and execution identity', () => {
  const a = execution(); const b = execution(); assert.strictEqual(i1.canonicalJson({ b: 2, a: 1 }), i1.canonicalJson({ a: 1, b: 2 })); assert.strictEqual(i1.executionIdentity(a), i1.executionIdentity(b)); });
const validScope = { missionId: 'm1', subjectId: 'physics', missionActive: true, atomVerified: true, material, teacher, pedagogy };
test('version N cannot authorize N+1', () => { const n1 = execution(); const n2 = execution({ materialVersion: 'N+1' }); assert.strictEqual(i1.validateExecutionIdentity(n2, validScope).code, E.MATERIAL_VERSION_MISMATCH); assert.notStrictEqual(i1.executionIdentity(n1), i1.executionIdentity(n2)); });
test('material hash mismatch fails', () => assert.strictEqual(i1.compareMaterialVersion(material, { ...material, contentHash: 'c'.repeat(64) }).code, E.MATERIAL_HASH_MISMATCH));
test('cross-mission and cross-subject fail closed', () => { const x = execution({ missionId: 'm2' }); assert.strictEqual(i1.validateExecutionIdentity(x, validScope).code, E.CROSS_SCOPE_REFERENCE); const y = execution({ subjectId: 'chemistry' }); assert.strictEqual(i1.validateExecutionIdentity(y, validScope).code, E.CROSS_SCOPE_REFERENCE); });
test('revoked teacher and pedagogy fail', () => { assert.strictEqual(i1.validateTeacherAuthority({ ...teacher, status: 'REVOKED' }, { missionId: 'm1', subjectId: 'physics' }).code, E.TEACHER_AUTHORITY_INVALID); assert.strictEqual(i1.validatePedagogyAuthority({ ...pedagogy, status: 'REVOKED' }, { subjectId: 'physics', teacherAuthorityId: teacher.authorityId }).code, E.PEDAGOGY_AUTHORITY_INVALID); });
test('invalidated and superseded authority fail', () => { const a = i1.deriveTaughtContentAuthority(execution()).authority; assert.strictEqual(i1.validateTaughtContentAuthority(a, execution({ status: S.INVALIDATED })).code, E.AUTHORITY_INVALIDATED); assert.strictEqual(i1.validateTaughtContentAuthority(a, execution({ status: S.SUPERSEDED })).code, E.AUTHORITY_SUPERSEDED); });
test('same execution replay compatible and conflicting replay rejected', () => { const a = execution(); assert.strictEqual(i1.validateReplay(a, execution()).ok, true); assert.strictEqual(i1.validateReplay(a, execution({ materialHash: 'c'.repeat(64) })).code, E.EXECUTION_REPLAY_CONFLICT); });
test('publication/readiness/student state cannot satisfy authority', () => { const fake = { status: 'published', published: true, studentVisible: true, mastery: true }; assert.strictEqual(i1.validateTaughtContentAuthority(fake, null).code, E.TAUGHT_AUTHORITY_MISSING); });
test('missing identity and transitions fail closed', () => { assert.throws(() => i1.createTeachingExecution({}), new RegExp(E.EXECUTION_EVIDENCE_MISSING)); assert.strictEqual(i1.validateTransition(S.VALIDATED, S.EXECUTED).ok, false); assert.strictEqual(i1.validateTransition(S.EXECUTED, S.VALIDATED).ok, true); });
test('verified atom and active mission permit valid execution identity', () => assert.strictEqual(i1.validateExecutionIdentity(execution(), validScope).ok, true));
test('unverified atom fails closed', () => assert.strictEqual(i1.validateExecutionIdentity(execution(), { ...validScope, atomVerified: false }).code, E.ATOM_NOT_VERIFIED));
test('inactive mission fails closed', () => assert.strictEqual(i1.validateExecutionIdentity(execution(), { ...validScope, missionActive: false }).code, E.MISSION_INACTIVE));
test('missing atom verification fails closed', () => { const { atomVerified, ...scope } = validScope; assert.strictEqual(i1.validateExecutionIdentity(execution(), scope).code, E.ATOM_NOT_VERIFIED); });
test('missing mission activity fails closed', () => { const { missionActive, ...scope } = validScope; assert.strictEqual(i1.validateExecutionIdentity(execution(), scope).code, E.MISSION_INACTIVE); });
test('Student visibility cannot substitute for mission activity', () => { const { missionActive, ...scope } = validScope; assert.strictEqual(i1.validateExecutionIdentity(execution(), { ...scope, studentVisible: true, published: true }).code, E.MISSION_INACTIVE); });
console.log(`I1_PASS_COUNT=${passed}`);
