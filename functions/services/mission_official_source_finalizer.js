'use strict';

const crypto = require('crypto');
const { canonicalAuthorityRegistry } = require('./authority_intelligence');
const { assertVerifiedOfficialSourcePair } = require('./mission_official_source_pair');

const ALLOWED_SOURCE_TYPES = Object.freeze(['notification', 'syllabus']);
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}
function normalizeSourceUrl(value) {
  const raw = requiredString(value, 'OFFICIAL_SOURCE_URL_REQUIRED');
  let url;
  try { url = new URL(raw); } catch (_) { throw new Error('OFFICIAL_SOURCE_URL_INVALID'); }
  if (url.protocol !== 'https:') throw new Error('OFFICIAL_SOURCE_HTTPS_REQUIRED');
  url.hash = '';
  return url.toString();
}
function assertOfficialUrl(url, authorityKey) {
  if (!canonicalAuthorityRegistry.isDomainApprovedForAuthority(url, authorityKey)) {
    throw new Error('OFFICIAL_SOURCE_DOMAIN_NOT_APPROVED');
  }
  return new URL(url).hostname.toLowerCase();
}
function computeSha256(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new Error('OFFICIAL_SOURCE_BYTES_REQUIRED');
  return crypto.createHash('sha256').update(bytes).digest('hex');
}
function assertPdf(bytes, mimeType) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) throw new Error('OFFICIAL_SOURCE_MIME_UNSUPPORTED');
  if (bytes.length > MAX_SOURCE_BYTES) throw new Error('OFFICIAL_SOURCE_TOO_LARGE');
  if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('OFFICIAL_SOURCE_PDF_SIGNATURE_INVALID');
}
function buildFinalizedOfficialSource({ missionId, cycleKey, authorityKey, sourceType, sourceUrl, bytes, mimeType = 'application/pdf', recordedAt }) {
  requiredString(missionId, 'MISSION_ID_REQUIRED');
  requiredString(cycleKey, 'CYCLE_KEY_REQUIRED');
  requiredString(authorityKey, 'AUTHORITY_KEY_REQUIRED');
  if (!ALLOWED_SOURCE_TYPES.includes(sourceType)) throw new Error('OFFICIAL_SOURCE_TYPE_UNSUPPORTED');
  const normalizedUrl = normalizeSourceUrl(sourceUrl);
  const officialDomain = assertOfficialUrl(normalizedUrl, authorityKey);
  assertPdf(bytes, mimeType);
  const sha256 = computeSha256(bytes);
  const storagePath = `mission_realms/${missionId}/official_documents/${sha256}/source.pdf`;
  return Object.freeze({
    documentId: sha256, sourceType, missionId, cycleKey, authorityKey,
    sourceUrl: normalizedUrl, officialDomain, mimeType, byteLength: bytes.length,
    expectedSha256: sha256, actualSha256: sha256, sha256,
    storagePath, language: 'english', isOfficial: true,
    status: 'PENDING_SOURCE_VERIFICATION', verifiedBy: null,
    verificationBasis: 'SERVER_BYTES_SHA256_AND_AUTHORITY_DOMAIN_PREFLIGHT_ONLY',
    recordedAt: recordedAt || null,
  });
}
async function finalizeOfficialSource({ storage, missionId, cycleKey, authorityKey, sourceType, sourceUrl, stagedStoragePath, mimeType, recordedAt }) {
  if (!storage || typeof storage.bucket !== 'function') throw new Error('OFFICIAL_SOURCE_STORAGE_REQUIRED');
  const staged = requiredString(stagedStoragePath, 'OFFICIAL_SOURCE_STAGED_PATH_REQUIRED');
  if (!staged.startsWith('mission_source_staging/') || staged.includes('..')) throw new Error('OFFICIAL_SOURCE_STAGED_PATH_INVALID');
  const file = storage.bucket().file(staged);
  const [metadata] = await file.getMetadata();
  const effectiveMime = mimeType || metadata.contentType || '';
  const [bytes] = await file.download();
  const source = buildFinalizedOfficialSource({ missionId, cycleKey, authorityKey, sourceType, sourceUrl, bytes, mimeType: effectiveMime, recordedAt });
  const destination = storage.bucket().file(source.storagePath);
  const [exists] = await destination.exists();
  if (!exists) await destination.save(bytes, { resumable: false, metadata: { contentType: effectiveMime, metadata: { sourceSha256: source.sha256, missionId, cycleKey, authorityKey, sourceType } } });
  else {
    const [existing] = await destination.download();
    if (computeSha256(existing) !== source.sha256) throw new Error('OFFICIAL_SOURCE_IMMUTABLE_OBJECT_CONFLICT');
  }
  return source;
}
function buildSourcePairTask({ missionId, cycleKey, authorityKey, notification, syllabus, preflight, schemaVersion = 'mission_source_pair_v1' }) {
  if (notification?.status !== 'VERIFIED' || syllabus?.status !== 'VERIFIED') throw new Error('OFFICIAL_SOURCE_PAIR_GOVERNED_VERIFICATION_REQUIRED');
  if (notification?.status !== 'VERIFIED' || syllabus?.status !== 'VERIFIED') throw new Error('OFFICIAL_SOURCE_PAIR_GOVERNED_VERIFICATION_REQUIRED');
  return assertVerifiedOfficialSourcePair({ missionId, cycleKey, authorityKey, sources: [notification, syllabus], preflight, schemaVersion });
}
module.exports = { ALLOWED_SOURCE_TYPES, MAX_SOURCE_BYTES, computeSha256, buildFinalizedOfficialSource, finalizeOfficialSource, buildSourcePairTask };
