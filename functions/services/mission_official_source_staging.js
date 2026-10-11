'use strict';

const crypto = require('node:crypto');
const {
  sourceSlotIdentity,
  sourceVersionIdentity,
} = require('./canonical_source_authority');
const {
  assertVerifiedOfficialSourcePair,
  PAIR_CONTRACT_VERSION,
} = require('./mission_official_source_pair');
const {
  preflightSourceBinding,
} = require('./mission_source_preflight');

const SOURCE_PAIR_SCHEMA_VERSION = 'source_pair_schema_v1';
const SOURCE_TYPES = Object.freeze(['notification', 'syllabus']);
const SOURCE_STORAGE_PREFIX = 'mission_realms/';
const VERIFIED_BY = 'mission_source_pair_verifier_v1';
const SHA256_HEX = /^[a-f0-9]{64}$/i;

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function normalizeSha256(value, code) {
  const normalized = requiredString(value, code).toLowerCase();
  if (!SHA256_HEX.test(normalized)) throw new Error(code);
  return normalized;
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function canonicalStoragePath(path, missionId) {
  const normalized = requiredString(path, 'OFFICIAL_SOURCE_STORAGE_PATH_REQUIRED');
  const prefix = `${SOURCE_STORAGE_PREFIX}${missionId}/official_documents/`;
  if (!normalized.startsWith(prefix)
      || normalized.includes('..')
      || normalized.includes('\\')
      || normalized.includes('?')
      || normalized.endsWith('/')) {
    throw new Error('OFFICIAL_SOURCE_STORAGE_PATH_MISMATCH');
  }
  return normalized;
}

function httpsUrl(value) {
  const raw = requiredString(value, 'OFFICIAL_SOURCE_URL_REQUIRED');
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (_) {
    throw new Error('OFFICIAL_SOURCE_URL_INVALID');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) {
    throw new Error('OFFICIAL_SOURCE_URL_INVALID');
  }
  return parsed;
}

function hostname(value, code) {
  const raw = requiredString(value, code);
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch (_) {
    throw new Error(code);
  }
}

function assertHiddenMissionShell(realm, { missionId, cycleKey, authorityKey }) {
  if (!realm || typeof realm !== 'object') throw new Error('MISSION_SHELL_NOT_FOUND');
  const identityValues = [realm.id, realm.missionId, realm.realm_id, realm.canonicalMissionIdentity]
    .filter(value => value !== undefined && value !== null && String(value).trim() !== '');
  if (identityValues.length === 0 || identityValues.some(value => String(value) !== missionId)) {
    throw new Error('MISSION_SHELL_IDENTITY_MISMATCH');
  }
  if (realm.status !== 'PASSIVE') throw new Error('MISSION_SHELL_NOT_PASSIVE');
  const visibility = realm.visibilityGate || {};
  const legacyVisibility = realm.visibility || {};
  const visible = [
    realm.studentVisible,
    realm.catalogVisible,
    realm.catalogDiscoverable,
    realm.userPanelVisible,
    realm.cardVisible,
    visibility.studentVisible,
    visibility.catalogVisible,
    visibility.userPanelVisible,
    visibility.cardVisible,
    legacyVisibility.studentVisible,
    legacyVisibility.catalogVisible,
    legacyVisibility.userPanelVisible,
    legacyVisibility.cardVisible,
  ].some(value => value === true);
  if (visible) throw new Error('MISSION_SHELL_VISIBILITY_CONFLICT');

  if (realm.authorityKey !== authorityKey) throw new Error('MISSION_SHELL_AUTHORITY_MISMATCH');
  if (realm.missionSetup?.cycleKey !== cycleKey) throw new Error('MISSION_SHELL_CYCLE_MISMATCH');
  if (realm.missionSetup?.syllabusBindingMode !== 'SEPARATE') {
    throw new Error('MISSION_SHELL_REQUIRES_SEPARATE_OFFICIAL_SOURCES');
  }
  if (realm.missionSetup?.sourcePairRequired !== true) {
    throw new Error('MISSION_SHELL_SOURCE_PAIR_REQUIREMENT_MISSING');
  }
  if (realm.missionSetup?.phase !== 'SHELL_CREATED') {
    throw new Error('MISSION_SHELL_NOT_AWAITING_SOURCE_PAIR');
  }
  return true;
}

function assertBackendAuthorization(authorizeStage, context) {
  if (typeof authorizeStage !== 'function') throw new Error('BACKEND_STAGE_AUTHORIZATION_REQUIRED');
  const result = authorizeStage(context);
  if (result && typeof result.then === 'function') return result.then(value => {
    if (value !== true) throw new Error('BACKEND_STAGE_AUTHORIZATION_FAILED');
    return true;
  });
  if (result !== true) throw new Error('BACKEND_STAGE_AUTHORIZATION_FAILED');
  return true;
}

function pairIdentityDigest({ requestId, pair, sources }) {
  return crypto.createHash('sha256').update(JSON.stringify({
    requestId,
    taskId: pair.taskId,
    sources: sources.map(source => ({
      sourceType: source.sourceType,
      officialUrl: source.officialUrl,
      officialDomain: source.officialDomain,
      storagePath: source.storagePath,
      sha256: source.actualSha256,
    })),
  })).digest('hex');
}

function assertExistingArtifactAbsent(snapshot, code) {
  if (snapshot && snapshot.exists) throw new Error(code);
}

function buildSourceVersionRecord({ source, slot, version, missionId, cycleKey, authorityKey, actorId, requestKeyHash, recordedAt }) {
  return {
    ...slot,
    ...version,
    missionId,
    cycleKey,
    authorityKey,
    documentId: source.documentId,
    sourceType: source.sourceType,
    documentFamily: source.sourceType.toUpperCase(),
    scope: 'MISSION_COMMON',
    originalFileName: source.fileName || null,
    mimeType: source.mimeType || null,
    fileSize: source.fileSize,
    storagePath: source.storagePath,
    officialUrl: source.officialUrl,
    officialDomain: source.officialDomain,
    language: source.language,
    isOfficial: true,
    sourceSha256: source.actualSha256,
    expectedSha256: source.expectedSha256,
    actualSha256: source.actualSha256,
    verificationState: 'VERIFIED',
    verificationMethod: 'BACKEND_STAGED_BYTES_SHA256_V1',
    verifiedBy: VERIFIED_BY,
    activationState: 'CANDIDATE',
    canonicalSource: false,
    studentTruth: false,
    immutable: true,
    stagedBy: actorId,
    requestKeyHash,
    createdAt: recordedAt,
    verifiedAt: recordedAt,
  };
}

function buildOfficialDocumentRecord({ source, slot, version, missionId, cycleKey, authorityKey, actorId, requestKeyHash, taskId, recordedAt }) {
  return {
    id: source.documentId,
    documentId: source.documentId,
    missionId,
    cycleKey,
    authorityKey,
    sourceType: source.sourceType,
    documentFamily: source.sourceType.toUpperCase(),
    status: 'VERIFIED',
    verificationState: 'VERIFIED',
    verificationMethod: 'BACKEND_STAGED_BYTES_SHA256_V1',
    verifiedBy: VERIFIED_BY,
    isOfficial: true,
    officialUrl: source.officialUrl,
    officialDomain: source.officialDomain,
    language: source.language,
    storagePath: source.storagePath,
    sourceSlotKey: slot.sourceSlotKey,
    sourceSlotId: slot.sourceSlotId,
    sourceVersionId: version.sourceVersionId,
    sourceSha256: source.actualSha256,
    expectedSha256: source.expectedSha256,
    actualSha256: source.actualSha256,
    activationState: 'CANDIDATE',
    canonicalSource: false,
    studentTruth: false,
    immutable: true,
    pairTaskId: taskId,
    stagedBy: actorId,
    requestKeyHash,
    createdAt: recordedAt,
    verifiedAt: recordedAt,
  };
}

/**
 * Finalizes exactly two backend-staged objects for a hidden mission shell.
 *
 * This is intentionally an internal service boundary, not a callable. The
 * caller must supply an authorization adapter and a server-side byte reader;
 * neither the source URL nor an AI worker is ever used to acquire bytes.
 * The adapter/reader contract is injectable so this slice cannot accidentally
 * invent a Codex service identity or perform a production write by itself.
 */
async function executeMissionOfficialSourcePairStaging({
  transaction,
  db,
  request = {},
  authorizeStage,
  readStagedBytes,
  recordedAt,
}) {
  if (!transaction) throw new Error('OFFICIAL_SOURCE_STAGE_TRANSACTION_REQUIRED');
  if (!db) throw new Error('OFFICIAL_SOURCE_STAGE_DB_REQUIRED');
  if (typeof readStagedBytes !== 'function') throw new Error('BACKEND_STAGED_BYTE_READER_REQUIRED');
  if (!recordedAt) throw new Error('OFFICIAL_SOURCE_STAGE_RECORDED_AT_REQUIRED');

  const requestId = requiredString(request.requestId, 'OFFICIAL_SOURCE_STAGE_REQUEST_ID_REQUIRED');
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(requestId)) throw new Error('OFFICIAL_SOURCE_STAGE_REQUEST_ID_INVALID');
  const missionId = requiredString(request.missionId, 'MISSION_ID_REQUIRED');
  const cycleKey = requiredString(request.cycleKey, 'CYCLE_KEY_REQUIRED');
  const authorityKey = requiredString(request.authorityKey, 'AUTHORITY_KEY_REQUIRED');
  const actorId = requiredString(request.actorId, 'BACKEND_STAGE_ACTOR_REQUIRED');
  const schemaVersion = requiredString(request.schemaVersion, 'SOURCE_PAIR_SCHEMA_VERSION_REQUIRED');
  if (schemaVersion !== SOURCE_PAIR_SCHEMA_VERSION) throw new Error('SOURCE_PAIR_SCHEMA_VERSION_UNSUPPORTED');
  if (!Array.isArray(request.sources) || request.sources.length !== 2) {
    throw new Error('OFFICIAL_SOURCE_PAIR_REQUIRES_EXACTLY_TWO');
  }

  await assertBackendAuthorization(authorizeStage, { missionId, cycleKey, authorityKey, requestId, actorId });

  const realmRef = db.collection('mission_realms').doc(missionId);
  const requestKeyHash = crypto.createHash('sha256').update(`${missionId}:official-source-pair:${requestId}`).digest('hex');
  const requestRef = db.collection('mission_source_pair_requests').doc(requestKeyHash);
  const [realmSnap, requestSnap] = await Promise.all([
    transaction.get(realmRef),
    transaction.get(requestRef),
  ]);
  assertHiddenMissionShell(realmSnap.exists ? realmSnap.data() : null, { missionId, cycleKey, authorityKey });

  const byType = new Map();
  for (const input of request.sources) {
    if (!input || !SOURCE_TYPES.includes(input.sourceType) || byType.has(input.sourceType)) {
      throw new Error('OFFICIAL_SOURCE_PAIR_TYPES_INVALID');
    }
    byType.set(input.sourceType, input);
  }
  if (!byType.has('notification') || !byType.has('syllabus')) throw new Error('OFFICIAL_SOURCE_PAIR_INCOMPLETE');

  const stagedSources = [];
  const storagePaths = new Set();
  for (const sourceType of SOURCE_TYPES) {
    const input = byType.get(sourceType);
    if (input.missionId !== missionId) throw new Error('OFFICIAL_SOURCE_CYCLE_BINDING_MISMATCH');
    if (input.cycleKey !== cycleKey) throw new Error('OFFICIAL_SOURCE_CYCLE_BINDING_MISMATCH');
    if (input.authorityKey !== authorityKey) throw new Error('OFFICIAL_SOURCE_AUTHORITY_MISMATCH');
    if (input.isOfficial !== true) throw new Error('OFFICIAL_SOURCE_DOMAIN_UNPROVEN');

    const sourceUrl = httpsUrl(input.officialUrl);
    const officialDomain = hostname(input.officialDomain, 'OFFICIAL_SOURCE_DOMAIN_REQUIRED');
    if (sourceUrl.hostname.toLowerCase() !== officialDomain) throw new Error('OFFICIAL_SOURCE_URL_DOMAIN_MISMATCH');
    const storagePath = canonicalStoragePath(input.storagePath, missionId);
    if (storagePaths.has(storagePath)) throw new Error('OFFICIAL_SOURCE_STORAGE_ARTIFACTS_NOT_DISTINCT');
    storagePaths.add(storagePath);

    const bytes = await readStagedBytes(storagePath, { missionId, cycleKey, authorityKey, sourceType });
    if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) throw new Error('OFFICIAL_SOURCE_BYTES_INVALID');
    if (bytes.length === 0) throw new Error('OFFICIAL_SOURCE_BYTES_EMPTY');
    const actualSha256 = sha256(bytes);
    if (input.expectedSha256 !== undefined && normalizeSha256(input.expectedSha256, 'OFFICIAL_SOURCE_EXPECTED_SHA_INVALID') !== actualSha256) {
      throw new Error('OFFICIAL_SOURCE_SHA_MISMATCH');
    }

    stagedSources.push({
      sourceType,
      status: 'VERIFIED',
      verifiedBy: VERIFIED_BY,
      missionId,
      cycleKey,
      authorityKey,
      isOfficial: true,
      officialUrl: sourceUrl.toString(),
      officialDomain,
      language: requiredString(input.language, 'OFFICIAL_SOURCE_LANGUAGE_REQUIRED').toLowerCase(),
      documentId: actualSha256,
      storagePath,
      expectedSha256: actualSha256,
      actualSha256,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: bytes.length,
    });
  }

  if (stagedSources[0].actualSha256 === stagedSources[1].actualSha256) {
    throw new Error('OFFICIAL_SOURCE_PAIR_ARTIFACTS_NOT_DISTINCT');
  }

  const pair = assertVerifiedOfficialSourcePair({
    missionId,
    cycleKey,
    authorityKey,
    schemaVersion,
    sources: stagedSources,
    preflight: ({ source, expectation }) => preflightSourceBinding({ source, expectation }),
  });
  const identityDigest = pairIdentityDigest({ requestId, pair, sources: stagedSources });

  if (requestSnap.exists) {
    const prior = requestSnap.data() || {};
    if (prior.identityDigest !== identityDigest || prior.taskId !== pair.taskId) {
      throw new Error('OFFICIAL_SOURCE_STAGE_IDEMPOTENCY_CONFLICT');
    }
    return {
      success: true,
      idempotent: true,
      missionId,
      cycleKey,
      authorityKey,
      requestKeyHash,
      taskId: pair.taskId,
      status: 'RECEIVED',
    };
  }

  const artifactRefs = [];
  const slotRefs = [];
  const versionRefs = [];
  const identities = [];
  for (const source of stagedSources) {
    const slot = sourceSlotIdentity({ missionId, documentFamily: source.sourceType.toUpperCase(), scope: 'MISSION_COMMON' });
    const version = sourceVersionIdentity(slot.sourceSlotKey, source.actualSha256);
    const slotRef = realmRef.collection('source_slots').doc(slot.sourceSlotId);
    const versionRef = slotRef.collection('source_versions').doc(version.sourceVersionId);
    const documentRef = realmRef.collection('official_documents').doc(source.documentId);
    slotRefs.push(slotRef);
    versionRefs.push(versionRef);
    artifactRefs.push(documentRef);
    identities.push({ source, slot, version, slotRef, versionRef, documentRef });
  }
  const existingSnapshots = await Promise.all([
    transaction.get(requestRef),
    ...artifactRefs.map(ref => transaction.get(ref)),
    ...versionRefs.map(ref => transaction.get(ref)),
    ...slotRefs.map(ref => transaction.get(ref)),
  ]);
  assertExistingArtifactAbsent(existingSnapshots[0], 'OFFICIAL_SOURCE_STAGE_IDEMPOTENCY_CONFLICT');
  for (let index = 1; index <= artifactRefs.length; index += 1) {
    assertExistingArtifactAbsent(existingSnapshots[index], 'OFFICIAL_SOURCE_ARTIFACT_CONFLICT');
  }
  for (let index = 1 + artifactRefs.length; index < existingSnapshots.length; index += 1) {
    if (index < 1 + artifactRefs.length + versionRefs.length) {
      assertExistingArtifactAbsent(existingSnapshots[index], 'OFFICIAL_SOURCE_VERSION_CONFLICT');
    }
  }
  const slotSnapshotStart = 1 + artifactRefs.length + versionRefs.length;
  for (let index = slotSnapshotStart; index < existingSnapshots.length; index += 1) {
    const slotSnapshot = existingSnapshots[index];
    if (slotSnapshot.exists && slotSnapshot.data()?.sourceSlotKey !== identities[index - slotSnapshotStart].slot.sourceSlotKey) {
      throw new Error('OFFICIAL_SOURCE_SLOT_CONFLICT');
    }
  }

  for (let index = 0; index < identities.length; index += 1) {
    const item = identities[index];
    const existingSlot = existingSnapshots[slotSnapshotStart + index];
    const nextSequence = Number(existingSlot.data()?.nextSequence || 0) + 1;
    const sourceRecord = buildSourceVersionRecord({
      source: item.source,
      slot: item.slot,
      version: item.version,
      missionId,
      cycleKey,
      authorityKey,
      actorId,
      requestKeyHash,
      recordedAt,
    });
    transaction.set(item.slotRef, {
      ...item.slot,
      missionId,
      documentFamily: item.source.sourceType.toUpperCase(),
      nextSequence,
      updatedAt: recordedAt,
      ...(existingSlot.exists ? {} : {
        canonicalVersionId: null,
        canonicalSha256: null,
        activationEpoch: 0,
      }),
    }, { merge: true });
    transaction.create(item.versionRef, { ...sourceRecord, versionNumber: nextSequence });
    transaction.create(item.documentRef, buildOfficialDocumentRecord({
      source: item.source,
      slot: item.slot,
      version: item.version,
      missionId,
      cycleKey,
      authorityKey,
      actorId,
      requestKeyHash,
      taskId: pair.taskId,
      recordedAt,
    }));
  }
  transaction.create(requestRef, {
    requestId,
    requestKeyHash,
    identityDigest,
    missionId,
    cycleKey,
    authorityKey,
    schemaVersion,
    taskId: pair.taskId,
    contractVersion: PAIR_CONTRACT_VERSION,
    status: 'RECEIVED',
    sources: stagedSources.map(source => ({
      sourceType: source.sourceType,
      documentId: source.documentId,
      storagePath: source.storagePath,
      sha256: source.actualSha256,
      officialUrl: source.officialUrl,
      officialDomain: source.officialDomain,
    })),
    job: pair.job,
    createdBy: actorId,
    createdAt: recordedAt,
  });

  return {
    success: true,
    idempotent: false,
    missionId,
    cycleKey,
    authorityKey,
    requestKeyHash,
    taskId: pair.taskId,
    status: 'RECEIVED',
    sourceDocumentIds: stagedSources.map(source => source.documentId),
  };
}

module.exports = {
  SOURCE_PAIR_SCHEMA_VERSION,
  executeMissionOfficialSourcePairStaging,
  assertHiddenMissionShell,
  canonicalStoragePath,
};
