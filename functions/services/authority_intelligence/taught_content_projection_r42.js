'use strict';

const { hashEvidence } = require('./taught_content_eligibility_r40');

function project({ execution, evidence, authority }) {
  if (!execution || execution.status !== 'EXECUTED') throw new Error('EXECUTION_INVALID');
  const source = execution.authoritySnapshot;
  if (!source) throw new Error('EXECUTION_AUTHORITY_SNAPSHOT_REQUIRED');
  if (!evidence || evidence.executionId !== execution.executionId) throw new Error('EVIDENCE_IDENTITY_MISMATCH');
  const copy = { ...evidence };
  delete copy.evidenceHash;
  if (hashEvidence(copy) !== evidence.evidenceHash) throw new Error('EVIDENCE_HASH_MISMATCH');
  if (!authority || authority.state !== 'VALID' || authority.invalidated || authority.superseded) throw new Error('AUTHORITY_INVALID');
  for (const key of ['realmId', 'missionId', 'subject', 'atom', 'material', 'teacher', 'pedagogy', 'executor', 'authorizationVersion', 'executionId']) if (evidence[key] === undefined || JSON.stringify(evidence[key]) !== JSON.stringify(source[key])) throw new Error(`EVIDENCE_BINDING_MISMATCH:${key}`);
  if (JSON.stringify(authority) !== JSON.stringify({ ...source, state: 'VALID' })) throw new Error('EXTERNAL_AUTHORITY_OVERRIDE');
  return Object.freeze({
    realmId: source.realmId, missionId: source.missionId, subject: source.subject,
    atomId: source.atom.id, materialHash: source.material.hash,
    teacher: source.teacher, pedagogy: source.pedagogy,
    executionId: execution.executionId, evidenceId: evidence.evidenceId,
    evidenceHash: evidence.evidenceHash, validationState: 'VALID', authorityState: 'VALID',
    invalidationRef: null, supersessionRef: null
  });
}
function recompute(input) { return project(input); }
module.exports = Object.freeze({ project, recompute });
