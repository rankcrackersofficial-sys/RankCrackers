'use strict';

const assert = require('assert');
const i1 = require('./services/authority_intelligence/taught_content_authority_i1');
const i2a = require('./services/authority_intelligence/taught_content_authority_i2a');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.code || error.message}`);
    throw error;
  }
}

const identity = i2a.createMissionRealmIdentity({
  missionId: 'rec_ssc_ssc_cgl',
  realmId: 'rec_ssc_ssc_cgl',
  sourceMissionId: 'rec_ssc_ssc_cgl',
  sourceType: 'mission_realms',
  missionRealmPath: 'mission_realms/rec_ssc_ssc_cgl',
  missionIdentityVersion: 'canonical-lineage-v1',
});

function baseExecution(overrides = {}) {
  return {
    identity,
    subjectId: 'quantitative_aptitude',
    syllabusAtomId: 'atom_percentage',
    syllabusVersion: 'ssc-cgl-2026-v1',
    syllabusCanonicalKey: 'ssc_cgl.quantitative_aptitude.percentage',
    materialId: 'digibook_quant_percentage',
    materialVersion: 'v3',
    materialHash: 'A'.repeat(64),
    teacherAuthorityId: 'teacher_quant_v1',
    teacherAuthorityVersion: 'teacher-v1',
    pedagogyId: 'pedagogy_retrieval_v2',
    pedagogyVersion: 'pedagogy-v2',
    pedagogyHash: 'B'.repeat(64),
    executorId: 'executor_i2a_test',
    executorVersion: 'worker-v1',
    idempotencyKey: 'idem-001',
    retentionClassId: 'authority-lineage',
    ...overrides,
  };
}

test('same realm and identity produce deterministic paths', () => {
  const args = { identity, executionId: 'execution_1', realmId: identity.realmId };
  assert.strictEqual(i2a.buildTeachingExecutionPath(args), 'mission_realms/rec_ssc_ssc_cgl/teaching_executions/execution_1');
  assert.strictEqual(i2a.buildExecutionStatusPath(args), 'mission_realms/rec_ssc_ssc_cgl/teaching_execution_status/execution_1');
  assert.strictEqual(i2a.buildEvidencePath({ ...args, evidenceId: 'evidence_1' }), 'mission_realms/rec_ssc_ssc_cgl/teaching_executions/execution_1/evidence/evidence_1');
  assert.strictEqual(i2a.buildTaughtAuthorityPath({ identity, realmId: identity.realmId, authorityId: 'taught_1' }), 'mission_realms/rec_ssc_ssc_cgl/taught_content_authority/taught_1');
  assert.strictEqual(i2a.buildIdempotencyPath({ identity, realmId: identity.realmId, idempotencyKey: 'idem-001' }), 'mission_realms/rec_ssc_ssc_cgl/teaching_execution_idempotency/idem-001');
  assert.strictEqual(i2a.buildExecutionEventPath({ ...args, eventId: 'event_1' }), 'mission_realms/rec_ssc_ssc_cgl/teaching_executions/execution_1/events/event_1');
});

test('missing realmId fails', () => assert.throws(() => i2a.createMissionRealmIdentity({ ...identity, realmId: '' }), /I2A_FIELD_MISSING/));
test('mission and realm mismatch fails closed', () => assert.throws(() => i2a.createMissionRealmIdentity({ ...identity, missionId: 'other' }), /I2A_MISSION_REALM_IDENTITY_INVALID/));
test('parent realm mismatch fails closed', () => assert.throws(() => i2a.buildTeachingExecutionPath({ identity, realmId: 'other', executionId: 'execution_1' }), /I2A_PARENT_REALM_MISMATCH/));
test('unsafe path segment rejected', () => assert.throws(() => i2a.buildTeachingExecutionPath({ realmId: '../escape', executionId: 'execution_1' }), /I2A_UNSAFE_PATH_SEGMENT/));

test('same semantic execution has same deterministic execution identity', () => {
  const first = i2a.createTeachingExecutionModel(baseExecution());
  const second = i2a.createTeachingExecutionModel(baseExecution());
  assert.strictEqual(first.executionId, second.executionId);
});
test('material version changes execution identity', () => {
  const first = i2a.createTeachingExecutionModel(baseExecution());
  const second = i2a.createTeachingExecutionModel(baseExecution({ materialVersion: 'v4' }));
  assert.notStrictEqual(first.executionId, second.executionId);
});
test('material hash changes request fingerprint', () => {
  const first = i2a.requestFingerprint(baseExecution());
  const second = i2a.requestFingerprint(baseExecution({ materialHash: 'C'.repeat(64) }));
  assert.notStrictEqual(first, second);
});
test('same semantic request has same request fingerprint', () => assert.strictEqual(i2a.requestFingerprint(baseExecution()), i2a.requestFingerprint(baseExecution())));
test('changed authority request has different fingerprint', () => assert.notStrictEqual(i2a.requestFingerprint(baseExecution()), i2a.requestFingerprint(baseExecution({ teacherAuthorityVersion: 'teacher-v2' }))));

test('evidence serialization and hash are deterministic', () => {
  const envelopeInput = {
    identity, evidenceId: 'evidence_1', evidenceType: 'TEACHING_RESULT', producerId: 'worker', producerVersion: '1',
    executionId: 'execution_1', syllabusAtomId: 'atom_percentage', materialId: 'digibook_quant_percentage', materialVersion: 'v3', materialHash: 'A'.repeat(64),
    teacherAuthorityId: 'teacher_quant_v1', teacherAuthorityVersion: 'teacher-v1', pedagogyId: 'pedagogy_retrieval_v2', pedagogyVersion: 'pedagogy-v2', pedagogyHash: 'B'.repeat(64),
    result: { ok: true }, artifactRef: 'artifact://immutable/1', artifactDigest: 'D'.repeat(64), retentionClassId: 'authority-lineage', completedAt: '2026-10-09T00:00:00Z',
  };
  const first = i2a.createEvidenceEnvelope(envelopeInput);
  const second = i2a.createEvidenceEnvelope({ ...envelopeInput });
  assert.strictEqual(i2a.canonicalEvidenceEnvelope(first), i2a.canonicalEvidenceEnvelope(second));
  assert.strictEqual(i2a.deterministicEvidenceHash(first), i2a.deterministicEvidenceHash(second));
  assert.strictEqual(first.evidenceHash, second.evidenceHash);
});
test('artifact digest participates in evidence binding', () => {
  const common = { identity, evidenceId: 'evidence_1', evidenceType: 'TEACHING_RESULT', producerId: 'worker', producerVersion: '1', executionId: 'execution_1', syllabusAtomId: 'atom_percentage', materialId: 'm', materialVersion: 'v1', materialHash: 'A'.repeat(64), teacherAuthorityId: 't', teacherAuthorityVersion: 'v1', pedagogyId: 'p', pedagogyVersion: 'v1', pedagogyHash: 'B'.repeat(64), artifactRef: 'artifact://1', retentionClassId: 'authority-lineage' };
  assert.notStrictEqual(i2a.createEvidenceEnvelope({ ...common, artifactDigest: 'D'.repeat(64) }).evidenceHash, i2a.createEvidenceEnvelope({ ...common, artifactDigest: 'E'.repeat(64) }).evidenceHash);
});
test('missing retention class fails where required', () => assert.throws(() => i2a.createTeachingExecutionModel(baseExecution({ retentionClassId: '' })), /I2A_FIELD_MISSING/));
test('no hard-coded duration is represented', () => {
  assert.ok(!Object.keys(i2a.SCHEMA_VERSIONS).some((key) => /day|month|year|expiry/i.test(key)));
});

test('projection references source execution and evidence', () => {
  const execution = i2a.createTeachingExecutionModel(baseExecution({ status: i1.STATES.VALIDATED, executionId: undefined, evidenceHash: 'placeholder' }));
  const evidence = i2a.createEvidenceEnvelope({ identity, evidenceId: 'evidence_1', evidenceType: 'TEACHING_RESULT', producerId: 'worker', producerVersion: '1', executionId: execution.executionId, syllabusAtomId: execution.syllabusAtomId, materialId: execution.materialId, materialVersion: execution.materialVersion, materialHash: execution.materialHash, teacherAuthorityId: execution.teacherAuthorityId, teacherAuthorityVersion: execution.teacherAuthorityVersion, pedagogyId: execution.pedagogyId, pedagogyVersion: execution.pedagogyVersion, pedagogyHash: execution.pedagogyHash, retentionClassId: 'authority-lineage' });
  const validatedExecution = i2a.createTeachingExecutionModel(baseExecution({ status: i1.STATES.VALIDATED, executionId: execution.executionId, evidenceHash: evidence.evidenceHash, evidenceRef: 'evidence_1' }));
  const projection = i2a.createTaughtAuthorityProjection({ identity, execution: validatedExecution, evidence, sourceExecutionRef: 'mission_realms/rec_ssc_ssc_cgl/teaching_executions/' + execution.executionId, validationVersion: 'validator-v1', projectionFingerprint: 'fingerprint-1' });
  assert.strictEqual(projection.sourceEvidenceHash, evidence.evidenceHash);
  assert.strictEqual(projection.authorityId, i1.deriveTaughtContentAuthority(validatedExecution).authority.authorityId);
});
test('projection does not mint independent authority identity', () => {
  const execution = i2a.createTeachingExecutionModel(baseExecution({ status: i1.STATES.VALIDATED, evidenceHash: 'E'.repeat(64) }));
  const evidence = { executionId: execution.executionId, evidenceHash: execution.evidenceHash, evidenceId: 'evidence_1' };
  assert.throws(() => i2a.createTaughtAuthorityProjection({ identity, execution, evidence, authorityId: 'independent', sourceExecutionRef: 'execution', validationVersion: 'v1', projectionFingerprint: 'f' }), /I2A_IDENTITY_MISMATCH/);
});
test('status model is separate from immutable execution model', () => {
  const execution = i2a.createTeachingExecutionModel(baseExecution());
  const status = i2a.createExecutionStatusModel({ executionId: execution.executionId, state: i1.STATES.EXECUTION_PENDING, statusVersion: 0 });
  assert.notStrictEqual(status, execution);
  assert.strictEqual(status.executionId, execution.executionId);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(execution, 'statusVersion'), false);
});
test('event model is append-only representation only', () => {
  const event = i2a.createExecutionEvent({ identity, eventType: 'VALIDATION', executionId: 'execution_1', actorId: 'validator', actorVersion: 'v1', statusVersion: 1, reasonCode: 'VALIDATED' });
  assert.strictEqual(event.eventType, 'VALIDATION');
  assert.strictEqual(typeof event.eventId, 'string');
});
test('unsupported schema version fails closed', () => assert.throws(() => i2a.createExecutionStatusModel({ schemaVersion: 'v99', executionId: 'e', state: i1.STATES.EXECUTED }), /I2A_SCHEMA_VERSION_UNSUPPORTED/));
test('I1 identity behavior remains unchanged', () => {
  const input = baseExecution();
  const execution = i1.createTeachingExecution({ ...input, ...identity, executionId: 'execution_1', materialHash: input.materialHash, status: i1.STATES.EXECUTION_PENDING });
  assert.strictEqual(i1.executionIdentity(execution), i1.identity('execution', i1.executionPayload ? i1.executionPayload(execution) : (() => { const { status, completedAt, evidenceRef, evidenceHash, ...payload } = execution; return payload; })()));
});
test('student/publication/read/mastery fields cannot create authority', () => {
  const execution = i2a.createTeachingExecutionModel(baseExecution({ studentPublished: true, studentRead: true, studentMastered: true }));
  assert.strictEqual(Object.prototype.hasOwnProperty.call(execution, 'studentPublished'), false);
});
test('I2A has zero Firebase/Firestore dependency', () => {
  const source = require('fs').readFileSync(require.resolve('./services/authority_intelligence/taught_content_authority_i2a'), 'utf8');
  assert.ok(!/require\(['"](?:firebase|@google-cloud\/firestore)/i.test(source));
});
test('I2A has zero network/filesystem mutation surface', () => {
  const source = require('fs').readFileSync(require.resolve('./services/authority_intelligence/taught_content_authority_i2a'), 'utf8');
  assert.ok(!/require\(['"](?:fs|net|http|https|firebase|@google-cloud\/firestore)/i.test(source));
  assert.ok(!/\b(?:fetch|http\.request|https\.request)\s*\(/i.test(source));
});

console.log(`I2A_TESTS_PASSED=${passed}`);
