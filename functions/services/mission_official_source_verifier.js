'use strict';

const { computeSha256 } = require('./mission_official_source_finalizer');
const { canonicalAuthorityRegistry } = require('./authority_intelligence');
const { preflightSourceBinding } = require('./mission_source_preflight');

const VERIFIER_ID = 'mission_source_pair_verifier_v1';

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

async function verifyOfficialSource({ storage, source, preflight = preflightSourceBinding }) {
  if (!storage || typeof storage.bucket !== 'function') throw new Error('OFFICIAL_SOURCE_VERIFIER_STORAGE_REQUIRED');
  if (!source || typeof source !== 'object') throw new Error('OFFICIAL_SOURCE_VERIFIER_SOURCE_REQUIRED');
  if (source.status !== 'PENDING_SOURCE_VERIFICATION' || source.verifiedBy != null) {
    throw new Error('OFFICIAL_SOURCE_VERIFIER_STATE_INVALID');
  }

  const missionId = requiredString(source.missionId, 'MISSION_ID_REQUIRED');
  const cycleKey = requiredString(source.cycleKey, 'CYCLE_KEY_REQUIRED');
  const authorityKey = requiredString(source.authorityKey, 'AUTHORITY_KEY_REQUIRED');
  const sourceType = requiredString(source.sourceType, 'OFFICIAL_SOURCE_TYPE_REQUIRED');
  const storagePath = requiredString(source.storagePath, 'OFFICIAL_SOURCE_STORAGE_PATH_REQUIRED');
  const expectedPath = `mission_realms/${missionId}/official_documents/${source.documentId}/source.pdf`;
  if (storagePath !== expectedPath || storagePath.includes('..')) throw new Error('OFFICIAL_SOURCE_STORAGE_PATH_MISMATCH');

  const url = new URL(requiredString(source.sourceUrl, 'OFFICIAL_SOURCE_URL_REQUIRED'));
  if (url.protocol !== 'https:' || !canonicalAuthorityRegistry.isDomainApprovedForAuthority(url.toString(), authorityKey)) {
    throw new Error('OFFICIAL_SOURCE_DOMAIN_NOT_APPROVED');
  }

  let bytes;
  try {
    [bytes] = await storage.bucket().file(storagePath).download();
  } catch (_) {
    throw new Error('OFFICIAL_SOURCE_PERSISTED_BYTES_MISSING');
  }
  const persistedSha = computeSha256(bytes);
  const expectedSha = String(source.contentSha256 || source.actualSha256 || source.sha256 || '').toLowerCase();
  if (!expectedSha || persistedSha !== expectedSha) throw new Error('OFFICIAL_SOURCE_PERSISTED_BYTES_MISMATCH');

  const candidate = {
    ...source,
    actualSha256: persistedSha,
    contentSha256: persistedSha,
    verificationState: 'verified',
    governanceStatus: 'ACTIVE',
    isOfficial: true,
    language: source.language || 'english',
    boundMissionId: missionId,
    boundCycleKey: cycleKey,
  };
  const report = preflight({
    source: {
      sourceId: source.documentId,
      sourceType,
      verificationState: candidate.verificationState,
      governanceStatus: candidate.governanceStatus,
      isOfficial: true,
      officialDomain: source.officialDomain,
      authorityKey,
      language: candidate.language,
      expectedSha256: persistedSha,
      actualSha256: persistedSha,
      boundMissionId: missionId,
      boundCycleKey: cycleKey,
    },
    expectation: { missionId, cycleKey, sourceType, expectedSha256: persistedSha, authorityKey },
  });
  if (!report || report.status !== 'PASS') throw new Error('OFFICIAL_SOURCE_VERIFICATION_FAILED');

  return Object.freeze({
    ...candidate,
    status: 'VERIFIED',
    verifiedBy: VERIFIER_ID,
    verificationBasis: 'PERSISTED_BYTES_SHA256_AUTHORITY_DOMAIN_AND_BINDING',
  });
}

module.exports = { VERIFIER_ID, verifyOfficialSource };
