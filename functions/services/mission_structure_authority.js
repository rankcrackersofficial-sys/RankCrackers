'use strict';

const crypto = require('crypto');

const KNOWN_DIMENSIONS = Object.freeze({
  paper: 'paper', stream: 'stream', subject: 'subject', post: 'post',
  category: 'category', stage: 'stage', medium: 'medium',
  optional_group: 'optionalGroup', exam_phase: 'examPhase',
});

function clean(value) { return String(value || '').trim().replace(/\s+/g, ' '); }
function key(value) { return clean(value).toLowerCase(); }
function candidateId(input) {
  return `mstruct_${crypto.createHash('sha256').update([input.missionId, input.sourceVersionId, input.sourceSha256].join('\0')).digest('hex').slice(0, 40)}`;
}

function detectCandidateStructure(input = {}) {
  const missionId = clean(input.missionId);
  const sourceVersionId = clean(input.sourceVersionId);
  const sourceSha256 = clean(input.sourceSha256).toLowerCase();
  if (!missionId || !sourceVersionId || !/^[a-f0-9]{16,128}$/.test(sourceSha256)) throw new Error('INVALID_SOURCE_IDENTITY');
  const items = [];
  for (const section of Array.isArray(input.sections) ? input.sections : []) {
    const dimensionType = key(section.dimensionType).replace(/[ -]+/g, '_');
    const value = clean(section.value);
    const page = Number(section.page);
    const evidence = clean(section.evidence);
    const confidence = Number(section.confidence);
    if (!dimensionType || !value || !Number.isInteger(page) || page < 1 || !evidence || !Number.isFinite(confidence)) continue;
    items.push({
      itemId: crypto.createHash('sha256').update(`${dimensionType}\0${key(value)}\0${page}\0${evidence}`).digest('hex').slice(0, 24),
      dimensionType, candidateValue: value, canonicalPack: KNOWN_DIMENSIONS[dimensionType] || null,
      mappingState: KNOWN_DIMENSIONS[dimensionType] ? 'MAPPED' : 'UNMAPPED_SOURCE_DIMENSION',
      sourcePage: page, sourceSection: clean(section.section), sourceEvidence: evidence,
      confidence: Math.max(0, Math.min(1, confidence)), extractionMethod: clean(section.extractionMethod || 'deterministic_fixture'),
      reviewState: 'PENDING',
    });
  }
  items.sort((a, b) => a.dimensionType.localeCompare(b.dimensionType) || a.candidateValue.localeCompare(b.candidateValue));
  const ambiguous = items.some(item => item.confidence < 0.75) || new Set(items.map(item => `${item.dimensionType}:${key(item.candidateValue)}`)).size !== items.length;
  return {
    candidateStructureId: candidateId({missionId, sourceVersionId, sourceSha256}), missionId, sourceVersionId, sourceSha256,
    documentFamily: 'ORIGINAL_NOTIFICATION', state: items.length === 0 ? 'NOT_DISCOVERED' : ambiguous ? 'FOUNDER_REVIEW_REQUIRED' : 'STRUCTURE_DETECTED',
    canonicalMutationAllowed: false, aiAuthority: 'PROPOSAL_ONLY', ambiguous, items,
  };
}

function structureDiff(current = [], candidate = []) {
  const currentMap = new Map(current.map(item => [`${key(item.dimensionType)}:${key(item.canonicalValue || item.candidateValue)}`, item]));
  const candidateMap = new Map(candidate.map(item => [`${key(item.dimensionType)}:${key(item.canonicalValue || item.candidateValue)}`, item]));
  const added = [...candidateMap].filter(([id]) => !currentMap.has(id)).map(([, item]) => item);
  const removed = [...currentMap].filter(([id]) => !candidateMap.has(id)).map(([, item]) => item);
  const unchanged = [...candidateMap].filter(([id]) => currentMap.has(id)).map(([, item]) => item);
  return {added, removed, changed: [], unchanged, ambiguous: candidate.filter(item => item.mappingState === 'UNMAPPED_SOURCE_DIMENSION' || Number(item.confidence) < 0.75)};
}

function assertStructureApproval(input = {}) {
  if (input.founderAuthorized !== true) throw new Error('FOUNDER_AUTHORIZATION_REQUIRED');
  if (input.verificationState !== 'VERIFIED' || input.activationState !== 'CANONICAL') throw new Error('CANONICAL_VERIFIED_NOTIFICATION_REQUIRED');
  if (input.currentCanonicalVersionId !== input.sourceVersionId || input.currentCanonicalSha256 !== input.sourceSha256) throw new Error('STALE_STRUCTURE_DISCOVERY');
  const items = Array.isArray(input.items) ? input.items : [];
  if (!items.length) throw new Error('STRUCTURE_NOT_DISCOVERED');
  if (items.some(item => item.mappingState !== 'MAPPED' || !['APPROVED', 'REJECTED', 'NOT_APPLICABLE'].includes(item.reviewState))) throw new Error('STRUCTURE_REVIEW_INCOMPLETE');
  return {approved: items.filter(item => item.reviewState === 'APPROVED'), mutationAuthority: 'EXISTING_CANONICAL_MISSION_VARIABLES'};
}

module.exports = {KNOWN_DIMENSIONS, candidateId, detectCandidateStructure, structureDiff, assertStructureApproval};