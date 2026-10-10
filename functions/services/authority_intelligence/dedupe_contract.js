/**
 * 🔱 PURE DEDUPE & PROVENANCE IDENTITY CONTRACT
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-AG2-PILOT-REGISTRY-AND-PURE-MONITOR-FOUNDATION-20260912
 *
 * Implements 5-tier deduplication and lineage tracking:
 * 1. URL Identity (Normalized URL SHA256)
 * 2. Reference / Advertisement Identity (Normalized notification reference token)
 * 3. Binary SHA (Document content SHA256)
 * 4. Semantic Event Signature (Composite authority + exam + updateType + year + reference)
 * 5. Source Lineage (Parent notice / corrigendum linkage chain)
 */

'use strict';

const crypto = require('crypto');
const { normalizeOfficialUrl, computeUrlHash } = require('./url_normalization');

/**
 * Normalizes an official notification or advertisement reference string.
 * e.g. "Advt. No. 06/Exam/2025-26" -> "advt_06_exam_2025_26"
 */
function normalizeReferenceString(ref) {
  if (ref == null) return 'unspecified_ref';
  const str = String(ref).trim().toLowerCase();
  const token = str.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return token || 'unspecified_ref';
}

/**
 * Computes the semantic event signature for an intelligence update.
 */
function computeSemanticEventSignature(input = {}) {
  const authorityKey = String(input.authorityKey || '').toLowerCase().trim();
  const examKey = String(input.examKey || input.examFamily || 'unspecified_exam').toLowerCase().trim();
  const updateType = String(input.updateType || 'OTHER_OFFICIAL_UPDATE').toUpperCase().trim();
  const year = input.targetYear != null ? String(input.targetYear).trim() : 'year_none';
  const ref = normalizeReferenceString(input.referenceNumber || input.advertisementNumber);

  const parts = [authorityKey, examKey, updateType, year, ref];
  const payload = parts.join('|');
  const signature = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');

  return {
    payload,
    signature,
    signature16: signature.slice(0, 16),
  };
}

/**
 * Generates the full 5-tier deduplication descriptor for an incoming discovery.
 */
function generateDedupeDescriptor(input = {}) {
  if (!input.authorityKey) {
    throw new Error('DEDUPE_CONTRACT_ERROR: authorityKey is required for dedupe signature generation.');
  }

  // 1. URL Identity
  let canonicalUrl = null;
  let urlHash = null;
  if (input.officialUrl) {
    canonicalUrl = normalizeOfficialUrl(input.officialUrl);
    urlHash = computeUrlHash(canonicalUrl);
  }

  // 2. Reference Identity
  const referenceIdentity = normalizeReferenceString(input.referenceNumber || input.advertisementNumber);

  // 3. Binary SHA
  let binarySha256 = null;
  if (input.documentSha256) {
    const rawSha = String(input.documentSha256).toLowerCase().replace(/^hash_/, '').trim();
    if (!/^[a-f0-9]{64}$/.test(rawSha)) {
      throw new Error(`DEDUPE_CONTRACT_ERROR: Malformed documentSha256 "${input.documentSha256}".`);
    }
    binarySha256 = rawSha;
  }

  // 4. Semantic Event Signature
  const semantic = computeSemanticEventSignature({
    authorityKey: input.authorityKey,
    examKey: input.examKey || input.examFamily,
    updateType: input.updateType,
    targetYear: input.targetYear,
    referenceNumber: input.referenceNumber || input.advertisementNumber,
  });

  // 5. Source Lineage
  const parentRef = input.parentReferenceNumber ? normalizeReferenceString(input.parentReferenceNumber) : null;
  const parentSha = input.parentDocumentSha256 ? String(input.parentDocumentSha256).toLowerCase().trim() : null;
  const sourceLineage = {
    parentReference: parentRef,
    parentDocumentSha256: parentSha,
    isCorrigendumOf: parentRef || parentSha ? true : false,
    lineageChain: Array.isArray(input.lineageChain) ? input.lineageChain.slice() : [],
  };

  // Deterministic Event Identity for collection: authority_intelligence_events
  // Prefers binary SHA if available, else falls back to semantic + URL combination
  let eventId;
  if (binarySha256) {
    eventId = `aievt_${binarySha256.slice(0, 24)}`;
  } else {
    const composite = [input.authorityKey, semantic.signature, urlHash || referenceIdentity].join('\0');
    const hash = crypto.createHash('sha256').update(composite, 'utf8').digest('hex');
    eventId = `aievt_${hash.slice(0, 24)}`;
  }

  return {
    eventId,
    authorityKey: input.authorityKey,
    urlIdentity: {
      canonicalUrl,
      urlHash,
    },
    referenceIdentity,
    binarySha256,
    semanticEventSignature: semantic.signature,
    sourceLineage,
  };
}

module.exports = {
  normalizeReferenceString,
  computeSemanticEventSignature,
  generateDedupeDescriptor,
};
