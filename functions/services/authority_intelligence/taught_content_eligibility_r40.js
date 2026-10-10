'use strict';

const crypto = require('crypto');

function fail(code, detail) { return Object.freeze({ ok: false, code, detail }); }
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
function hashEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') throw new Error('EVIDENCE_REQUIRED');
  const required = ['evidenceId', 'executionId', 'realmId', 'missionId', 'subject', 'atom', 'material', 'teacher', 'pedagogy', 'executor', 'authorizationVersion', 'fencingToken', 'leaseGeneration', 'completion', 'issuer', 'retentionClassId'];
  for (const key of required) if (evidence[key] === undefined || evidence[key] === null) throw new Error(`EVIDENCE_FIELD_REQUIRED:${key}`);
  return crypto.createHash('sha256').update(canonical(evidence)).digest('hex');
}
function validateTaughtContentEligibility(request, authority) {
  if (!request || !authority) return fail('AUTHORITY_MISSING');
  if (authority.state !== 'VALID') return fail('AUTHORITY_NOT_VALID');
  for (const key of ['realmId', 'missionId', 'subject', 'atomId', 'materialHash', 'executionId', 'evidenceHash']) {
    if (request[key] !== authority[key]) return fail('AUTHORITY_SCOPE_MISMATCH', key);
  }
  if (authority.invalidated === true) return fail('AUTHORITY_INVALIDATED');
  if (authority.superseded === true) return fail('AUTHORITY_SUPERSEDED');
  if (authority.legacyOnly === true) return fail('LEGACY_NOT_AUTHORITY');
  return Object.freeze({ ok: true, code: 'TAUGHT_CONTENT_ELIGIBLE' });
}
module.exports = Object.freeze({ canonical, hashEvidence, validateTaughtContentEligibility });
