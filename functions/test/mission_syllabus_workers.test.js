'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  abstractOfficialSyllabus,
  composeMissionSyllabus,
} = require('../services/mission_syllabus_workers');

const sha = 'a'.repeat(64);
const binding = {
  missionId: 'exam_alpha', documentId: 'official-syllabus-2027',
  sourceVersionId: 'syllabus-v3', sourceSha256: sha, runId: 'run-1',
};
const page = {
  pageNumber: 1, text: 'Physics\nMotion\nSpeed and velocity',
  isVerified: true, sourceSha256: sha, pageDigest: 'b'.repeat(64),
};

test('official abstraction preserves absent Unit/Micro/Atomic levels without inventing them', () => {
  const result = abstractOfficialSyllabus({
    binding, verifiedPageCorpus: [page],
    segments: [
      { segmentId: 's', level: 'SUBJECT', exactText: 'Physics', pageNumber: 1, pageDigest: page.pageDigest, sourceOrder: 1 },
      { segmentId: 't', level: 'TOPIC', exactText: 'Motion', parentSegmentId: 's', pageNumber: 1, pageDigest: page.pageDigest, sourceOrder: 2 },
      { segmentId: 't2', level: 'TOPIC', exactText: 'Speed and velocity', parentSegmentId: 's', pageNumber: 1, pageDigest: page.pageDigest, sourceOrder: 3 },
    ],
  });

  assert.deepEqual(result.nodes.map((node) => node.level), ['SUBJECT', 'TOPIC', 'TOPIC']);
  assert.equal(result.nodes[1].parentNodeId, result.nodes[0].nodeId);
  assert.equal(result.nodes[1].provenance, 'OFFICIAL_CANDIDATE');
  assert.equal(result.nodes[1].verificationState, 'PENDING_REVIEW');
  assert.equal(result.state, 'PENDING_REVIEW');
  assert.equal(result.nodes.some((node) => /MICRO|ATOMIC/.test(node.level)), false);
});

test('official abstraction rejects invented levels and source text not present on the verified page', () => {
  assert.throws(() => abstractOfficialSyllabus({
    binding, verifiedPageCorpus: [page],
    segments: [{ segmentId: 'm', level: 'MICRO_TOPIC', exactText: 'invented', pageNumber: 1, pageDigest: page.pageDigest, sourceOrder: 1 }],
  }), /CANNOT_CREATE_DERIVED_LEVELS/);

  assert.throws(() => abstractOfficialSyllabus({
    binding, verifiedPageCorpus: [page],
    segments: [{ segmentId: 's', level: 'SUBJECT', exactText: 'Chemistry', pageNumber: 1, pageDigest: page.pageDigest, sourceOrder: 1 }],
  }), /TEXT_ANCHOR_NOT_IN_VERIFIED_PAGE/);
});

test('decomposition requires a verified mission-bound academic boundary profile and official topic', () => {
  const officialTopic = {
    nodeId: 'official-topic', missionId: binding.missionId, sourceVersionId: binding.sourceVersionId,
    sourceSha256: sha, level: 'TOPIC', provenance: 'OFFICIAL', verificationState: 'VERIFIED',
  };
  const profile = {
    missionId: binding.missionId, profileVersion: 'mabp-2', officialSyllabusVersion: binding.sourceVersionId,
    academicLevel: 'PLUS_TWO', effectiveState: 'ACTIVE', verificationState: 'VERIFIED',
    scopePolicy: 'inside official topic only', depthPolicy: 'board-level concepts and skills',
    referenceStandards: ['NCERT Class XI-XII'],
  };
  const result = composeMissionSyllabus({
    binding, boundaryProfile: profile, officialNodes: [officialTopic],
    proposals: [{
      officialTopicId: 'official-topic',
      microTopics: [{
        title: 'Speed', scopeRationale: 'A sub-concept of Motion inside the official topic.',
        sourcePages: [1], atomicTopics: [{
          title: 'Average speed', scopeRationale: 'A measurable speed concept within Motion.',
          sourcePages: [1],
        }],
      }],
    }],
  });

  assert.deepEqual(result.nodes.map((node) => node.level), ['MICRO_TOPIC', 'ATOMIC_TOPIC']);
  assert.ok(result.nodes.every((node) => node.provenance === 'DERIVED'));
  assert.ok(result.nodes.every((node) => node.verificationState === 'CANDIDATE'));
  assert.ok(result.nodes.every((node) => node.reviewState === 'PENDING_FACULTY_REVIEW'));
  assert.equal(result.nodes[1].parentNodeId, result.nodes[0].nodeId);
  assert.equal(result.nodes[1].nearestOfficialAncestorId, 'official-topic');

  assert.throws(() => composeMissionSyllabus({
    binding, boundaryProfile: { ...profile, verificationState: 'CANDIDATE' },
    officialNodes: [officialTopic], proposals: [],
  }), /NOT_VERIFIED_ACTIVE/);
  assert.throws(() => composeMissionSyllabus({
    binding, boundaryProfile: profile,
    officialNodes: [{ ...officialTopic, missionId: 'other_mission' }], proposals: [],
  }), /OFFICIAL_TOPIC_AUTHORITY_INVALID/);
});

test('each official topic must be decomposed or explicitly declared atomic at this mission depth', () => {
  const officialTopic = {
    nodeId: 'official-topic', missionId: binding.missionId, sourceVersionId: binding.sourceVersionId,
    sourceSha256: sha, level: 'TOPIC', provenance: 'OFFICIAL', verificationState: 'VERIFIED',
  };
  const profile = {
    missionId: binding.missionId, profileVersion: 'mabp-2', officialSyllabusVersion: binding.sourceVersionId,
    academicLevel: 'PLUS_TWO', effectiveState: 'ACTIVE', verificationState: 'VERIFIED',
    scopePolicy: 'bounded', depthPolicy: 'plus-two', referenceStandards: ['NCERT'],
  };
  assert.throws(() => composeMissionSyllabus({
    binding, boundaryProfile: profile, officialNodes: [officialTopic], proposals: [],
  }), /TOPIC_COVERAGE_INCOMPLETE/);

  const stopped = composeMissionSyllabus({
    binding, boundaryProfile: profile, officialNodes: [officialTopic],
    proposals: [{ officialTopicId: 'official-topic', microTopics: [], atomicStop: true }],
  });
  assert.equal(stopped.state, 'PENDING_FACULTY_REVIEW');
});
