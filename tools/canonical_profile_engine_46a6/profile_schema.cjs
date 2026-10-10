'use strict';

const crypto = require('crypto');

/**
 * Supported Authority Tags
 */
const AUTHORITY_TAGS = Object.freeze([
  'SOURCE_VERIFIED',
  'FOUNDER_DECLARED',
  'SYSTEM_DERIVED',
  'UNKNOWN'
]);

/**
 * Supported Evidence Classes
 */
const EVIDENCE_CLASSES = Object.freeze([
  'BYTE_VERIFIED',
  'PORTAL_TEXT_VERIFIED',
  'PORTAL_REGISTRY_VERIFIED',
  'ADVERTISEMENT_ROW_VERIFIED',
  'REFERENCE_ONLY',
  'UNVERIFIED'
]);

/**
 * Supported Profile Lifecycle Statuses
 */
const PROFILE_STATUSES = Object.freeze([
  'DRAFT',
  'READY_FOR_REVIEW',
  'HOLD_FOR_REVIEW',
  'SOURCE_VERIFIED',
  'MATERIALIZATION_READY',
  'SUPERSEDED'
]);

/**
 * Volatile fields excluded from deterministic semantic profile hashing.
 * Timestamp-only changes must NOT alter the semantic profileHash.
 */
const VOLATILE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'lastCheckedAt',
  'lastVerifiedAt',
  'runtimeTimestamp',
  'timestamp',
  'manifestedAt',
  'mirroredAt',
  'profileHash', // The hash itself is excluded from hash computation
  'auditLogRef'
]);

/**
 * Recursively sorts an object's keys for deterministic serialization.
 * Strips volatile fields.
 */
function cleanAndSortForHash(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanAndSortForHash);
  }
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (VOLATILE_FIELDS.has(key)) {
      continue;
    }
    sorted[key] = cleanAndSortForHash(obj[key]);
  }
  return sorted;
}

/**
 * Computes deterministic SHA-256 profile semantic hash.
 * 
 * Rules:
 * 1. Same academic / authority semantics -> same hash
 * 2. Volatile timestamps excluded -> timestamp change does not alter hash
 * 3. Academic or source authority change -> different hash
 */
function computeProfileHash(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('INVALID_PROFILE_FOR_HASH: Profile must be an object.');
  }
  const cleaned = cleanAndSortForHash(profile);
  const serialized = JSON.stringify(cleaned);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

module.exports = {
  AUTHORITY_TAGS,
  EVIDENCE_CLASSES,
  PROFILE_STATUSES,
  VOLATILE_FIELDS,
  cleanAndSortForHash,
  computeProfileHash
};
