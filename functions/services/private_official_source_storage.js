'use strict';

const crypto = require('node:crypto');

const SHA256_HEX = /^[a-f0-9]{64}$/i;
const REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/;
const SOURCE_TYPES = Object.freeze(['notification', 'syllabus']);

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function normalizeSha256(value, code) {
  const normalized = requiredString(value, code).toLowerCase();
  if (!SHA256_HEX.test(normalized)) throw new Error(code);
  return normalized;
}

function toBuffer(bytes) {
  if (Buffer.isBuffer(bytes)) return Buffer.from(bytes);
  if (bytes instanceof Uint8Array) return Buffer.from(bytes);
  throw new Error('PRIVATE_OFFICIAL_SOURCE_BYTES_INVALID');
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function buildPrivateOfficialSourceStoragePath({ missionId, sourceType, requestId }) {
  const cleanMissionId = requiredString(missionId, 'MISSION_ID_REQUIRED');
  if (!SOURCE_TYPES.includes(sourceType)) throw new Error('OFFICIAL_SOURCE_TYPE_INVALID');
  const cleanRequestId = requiredString(requestId, 'OFFICIAL_SOURCE_STAGE_REQUEST_ID_REQUIRED');
  if (!REQUEST_ID.test(cleanRequestId)) throw new Error('OFFICIAL_SOURCE_STAGE_REQUEST_ID_INVALID');
  return `mission_realms/${cleanMissionId}/official_documents/${sourceType}/staging/${cleanRequestId}`;
}

function assertPrivateOfficialSourceStoragePath(storagePath) {
  const normalized = requiredString(storagePath, 'PRIVATE_OFFICIAL_SOURCE_STORAGE_PATH_REQUIRED');
  if (normalized.includes('..') || normalized.includes('\\') || normalized.includes('?')
      || normalized.endsWith('/')
      || !/^mission_realms\/[^/]+\/official_documents\/(notification|syllabus)\/staging\/[A-Za-z0-9._:-]{8,128}$/.test(normalized)) {
    throw new Error('PRIVATE_OFFICIAL_SOURCE_STORAGE_PATH_MISMATCH');
  }
  return normalized;
}

function assertPrivateMetadata(metadata) {
  if (metadata === undefined) return {};
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('PRIVATE_OFFICIAL_SOURCE_METADATA_INVALID');
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (/url|uri/i.test(key)) throw new Error('PRIVATE_OFFICIAL_SOURCE_METADATA_URL_FORBIDDEN');
    if (typeof value !== 'string' || value.trim() === '' || /^https?:\/\//i.test(value)) {
      throw new Error('PRIVATE_OFFICIAL_SOURCE_METADATA_INVALID');
    }
  }
  return { ...metadata };
}

function isPreconditionConflict(error) {
  return Boolean(error && [409, 412, '409', '412'].includes(error.code || error.statusCode));
}

/**
 * Trusted Admin SDK adapter for private official source bytes.
 *
 * The adapter deliberately exposes only object put/read operations. It never
 * signs, publishes, or accepts a client upload URL. Firestore and Storage
 * security rules remain the client boundary; Admin SDK is the trusted writer.
 */
function createFirebaseAdminPrivateOfficialSourceStorageAdapter({ bucket } = {}) {
  if (!bucket || typeof bucket.file !== 'function') {
    throw new Error('PRIVATE_OFFICIAL_SOURCE_BUCKET_REQUIRED');
  }

  async function readPrivateObject({ storagePath, expectedSha256 } = {}) {
    const normalizedPath = assertPrivateOfficialSourceStoragePath(storagePath);
    const file = bucket.file(normalizedPath);
    if (!file || typeof file.exists !== 'function' || typeof file.download !== 'function') {
      throw new Error('PRIVATE_OFFICIAL_SOURCE_FILE_ADAPTER_INVALID');
    }
    const [exists] = await file.exists();
    if (!exists) throw new Error('PRIVATE_OFFICIAL_SOURCE_NOT_FOUND');
    const [downloaded] = await file.download();
    const bytes = toBuffer(downloaded);
    const actualSha256 = sha256(bytes);
    if (expectedSha256 !== undefined
        && normalizeSha256(expectedSha256, 'PRIVATE_OFFICIAL_SOURCE_EXPECTED_SHA_INVALID') !== actualSha256) {
      throw new Error('PRIVATE_OFFICIAL_SOURCE_SHA_MISMATCH');
    }
    return Object.freeze({ storagePath: normalizedPath, bytes, sha256: actualSha256 });
  }

  async function putPrivateObject({ storagePath, bytes, contentType, metadata } = {}) {
    const normalizedPath = assertPrivateOfficialSourceStoragePath(storagePath);
    const payload = toBuffer(bytes);
    if (payload.length === 0) throw new Error('PRIVATE_OFFICIAL_SOURCE_BYTES_EMPTY');
    const actualSha256 = sha256(payload);
    const file = bucket.file(normalizedPath);
    const [exists] = await file.exists();
    if (exists) {
      const existing = await readPrivateObject({ storagePath: normalizedPath });
      if (existing.sha256 === actualSha256) {
        return Object.freeze({ storagePath: normalizedPath, sha256: actualSha256, idempotent: true });
      }
      throw new Error('PRIVATE_OFFICIAL_SOURCE_OBJECT_CONFLICT');
    }

    const safeMetadata = assertPrivateMetadata(metadata);
    try {
      await file.save(payload, {
        resumable: false,
        validation: 'md5',
        ...(contentType ? { contentType: requiredString(contentType, 'PRIVATE_OFFICIAL_SOURCE_CONTENT_TYPE_INVALID') } : {}),
        metadata: {
          cacheControl: 'private, max-age=0, no-store',
          metadata: {
            ...safeMetadata,
            rcPrivateOfficialSource: 'true',
            rcSourceSha256: actualSha256,
          },
        },
        preconditionOpts: { ifGenerationMatch: 0 },
      });
    } catch (error) {
      if (!isPreconditionConflict(error)) throw error;
      const existing = await readPrivateObject({ storagePath: normalizedPath });
      if (existing.sha256 === actualSha256) {
        return Object.freeze({ storagePath: normalizedPath, sha256: actualSha256, idempotent: true });
      }
      throw new Error('PRIVATE_OFFICIAL_SOURCE_OBJECT_CONFLICT');
    }

    return Object.freeze({ storagePath: normalizedPath, sha256: actualSha256, idempotent: false });
  }

  return Object.freeze({ putPrivateObject, readPrivateObject });
}

module.exports = {
  assertPrivateOfficialSourceStoragePath,
  buildPrivateOfficialSourceStoragePath,
  createFirebaseAdminPrivateOfficialSourceStorageAdapter,
  sha256,
};
