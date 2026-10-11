'use strict';

const crypto = require('crypto');
const { resolveCanonicalMissionId } = require('../canonical_mission_registry');
const { buildCanonicalMissionRealm } = require('./canonical_mission_realm_store');
const {
  assertJurisdictionLevel,
  assertSyllabusBindingMode,
  deriveCycleKey,
} = require('./mission_cycle_store');

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Build an immutable, hidden mission-shell plan before either official source is uploaded.
 * This deliberately creates no cycle and makes no source-verification claim.
 */
function buildMissionShellBootstrapPlan({ payload = {}, actorId, recordedAt }) {
  const requestId = requiredString(payload.requestId, 'MISSION_BOOTSTRAP_REQUEST_ID_REQUIRED');
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(requestId)) throw new Error('MISSION_BOOTSTRAP_REQUEST_ID_INVALID');
  const examName = requiredString(payload.examName, 'MISSION_BOOTSTRAP_EXAM_NAME_REQUIRED');
  const examCategory = requiredString(payload.examCategory, 'MISSION_BOOTSTRAP_EXAM_CATEGORY_REQUIRED');
  const organization = requiredString(payload.organization, 'MISSION_BOOTSTRAP_ORGANIZATION_REQUIRED');
  const authorityKey = requiredString(payload.authorityKey, 'MISSION_BOOTSTRAP_AUTHORITY_REQUIRED');
  const jurisdictionLevel = assertJurisdictionLevel(payload.jurisdictionLevel);
  const syllabusBindingMode = assertSyllabusBindingMode(payload.syllabusBindingMode);
  if (syllabusBindingMode !== 'SEPARATE') throw new Error('MISSION_BOOTSTRAP_REQUIRES_SEPARATE_OFFICIAL_SOURCES');
  if (!recordedAt) throw new Error('MISSION_BOOTSTRAP_RECORDED_AT_REQUIRED');

  const cycleKey = deriveCycleKey({
    targetYear: payload.year,
    cycleDiscriminator: payload.cycleDiscriminator || '',
  });
  const stateCode = payload.stateCode == null ? null : String(payload.stateCode).trim().toUpperCase();
  const identityPayload = {
    examName,
    examCategory,
    organization,
    authorityKey,
    jurisdictionLevel,
    stateCode,
  };
  const missionId = resolveCanonicalMissionId({
    ...payload,
    examName,
    examCategory,
    organization,
    authorityKey,
  });
  if (payload.missionId && String(payload.missionId).trim() !== missionId) {
    throw new Error('MISSION_BOOTSTRAP_CANONICAL_ID_MISMATCH');
  }

  const requestKeyHash = sha256(`${missionId}:bootstrap:${requestId}`);
  const identityDigest = sha256(JSON.stringify(identityPayload));
  const setupDigest = sha256(`${requestKeyHash}: ${identityDigest}: ${cycleKey}`);
  const realm = buildCanonicalMissionRealm({
    id: missionId,
    missionId,
    realmId: missionId,
    exam_name: examName,
    title: examName,
    displayTitle: examName,
    exam_category: examCategory,
    organization,
    exam_year: Number(String(payload.year).trim()),
    jurisdictionLevel,
    stateCode,
    authorityKey,
    status: 'PASSIVE',
    studentVisible: false,
    userPanelVisible: false,
    cardVisible: false,
    catalogDiscoverable: false,
    visibilityGate: {
      studentVisible: false,
      catalogVisible: false,
      userPanelVisible: false,
      cardVisible: false,
      gateStatus: 'PASSIVE',
    },
    archived: false,
    missionSetupStatus: 'AWAITING_OFFICIAL_SOURCE_PAIR',
    missionSetup: {
      phase: 'SHELL_CREATED',
      sourcePairRequired: true,
      sourcePairStatus: 'MISSING',
      cycleKey,
      syllabusBindingMode,
      requestKeyHash,
      identityDigest,
      setupDigest,
      createdBy: actorId || null,
      createdAt: recordedAt,
    },
    created_by: actorId || null,
    created_at: recordedAt,
    updated_at: recordedAt,
  }, {}, recordedAt);

  return Object.freeze({
    missionId,
    cycleKey,
    requestKeyHash,
    identityDigest,
    setupDigest,
    realm,
    requestRecord: Object.freeze({
      missionId,
      cycleKey,
      requestKeyHash,
      identityDigest,
      setupDigest,
      actorId: actorId || null,
      createdAt: recordedAt,
      result: 'SHELL_CREATED_AWAITING_SOURCE_PAIR',
    }),
  });
}

function assertBootstrapRequestReplay(existingRequest, plan) {
  if (!existingRequest || existingRequest.missionId !== plan.missionId
      || existingRequest.requestKeyHash !== plan.requestKeyHash
      || existingRequest.identityDigest !== plan.identityDigest
      || existingRequest.setupDigest !== plan.setupDigest) {
    throw new Error('MISSION_BOOTSTRAP_IDEMPOTENCY_CONFLICT');
  }
  return true;
}

function assertExistingShellReplay(existingRealm, plan) {
  const setup = existingRealm && existingRealm.missionSetup;
  if (!setup || setup.requestKeyHash !== plan.requestKeyHash
      || setup.identityDigest !== plan.identityDigest
      || setup.setupDigest !== plan.setupDigest) {
    throw new Error('MISSION_SHELL_ALREADY_EXISTS_REQUIRES_REUSE_REVIEW');
  }
  const visibility = existingRealm.visibilityGate || {};
  if (existingRealm.userPanelVisible === true || existingRealm.cardVisible === true
      || visibility.studentVisible === true || visibility.catalogVisible === true
      || visibility.userPanelVisible === true || visibility.cardVisible === true) {
    throw new Error('MISSION_SHELL_VISIBILITY_CONFLICT');
  }
  return true;
}

module.exports = {
  assertBootstrapRequestReplay,
  assertExistingShellReplay,
  buildMissionShellBootstrapPlan,
};
