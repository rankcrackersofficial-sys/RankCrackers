'use strict';

const crypto = require('crypto');

const FAILURE_CODES = Object.freeze({
  ATOM_NOT_VERIFIED: 'ATOM_NOT_VERIFIED',
  MISSION_INACTIVE: 'MISSION_INACTIVE',
  MATERIAL_VERSION_MISMATCH: 'MATERIAL_VERSION_MISMATCH',
  MATERIAL_HASH_MISMATCH: 'MATERIAL_HASH_MISMATCH',
  TEACHER_AUTHORITY_INVALID: 'TEACHER_AUTHORITY_INVALID',
  PEDAGOGY_AUTHORITY_INVALID: 'PEDAGOGY_AUTHORITY_INVALID',
  EXECUTION_EVIDENCE_MISSING: 'EXECUTION_EVIDENCE_MISSING',
  EXECUTION_REPLAY_CONFLICT: 'EXECUTION_REPLAY_CONFLICT',
  AUTHORITY_INVALIDATED: 'AUTHORITY_INVALIDATED',
  AUTHORITY_SUPERSEDED: 'AUTHORITY_SUPERSEDED',
  TAUGHT_AUTHORITY_MISSING: 'TAUGHT_AUTHORITY_MISSING',
  CROSS_SCOPE_REFERENCE: 'CROSS_SCOPE_REFERENCE',
});

const STATES = Object.freeze({
  EXECUTION_PENDING: 'EXECUTION_PENDING',
  EXECUTED: 'EXECUTED',
  VALIDATED: 'VALIDATED',
  INVALIDATED: 'INVALIDATED',
  SUPERSEDED: 'SUPERSEDED',
});

const transitions = Object.freeze({
  EXECUTION_PENDING: new Set(['EXECUTED', 'INVALIDATED']),
  EXECUTED: new Set(['VALIDATED', 'INVALIDATED']),
  VALIDATED: new Set(['INVALIDATED', 'SUPERSEDED']),
  INVALIDATED: new Set(['SUPERSEDED']),
  SUPERSEDED: new Set(),
});

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      if (value[key] !== undefined) out[key] = normalize(value[key]);
      return out;
    }, {});
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

function identity(kind, value) {
  return `${kind}_${sha256(value).slice(0, 32)}`;
}

function result(ok, code, details) {
  return ok ? { ok: true } : { ok: false, code, ...(details || {}) };
}

function createSubjectTeacherAuthority(input) {
  const value = { ...input };
  if (!requiredString(value.version) || !requiredString(value.subjectId)) {
    throw new Error(FAILURE_CODES.TEACHER_AUTHORITY_INVALID);
  }
  value.status = value.status || 'ACTIVE';
  value.authorityId = value.authorityId || identity('teacher', {
    version: value.version, subjectId: value.subjectId, missionId: value.missionId || null,
  });
  return Object.freeze(value);
}

function validateTeacherAuthority(authority, scope) {
  if (!authority || authority.status !== 'ACTIVE' || !requiredString(authority.version) ||
      !requiredString(authority.subjectId) || (scope.subjectId && authority.subjectId !== scope.subjectId) ||
      (authority.missionId && scope.missionId && authority.missionId !== scope.missionId)) {
    return result(false, FAILURE_CODES.TEACHER_AUTHORITY_INVALID);
  }
  return result(true);
}

function createPedagogyAuthority(input) {
  const value = { ...input };
  if (!requiredString(value.pedagogyId) || !requiredString(value.version) || !requiredString(value.subjectId)) {
    throw new Error(FAILURE_CODES.PEDAGOGY_AUTHORITY_INVALID);
  }
  value.status = value.status || 'ACTIVE';
  value.authorityId = value.authorityId || identity('pedagogy', {
    pedagogyId: value.pedagogyId, version: value.version, subjectId: value.subjectId,
  });
  return Object.freeze(value);
}

function validatePedagogyAuthority(authority, scope) {
  if (!authority || authority.status !== 'ACTIVE' || !requiredString(authority.pedagogyId) ||
      !requiredString(authority.version) || authority.subjectId !== scope.subjectId ||
      (authority.teacherAuthorityId && authority.teacherAuthorityId !== scope.teacherAuthorityId)) {
    return result(false, FAILURE_CODES.PEDAGOGY_AUTHORITY_INVALID);
  }
  return result(true);
}

function createMaterialVersion(input) {
  if (!requiredString(input.materialId) || !requiredString(input.version) || !requiredString(input.contentHash)) {
    throw new Error(FAILURE_CODES.MATERIAL_VERSION_MISMATCH);
  }
  return Object.freeze({
    materialId: input.materialId,
    version: input.version,
    contentHash: input.contentHash.toLowerCase(),
    materialVersionId: identity('material', {
      materialId: input.materialId, version: input.version, contentHash: input.contentHash.toLowerCase(),
    }),
  });
}

function compareMaterialVersion(expected, actual) {
  if (!expected || !actual || expected.materialId !== actual.materialId || expected.version !== actual.version) {
    return result(false, FAILURE_CODES.MATERIAL_VERSION_MISMATCH);
  }
  if (expected.contentHash.toLowerCase() !== actual.contentHash.toLowerCase()) {
    return result(false, FAILURE_CODES.MATERIAL_HASH_MISMATCH);
  }
  return result(true);
}

function createTeachingExecution(input) {
  const required = ['missionId', 'subjectId', 'syllabusAtomId', 'syllabusVersion', 'materialId', 'materialVersion',
    'materialHash', 'teacherAuthorityId', 'teacherAuthorityVersion', 'pedagogyId', 'pedagogyVersion',
    'executorId', 'executorVersion', 'executionId', 'idempotencyKey'];
  if (required.some((key) => !requiredString(input[key]))) throw new Error(FAILURE_CODES.EXECUTION_EVIDENCE_MISSING);
  return Object.freeze({ ...input, materialHash: input.materialHash.toLowerCase(), status: input.status || STATES.EXECUTION_PENDING });
}

function executionPayload(execution) {
  const { status, completedAt, evidenceRef, evidenceHash, ...payload } = execution;
  return payload;
}

function executionIdentity(execution) {
  return identity('execution', executionPayload(execution));
}

function validateExecutionIdentity(execution, scope) {
  if (!execution || !requiredString(execution.executionId) || !requiredString(execution.missionId) ||
      !requiredString(execution.subjectId) || !requiredString(execution.syllabusAtomId) ||
      !requiredString(execution.materialId) || !requiredString(execution.materialVersion) ||
      !requiredString(execution.materialHash)) return result(false, FAILURE_CODES.EXECUTION_EVIDENCE_MISSING);
  if (!scope || scope.missionActive !== true) return result(false, FAILURE_CODES.MISSION_INACTIVE);
  if (scope.atomVerified !== true) return result(false, FAILURE_CODES.ATOM_NOT_VERIFIED);
  if (execution.missionId !== scope.missionId || execution.subjectId !== scope.subjectId) {
    return result(false, FAILURE_CODES.CROSS_SCOPE_REFERENCE);
  }
  if (scope.material && (execution.materialId !== scope.material.materialId || execution.materialVersion !== scope.material.version)) {
    return result(false, FAILURE_CODES.MATERIAL_VERSION_MISMATCH);
  }
  if (scope.material && execution.materialHash.toLowerCase() !== scope.material.contentHash.toLowerCase()) {
    return result(false, FAILURE_CODES.MATERIAL_HASH_MISMATCH);
  }
  const teacher = validateTeacherAuthority(scope.teacher, scope);
  if (!teacher.ok) return teacher;
  const pedagogy = validatePedagogyAuthority(scope.pedagogy, { ...scope, teacherAuthorityId: scope.teacher.authorityId });
  if (!pedagogy.ok) return pedagogy;
  return result(true);
}

function deriveTaughtContentAuthority(execution) {
  if (!execution || execution.status !== STATES.VALIDATED || !requiredString(execution.evidenceHash)) {
    return { ok: false, code: FAILURE_CODES.EXECUTION_EVIDENCE_MISSING };
  }
  return { ok: true, authority: Object.freeze({
    authorityId: identity('taught', executionPayload(execution)),
    executionId: execution.executionId,
    missionId: execution.missionId,
    subjectId: execution.subjectId,
    syllabusAtomId: execution.syllabusAtomId,
    materialId: execution.materialId,
    materialVersion: execution.materialVersion,
    materialHash: execution.materialHash,
    status: STATES.VALIDATED,
    evidenceHash: execution.evidenceHash,
  }) };
}

function validateTaughtContentAuthority(authority, execution) {
  if (!authority || !execution) return result(false, FAILURE_CODES.TAUGHT_AUTHORITY_MISSING);
  if (execution.status === STATES.INVALIDATED) return result(false, FAILURE_CODES.AUTHORITY_INVALIDATED);
  if (execution.status === STATES.SUPERSEDED) return result(false, FAILURE_CODES.AUTHORITY_SUPERSEDED);
  const expected = deriveTaughtContentAuthority(execution);
  if (!expected.ok || authority.authorityId !== expected.authority.authorityId) {
    return result(false, FAILURE_CODES.TAUGHT_AUTHORITY_MISSING);
  }
  return result(true);
}

function validateTransition(from, to) {
  if (!transitions[from] || !transitions[from].has(to)) return result(false, FAILURE_CODES.AUTHORITY_INVALIDATED);
  return result(true);
}

function validateReplay(existing, incoming) {
  if (!existing || existing.executionId !== incoming.executionId) return result(true);
  return canonicalJson(executionPayload(existing)) === canonicalJson(executionPayload(incoming))
    ? result(true) : result(false, FAILURE_CODES.EXECUTION_REPLAY_CONFLICT);
}

module.exports = {
  FAILURE_CODES, STATES, canonicalJson, sha256, identity,
  createSubjectTeacherAuthority, validateTeacherAuthority,
  createPedagogyAuthority, validatePedagogyAuthority,
  createMaterialVersion, compareMaterialVersion,
  createTeachingExecution, executionIdentity, validateExecutionIdentity,
  deriveTaughtContentAuthority, validateTaughtContentAuthority,
  validateTransition, validateReplay,
};
