'use strict';

const { hashEvidence, validateTaughtContentEligibility } = require('./taught_content_eligibility_r40');

function assertCurrent(state, token) {
  if (!state || state.status !== 'CLAIMED') throw new Error('EXECUTION_NOT_CLAIMED');
  for (const key of ['owner', 'fencingToken', 'leaseGeneration', 'statusVersion']) if (state[key] !== token[key]) throw new Error(`STALE_EXECUTION:${key}`);
  if (state.leaseExpiresAtMs <= token.nowMs) throw new Error('LEASE_EXPIRED');
}
const BINDINGS = ['realmId', 'missionId', 'subject', 'atom', 'material', 'teacher', 'pedagogy', 'executor', 'authorizationVersion', 'executionId', 'fingerprint'];
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function assertImmutableBindings(state, token) {
  const snapshot = state && state.authoritySnapshot;
  if (!snapshot) throw new Error('EXECUTION_AUTHORITY_SNAPSHOT_REQUIRED');
  for (const key of BINDINGS) {
    if (snapshot[key] === undefined || snapshot[key] === null) throw new Error(`EXECUTION_BINDING_MISSING:${key}`);
    if (token[key] !== undefined && !same(token[key], snapshot[key])) throw new Error(`EXECUTION_BINDING_MISMATCH:${key}`);
  }
}
function completeExecution(state, token, completion) {
  assertCurrent(state, token);
  assertImmutableBindings(state, token);
  if (state.completedAtMs) return Object.freeze({ ...state, idempotent: true });
  return Object.freeze({ ...state, status: 'EXECUTED', completion: Object.freeze({ ...completion }), completedAtMs: token.nowMs });
}
function sealEvidence(execution, evidence) {
  if (!execution || execution.status !== 'EXECUTED') throw new Error('EXECUTION_NOT_COMPLETE');
  const sealed = Object.freeze({ ...evidence, executionId: execution.executionId, completion: execution.completion });
  return Object.freeze({ ...sealed, evidenceHash: hashEvidence(sealed) });
}
function issueProjection(execution, evidence, request) {
  if (!execution || !execution.authoritySnapshot) throw new Error('EXECUTION_AUTHORITY_SNAPSHOT_REQUIRED');
  assertImmutableBindings(execution, {});
  const snapshot = execution.authoritySnapshot;
  if (!evidence || evidence.executionId !== snapshot.executionId) throw new Error('EVIDENCE_IDENTITY_MISMATCH');
  if (hashEvidence(Object.fromEntries(Object.entries(evidence).filter(([k]) => k !== 'evidenceHash'))) !== evidence.evidenceHash) throw new Error('EVIDENCE_HASH_MISMATCH');
  for (const key of ['realmId', 'missionId', 'subject', 'atom', 'material', 'teacher', 'pedagogy', 'executor', 'authorizationVersion', 'executionId']) {
    if (evidence[key] === undefined || !same(evidence[key], snapshot[key])) throw new Error(`EVIDENCE_BINDING_MISMATCH:${key}`);
  }
  const derived = { realmId: snapshot.realmId, missionId: snapshot.missionId, subject: snapshot.subject, atomId: snapshot.atom.id, materialHash: snapshot.material.hash, executionId: snapshot.executionId, evidenceHash: evidence.evidenceHash };
  if (request) for (const key of ['realmId', 'missionId', 'subject', 'atomId', 'materialHash', 'executionId']) if (request[key] !== undefined && request[key] !== derived[key]) throw new Error(`PROJECTION_REQUEST_MISMATCH:${key}`);
  const eligibility = validateTaughtContentEligibility(derived, { ...derived, state: 'VALID' });
  if (!eligibility.ok) throw new Error(eligibility.code);
  return Object.freeze({ ...derived, evidenceId: evidence.evidenceId, state: 'VALID' });
}
module.exports = Object.freeze({ assertCurrent, completeExecution, sealEvidence, issueProjection, assertImmutableBindings });
