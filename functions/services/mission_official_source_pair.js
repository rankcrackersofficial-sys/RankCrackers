'use strict';

const crypto = require('crypto');

const SOURCE_TYPES = Object.freeze(['notification', 'syllabus']);
const SHA256_HEX = /^[a-f0-9]{64}$/i;
const PAIR_CONTRACT_VERSION = 'mission_source_pair_v1';

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function normalizeSha256(value, code) {
  if (typeof value !== 'string' || !SHA256_HEX.test(value.trim())) throw new Error(code);
  return value.trim().toLowerCase();
}

function assertOfficialSource({ source, missionId, cycleKey, authorityKey, sourceType, preflight }) {
  if (!source || typeof source !== 'object') throw new Error('OFFICIAL_SOURCE_MISSING');
  if (!SOURCE_TYPES.includes(sourceType) || source.sourceType !== sourceType) throw new Error('OFFICIAL_SOURCE_TYPE_MISMATCH');
  if (source.status !== 'VERIFIED' || source.verificationState !== 'verified' || source.governanceStatus !== 'ACTIVE') throw new Error('OFFICIAL_SOURCE_NOT_VERIFIED');
  if (source.verifiedBy !== 'mission_source_pair_verifier_v1') throw new Error('OFFICIAL_SOURCE_BACKEND_ATTESTATION_REQUIRED');
  if (source.missionId !== missionId) throw new Error('OFFICIAL_SOURCE_MISSION_BINDING_MISMATCH');
  if (source.cycleKey !== cycleKey) throw new Error('OFFICIAL_SOURCE_CYCLE_BINDING_MISMATCH');
  if (source.authorityKey !== authorityKey) throw new Error('OFFICIAL_SOURCE_AUTHORITY_MISMATCH');
  if (source.isOfficial !== true) throw new Error('OFFICIAL_SOURCE_DOMAIN_UNPROVEN');

  const documentId = requiredString(source.documentId || source.id, 'OFFICIAL_SOURCE_ID_REQUIRED');
  const storagePath = requiredString(source.storagePath, 'OFFICIAL_SOURCE_STORAGE_PATH_REQUIRED');
  const safePrefix = `mission_realms/${missionId}/official_documents/`;
  if (!storagePath.startsWith(safePrefix) || storagePath.includes('..')) {
    throw new Error('OFFICIAL_SOURCE_STORAGE_PATH_MISMATCH');
  }

  const expectedSha256 = normalizeSha256(source.expectedSha256, 'OFFICIAL_SOURCE_EXPECTED_SHA_INVALID');
  const actualSha256 = normalizeSha256(source.actualSha256, 'OFFICIAL_SOURCE_ACTUAL_SHA_INVALID');
  const contentSha256 = normalizeSha256(source.contentSha256 || actualSha256, 'OFFICIAL_SOURCE_CONTENT_SHA_INVALID');
  const roleAddressedId = `${sourceType}_${actualSha256}`;
  if (expectedSha256 !== actualSha256 || contentSha256 !== actualSha256
      || (documentId !== actualSha256 && documentId !== roleAddressedId)) {
    throw new Error('OFFICIAL_SOURCE_SHA_MISMATCH');
  }

  if (!['en', 'eng', 'english'].includes(String(source.language || '').trim().toLowerCase())) {
    throw new Error('OFFICIAL_SOURCE_LANGUAGE_UNSUPPORTED');
  }
  if (typeof preflight !== 'function') throw new Error('OFFICIAL_SOURCE_PREFLIGHT_REQUIRED');

  const report = preflight({
    source: {
      sourceId: documentId,
      sourceType,
      missionId,
      cycleKey,
      governanceStatus: source.governanceStatus,
      verificationState: source.verificationState,
      isOfficial: true,
      officialDomain: source.officialDomain,
      language: source.language,
      expectedSha256,
      actualSha256,
      authorityKey: source.authorityKey,
      boundMissionId: source.missionId,
      boundCycleKey: source.cycleKey,
    },
    expectation: { missionId, cycleKey, sourceType, expectedSha256, authorityKey },
  });
  if (!report || report.status !== 'PASS') throw new Error('OFFICIAL_SOURCE_PREFLIGHT_FAILED');

  return Object.freeze({
    documentId,
    sourceType,
    missionId,
    cycleKey,
    authorityKey,
    storagePath,
    sha256: actualSha256,
    contentSha256,
    officialDomain: requiredString(source.officialDomain, 'OFFICIAL_SOURCE_DOMAIN_REQUIRED'),
    language: String(source.language).trim().toLowerCase(),
  });
}

function assertVerifiedOfficialSourcePair({ missionId, cycleKey, authorityKey, sources, preflight, schemaVersion }) {
  requiredString(missionId, 'MISSION_ID_REQUIRED');
  requiredString(cycleKey, 'CYCLE_KEY_REQUIRED');
  requiredString(authorityKey, 'AUTHORITY_KEY_REQUIRED');
  requiredString(schemaVersion, 'SOURCE_PAIR_SCHEMA_VERSION_REQUIRED');
  if (!Array.isArray(sources) || sources.length !== 2) throw new Error('OFFICIAL_SOURCE_PAIR_REQUIRES_EXACTLY_TWO');

  const byType = new Map();
  for (const source of sources) {
    const type = source && source.sourceType;
    if (!SOURCE_TYPES.includes(type) || byType.has(type)) throw new Error('OFFICIAL_SOURCE_PAIR_TYPES_INVALID');
    byType.set(type, source);
  }
  if (!byType.has('notification') || !byType.has('syllabus')) {
    throw new Error('OFFICIAL_SOURCE_PAIR_INCOMPLETE');
  }

  const notification = assertOfficialSource({
    source: byType.get('notification'), missionId, cycleKey, authorityKey,
    sourceType: 'notification', preflight,
  });
  const syllabus = assertOfficialSource({
    source: byType.get('syllabus'), missionId, cycleKey, authorityKey,
    sourceType: 'syllabus', preflight,
  });

  const pairDigest = crypto.createHash('sha256')
    .update([missionId, cycleKey, authorityKey, notification.sha256, syllabus.sha256, schemaVersion].join('\n'))
    .digest('hex');
  const taskId = `mission_source_pair_${pairDigest}`;

  return Object.freeze({
    contractVersion: PAIR_CONTRACT_VERSION,
    taskId,
    missionId,
    cycleKey,
    authorityKey,
    schemaVersion,
    sources: Object.freeze({ notification, syllabus }),
    job: Object.freeze({
      id: taskId,
      queueContract: PAIR_CONTRACT_VERSION,
      type: 'MISSION_SOURCE_PAIR',
      status: 'received',
      payload: Object.freeze({
        missionId,
        cycleKey,
        authorityKey,
        schemaVersion,
        notificationDocumentId: notification.documentId,
        notificationSha256: notification.sha256,
        notificationStoragePath: notification.storagePath,
        syllabusDocumentId: syllabus.documentId,
        syllabusSha256: syllabus.sha256,
        syllabusStoragePath: syllabus.storagePath,
      }),
    }),
  });
}

module.exports = {
  PAIR_CONTRACT_VERSION,
  SOURCE_TYPES,
  assertVerifiedOfficialSourcePair,
};
