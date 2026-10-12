'use strict';

const crypto = require('node:crypto');

const SHA256 = /^[a-f0-9]{64}$/i;
const OFFICIAL_LEVELS = new Set(['SUBJECT', 'UNIT', 'TOPIC']);
const DERIVED_LEVELS = new Set(['MICRO_TOPIC', 'ATOMIC_TOPIC']);

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function stableId(parts) {
  return crypto.createHash('sha256').update(parts.join(':')).digest('hex');
}

function normalizeLabel(value) {
  return requiredString(value, 'SYLLABUS_LABEL_REQUIRED')
    .normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US');
}

function validateSourceBinding(binding) {
  const missionId = requiredString(binding?.missionId, 'SYLLABUS_MISSION_REQUIRED');
  const documentId = requiredString(binding?.documentId, 'SYLLABUS_DOCUMENT_REQUIRED');
  const sourceVersionId = requiredString(binding?.sourceVersionId, 'SYLLABUS_SOURCE_VERSION_REQUIRED');
  const sourceSha256 = requiredString(binding?.sourceSha256, 'SYLLABUS_SOURCE_SHA_REQUIRED').toLowerCase();
  const runId = requiredString(binding?.runId, 'SYLLABUS_RUN_REQUIRED');
  if (!SHA256.test(sourceSha256)) throw new Error('SYLLABUS_SOURCE_SHA_INVALID');
  return { missionId, documentId, sourceVersionId, sourceSha256, runId };
}

/**
 * Official Syllabus Abstraction core (B3).
 * It preserves only explicitly classified SUBJECT/UNIT/TOPIC segments. It never
 * invents a missing hierarchy level and never creates Micro/Atomic nodes.
 * Extraction results remain review candidates until a qualified reviewer verifies them.
 */
function abstractOfficialSyllabus({ binding, verifiedPageCorpus, segments }) {
  const source = validateSourceBinding(binding);
  if (!Array.isArray(verifiedPageCorpus) || verifiedPageCorpus.length === 0) {
    throw new Error('SYLLABUS_VERIFIED_PAGE_CORPUS_REQUIRED');
  }
  const pages = new Map();
  for (const page of verifiedPageCorpus) {
    if (page?.isVerified !== true || page.sourceSha256?.toLowerCase() !== source.sourceSha256
        || !Number.isSafeInteger(page.pageNumber) || page.pageNumber < 1
        || typeof page.pageDigest !== 'string' || !SHA256.test(page.pageDigest)
        || typeof page.text !== 'string' || page.text.trim() === '') {
      throw new Error('SYLLABUS_PAGE_AUTHORITY_INVALID');
    }
    if (pages.has(page.pageNumber)) throw new Error('SYLLABUS_DUPLICATE_PAGE');
    pages.set(page.pageNumber, page);
  }
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('SYLLABUS_HIERARCHY_SEGMENTS_REQUIRED');
  }

  const nodes = [];
  const bySegmentId = new Map();
  const siblingKeys = new Set();
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const level = String(segment?.level || '').toUpperCase();
    if (!OFFICIAL_LEVELS.has(level)) {
      throw new Error('SYLLABUS_ABSTRACTION_CANNOT_CREATE_DERIVED_LEVELS');
    }
    const segmentId = requiredString(segment.segmentId, 'SYLLABUS_SEGMENT_ID_REQUIRED');
    const title = requiredString(segment.exactText, 'SYLLABUS_EXACT_SOURCE_TEXT_REQUIRED');
    const pageNumber = segment.pageNumber;
    const page = pages.get(pageNumber);
    if (!page || !page.text.includes(title)) throw new Error('SYLLABUS_TEXT_ANCHOR_NOT_IN_VERIFIED_PAGE');
    if (segment.pageDigest !== page.pageDigest) throw new Error('SYLLABUS_PAGE_DIGEST_MISMATCH');
    if (segment.sourceOrder !== index + 1) throw new Error('SYLLABUS_SOURCE_ORDER_INVALID');

    const parentSegmentId = segment.parentSegmentId == null ? null
      : requiredString(segment.parentSegmentId, 'SYLLABUS_PARENT_SEGMENT_INVALID');
    const parent = parentSegmentId ? bySegmentId.get(parentSegmentId) : null;
    if (level === 'SUBJECT' && parentSegmentId !== null) throw new Error('SYLLABUS_SUBJECT_PARENT_INVALID');
    if (level === 'UNIT' && (!parent || parent.level !== 'SUBJECT')) throw new Error('SYLLABUS_UNIT_PARENT_MUST_BE_EXPLICIT_SUBJECT');
    if (level === 'TOPIC' && (!parent || !['SUBJECT', 'UNIT'].includes(parent.level))) {
      throw new Error('SYLLABUS_TOPIC_PARENT_MUST_BE_EXPLICIT_SUBJECT_OR_UNIT');
    }

    const parentNodeId = parent?.nodeId || null;
    const paperId = segment.paperId == null ? '' : requiredString(segment.paperId, 'SYLLABUS_PAPER_ID_INVALID');
    const siblingKey = [paperId, parentNodeId || '', level, normalizeLabel(title)].join('|');
    if (siblingKeys.has(siblingKey)) throw new Error('SYLLABUS_DUPLICATE_OFFICIAL_CANDIDATE');
    siblingKeys.add(siblingKey);

    const nodeId = stableId([source.missionId, source.sourceVersionId, paperId, level, parentNodeId || '', normalizeLabel(title)]);
    const node = Object.freeze({
      nodeId, missionId: source.missionId, documentId: source.documentId,
      sourceVersionId: source.sourceVersionId, sourceSha256: source.sourceSha256,
      level, paperId: paperId || null, subjectId: segment.subjectId || null, parentNodeId, nearestOfficialAncestorId: level === 'SUBJECT' ? nodeId : (parent?.nearestOfficialAncestorId || parent?.nodeId),
      title, normalizedTitle: normalizeLabel(title),
      provenance: 'OFFICIAL_CANDIDATE', verificationState: 'PENDING_REVIEW',
      sourcePage: pageNumber, sourcePageDigest: page.pageDigest,
      sourceTextAnchor: title, sourceOrder: segment.sourceOrder,
      extractionRunId: source.runId, workerRevision: 'OSA-B3-V1',
    });
    nodes.push(node);
    bySegmentId.set(segmentId, { level, nodeId, nearestOfficialAncestorId: node.nearestOfficialAncestorId });
  }
  return Object.freeze({
    missionId: source.missionId, documentId: source.documentId,
    sourceVersionId: source.sourceVersionId, sourceSha256: source.sourceSha256,
    state: 'PENDING_REVIEW', nodes: Object.freeze(nodes),
  });
}

function validateBoundaryProfile(profile, missionId, sourceVersionId) {
  if (!profile || profile.missionId !== missionId) throw new Error('DSD_BOUNDARY_PROFILE_MISSION_MISMATCH');
  if (profile.effectiveState !== 'ACTIVE' || profile.verificationState !== 'VERIFIED') {
    throw new Error('DSD_BOUNDARY_PROFILE_NOT_VERIFIED_ACTIVE');
  }
  requiredString(profile.profileVersion, 'DSD_BOUNDARY_PROFILE_VERSION_REQUIRED');
  if (profile.officialSyllabusVersion !== sourceVersionId) throw new Error('DSD_OFFICIAL_SYLLABUS_VERSION_MISMATCH');
  requiredString(profile.academicLevel, 'DSD_ACADEMIC_LEVEL_REQUIRED');
  requiredString(profile.scopePolicy, 'DSD_SCOPE_POLICY_REQUIRED');
  requiredString(profile.depthPolicy, 'DSD_DEPTH_POLICY_REQUIRED');
  if (!Array.isArray(profile.referenceStandards) || profile.referenceStandards.length === 0
      || profile.referenceStandards.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error('DSD_REFERENCE_STANDARDS_REQUIRED');
  }
  return profile;
}

/**
 * Derived Syllabus Decomposition core (B4). Model output is treated as a proposal,
 * never as authority. Every output remains CANDIDATE/PENDING_REVIEW until separately
 * verified; missing mission environment or lineage blocks the entire run.
 */
function composeMissionSyllabus({ binding, boundaryProfile, officialNodes, proposals }) {
  const source = validateSourceBinding(binding);
  const profile = validateBoundaryProfile(boundaryProfile, source.missionId, source.sourceVersionId);
  if (!Array.isArray(officialNodes) || officialNodes.length === 0) throw new Error('DSD_VERIFIED_OFFICIAL_NODES_REQUIRED');
  const officialById = new Map();
  for (const node of officialNodes) {
    if (node.missionId !== source.missionId || node.sourceVersionId !== source.sourceVersionId
        || node.sourceSha256 !== source.sourceSha256 || node.provenance !== 'OFFICIAL'
        || node.verificationState !== 'VERIFIED' || node.level !== 'TOPIC') {
      throw new Error('DSD_OFFICIAL_TOPIC_AUTHORITY_INVALID');
    }
    officialById.set(node.nodeId, node);
  }
  if (!Array.isArray(proposals)) throw new Error('DSD_PROPOSALS_REQUIRED');

  const output = [];
  const allIds = new Set();
  const addCandidate = (candidate, level, parent, index) => {
    if (!DERIVED_LEVELS.has(level)) throw new Error('DSD_LEVEL_INVALID');
    const title = requiredString(candidate?.title, 'DSD_CANDIDATE_TITLE_REQUIRED');
    const rationale = requiredString(candidate?.scopeRationale, 'DSD_SCOPE_RATIONALE_REQUIRED');
    if (!Array.isArray(candidate.sourcePages) || candidate.sourcePages.length === 0
        || candidate.sourcePages.some((p) => !Number.isSafeInteger(p) || p < 1)) {
      throw new Error('DSD_SOURCE_LINEAGE_REQUIRED');
    }
    const normalizedTitle = normalizeLabel(title);
    const id = stableId([source.missionId, profile.profileVersion, source.sourceVersionId, level, parent.nodeId, normalizedTitle]);
    if (allIds.has(id)) throw new Error('DSD_DUPLICATE_SIBLING_CANDIDATE');
    allIds.add(id);
    const node = Object.freeze({
      nodeId: id, missionId: source.missionId, sourceVersionId: source.sourceVersionId,
      sourceSha256: source.sourceSha256, boundaryProfileVersion: profile.profileVersion,
      academicLevel: profile.academicLevel, officialSyllabusVersion: profile.officialSyllabusVersion,
      level, nodeType: level.toLowerCase(), parentNodeId: parent.nodeId, nearestOfficialAncestorId: parent.nearestOfficialAncestorId || parent.nodeId,
      officialTopicId: parent.level === 'TOPIC' ? parent.nodeId : parent.officialTopicId,
      subjectId: parent.subjectId, paperId: parent.paperId ?? null,
      title, normalizedTitle, scopeRationale: rationale, sourcePages: [...new Set(candidate.sourcePages)],
      provenance: 'DERIVED', verificationState: 'CANDIDATE', reviewState: 'PENDING_FACULTY_REVIEW',
      workerRevision: 'DSD-B4-V1', runId: source.runId, siblingOrder: index + 1,
    });
    output.push(node);
    return node;
  };

  const coveredTopicIds = new Set();
  for (const proposal of proposals) {
    const official = officialById.get(requiredString(proposal.officialTopicId, 'DSD_OFFICIAL_TOPIC_ID_REQUIRED'));
    if (!official) throw new Error('DSD_PROPOSAL_OUTSIDE_VERIFIED_OFFICIAL_TOPICS');
    if (coveredTopicIds.has(official.nodeId)) throw new Error('DSD_OFFICIAL_TOPIC_DUPLICATE_PROPOSAL');
    coveredTopicIds.add(official.nodeId);
    const micros = proposal.microTopics;
    if (!Array.isArray(micros)) throw new Error('DSD_MICRO_TOPICS_REQUIRED');
    const microKeys = new Set();
    if (micros.length === 0) {
      if (proposal.atomicStop !== true) throw new Error('DSD_EMPTY_DECOMPOSITION_REQUIRES_ATOMIC_STOP');
      continue;
    }
    for (let mi = 0; mi < micros.length; mi += 1) {
      const micro = addCandidate(micros[mi], 'MICRO_TOPIC', official, mi);
      const microKey = normalizeLabel(micro.title);
      if (microKeys.has(microKey)) throw new Error('DSD_DUPLICATE_MICRO_SIBLING');
      microKeys.add(microKey);
      const atoms = micros[mi].atomicTopics;
      if (!Array.isArray(atoms)) throw new Error('DSD_ATOMIC_TOPICS_REQUIRED');
      if (atoms.length === 0 && micros[mi].atomicStop !== true) {
        throw new Error('DSD_EMPTY_ATOMIC_DECOMPOSITION_REQUIRES_ATOMIC_STOP');
      }
      for (let ai = 0; ai < atoms.length; ai += 1) addCandidate(atoms[ai], 'ATOMIC_TOPIC', micro, ai);
    }
  }
  if (coveredTopicIds.size !== officialById.size) throw new Error('DSD_TOPIC_COVERAGE_INCOMPLETE');
  return Object.freeze({
    missionId: source.missionId, sourceVersionId: source.sourceVersionId,
    sourceSha256: source.sourceSha256, boundaryProfileVersion: profile.profileVersion,
    state: 'PENDING_FACULTY_REVIEW', nodes: Object.freeze(output),
  });
}

module.exports = { abstractOfficialSyllabus, composeMissionSyllabus, validateBoundaryProfile };
