'use strict';

const crypto = require('crypto');
const { resolveCanonicalMissionId } = require('../canonical_mission_registry');
const { buildCanonicalMissionRealm } = require('./canonical_mission_realm_store');
const { canonicalAuthorityRegistry } = require('./authority_intelligence');
const { assertActiveFounder } = require('./mission_lifecycle_governance');
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
  const authority = canonicalAuthorityRegistry.getByKey(authorityKey, false);
  if (!authority) throw new Error('MISSION_BOOTSTRAP_AUTHORITY_UNRESOLVED');
  const normalizedOrganization = organization.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const knownAuthorityNames = [authority.fullName, authority.shortName]
    .filter(value => typeof value === 'string' && value.trim() !== '')
    .map(value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
  if (!knownAuthorityNames.includes(normalizedOrganization)) {
    throw new Error('MISSION_BOOTSTRAP_AUTHORITY_ORGANIZATION_MISMATCH');
  }
  const jurisdictionLevel = assertJurisdictionLevel(payload.jurisdictionLevel);
  if (authority.jurisdiction !== jurisdictionLevel) throw new Error('MISSION_BOOTSTRAP_AUTHORITY_JURISDICTION_MISMATCH');
  const syllabusBindingMode = assertSyllabusBindingMode(payload.syllabusBindingMode);
  if (!['SEPARATE', 'EMBEDDED'].includes(syllabusBindingMode)) throw new Error('MISSION_BOOTSTRAP_SOURCE_BINDING_MODE_UNSUPPORTED');
  if (!recordedAt) throw new Error('MISSION_BOOTSTRAP_RECORDED_AT_REQUIRED');

  const cycleKey = deriveCycleKey({
    targetYear: payload.year,
    cycleDiscriminator: payload.cycleDiscriminator || '',
  });
  const stateCode = payload.stateCode == null || String(payload.stateCode).trim() === ''
    ? null : String(payload.stateCode).trim().toUpperCase();
  if (jurisdictionLevel === 'CENTRAL' && stateCode !== null) throw new Error('MISSION_BOOTSTRAP_STATE_CODE_FORBIDDEN');
  if (jurisdictionLevel !== 'CENTRAL' && (!stateCode || !/^[A-Z]{2}$/.test(stateCode))) {
    throw new Error('MISSION_BOOTSTRAP_STATE_CODE_REQUIRED');
  }
  if (jurisdictionLevel !== 'CENTRAL' && authority.stateCode !== stateCode) {
    throw new Error('MISSION_BOOTSTRAP_AUTHORITY_STATE_MISMATCH');
  }
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
  const legacyVisibility = existingRealm.visibility || {};
  if (existingRealm.studentVisible === true || existingRealm.catalogVisible === true
      || existingRealm.userPanelVisible === true || existingRealm.cardVisible === true
      || existingRealm.catalogDiscoverable === true || visibility.studentVisible === true
      || visibility.catalogVisible === true || visibility.userPanelVisible === true
      || visibility.cardVisible === true || legacyVisibility.studentVisible === true
      || legacyVisibility.catalogVisible === true || legacyVisibility.userPanelVisible === true
      || legacyVisibility.cardVisible === true) {
    throw new Error('MISSION_SHELL_VISIBILITY_CONFLICT');
  }
  return true;
}

async function executeMissionShellBootstrap({ transaction, db, payload = {}, auth, recordedAt }) {
  if (!transaction) throw new Error('MISSION_BOOTSTRAP_TRANSACTION_REQUIRED');
  if (!db) throw new Error('MISSION_BOOTSTRAP_DB_REQUIRED');
  if (!auth || !auth.uid) throw new Error('MISSION_BOOTSTRAP_AUTH_REQUIRED');
  const plan = buildMissionShellBootstrapPlan({ payload, actorId: auth.uid, recordedAt });
  const requestRef = db.collection('mission_bootstrap_requests').doc(plan.requestKeyHash);
  const parentRef = db.collection('mission_realms').doc(plan.missionId);
  const userRef = db.collection('users').doc(auth.uid);
  const [userSnap, requestSnap, parentSnap] = await Promise.all([
    transaction.get(userRef), transaction.get(requestRef), transaction.get(parentRef),
  ]);
  assertActiveFounder(auth, userSnap.exists ? userSnap.data() : {});

  if (requestSnap.exists) {
    assertBootstrapRequestReplay(requestSnap.data() || {}, plan);
    if (!parentSnap.exists) throw new Error('MISSION_BOOTSTRAP_REALM_MISSING');
    assertExistingShellReplay(parentSnap.data() || {}, plan);
    return { success: true, idempotent: true, missionId: plan.missionId, cycleKey: plan.cycleKey, state: 'AWAITING_OFFICIAL_SOURCE_PAIR' };
  }

  if (parentSnap.exists) {
    assertExistingShellReplay(parentSnap.data() || {}, plan);
    transaction.create(requestRef, plan.requestRecord);
    return { success: true, idempotent: true, missionId: plan.missionId, cycleKey: plan.cycleKey, state: 'AWAITING_OFFICIAL_SOURCE_PAIR' };
  }

  transaction.create(parentRef, plan.realm);
  transaction.create(requestRef, plan.requestRecord);
  return { success: true, idempotent: false, missionId: plan.missionId, cycleKey: plan.cycleKey, state: 'AWAITING_OFFICIAL_SOURCE_PAIR' };
}

module.exports = {
  assertBootstrapRequestReplay,
  assertExistingShellReplay,
  buildMissionShellBootstrapPlan,
  executeMissionShellBootstrap,
};
