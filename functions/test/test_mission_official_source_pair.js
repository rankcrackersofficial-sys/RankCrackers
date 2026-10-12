'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assertVerifiedOfficialSourcePair } = require('../services/mission_official_source_pair');

const MISSION = 'jee_main';
const CYCLE = '2027';
const AUTHORITY = 'nta';
const NOTIFICATION_SHA = 'a'.repeat(64);
const SYLLABUS_SHA = 'b'.repeat(64);

function source(sourceType, sha256, overrides = {}) {
  return {
    documentId: sha256,
    sourceType,
    status: 'VERIFIED',
    verificationState: 'verified',
    governanceStatus: 'ACTIVE',
    verifiedBy: 'mission_source_pair_verifier_v1',
    missionId: MISSION,
    cycleKey: CYCLE,
    authorityKey: AUTHORITY,
    isOfficial: true,
    officialDomain: 'nta.ac.in',
    sourceUrl: 'https://nta.ac.in/official.pdf',
    originUrl: 'https://nta.ac.in/official.pdf',
    originProofState: 'OFFICIAL_URL_BYTES_MATCHED',
    originProofMethod: 'TRUSTED_HTTPS_200_SAME_BYTES_SHA256_NO_REDIRECT',
    originSha256: sha256,
    language: 'en',
    expectedSha256: sha256,
    actualSha256: sha256,
    storagePath: `mission_realms/${MISSION}/official_documents/${sha256}/source.pdf`,
    ...overrides,
  };
}

function preflight({ source: item, expectation }) {
  assert.equal(item.missionId, expectation.missionId);
  assert.equal(item.boundCycleKey, expectation.cycleKey);
  assert.equal(item.sourceType, expectation.sourceType);
  assert.equal(item.authorityKey, expectation.authorityKey);
  assert.equal(item.expectedSha256, item.actualSha256);
  return { status: 'PASS' };
}

function pair(sources = [source('notification', NOTIFICATION_SHA), source('syllabus', SYLLABUS_SHA)]) {
  return assertVerifiedOfficialSourcePair({
    missionId: MISSION,
    cycleKey: CYCLE,
    authorityKey: AUTHORITY,
    schemaVersion: 'source_pair_schema_v1',
    sources,
    preflight,
  });
}

test('requires exactly notification and syllabus, never a partial pair', () => {
  assert.throws(() => pair([source('notification', NOTIFICATION_SHA)]), /EXACTLY_TWO/);
  assert.throws(() => pair([source('notification', NOTIFICATION_SHA), source('notification', SYLLABUS_SHA)]), /TYPES_INVALID/);
});

test('pins both verified documents and emits no external URL for worker fetch', () => {
  const result = pair();
  assert.equal(result.job.type, 'MISSION_SOURCE_PAIR');
  assert.equal(result.job.payload.notificationSha256, NOTIFICATION_SHA);
  assert.equal(result.job.payload.syllabusSha256, SYLLABUS_SHA);
  assert.equal(JSON.stringify(result.job.payload).includes('https://'), false);
});

test('same pair produces same idempotency key; new source hash produces a new key', () => {
  assert.equal(pair().taskId, pair().taskId);
  const replacement = pair([source('notification', 'c'.repeat(64)), source('syllabus', SYLLABUS_SHA)]);
  assert.notEqual(pair().taskId, replacement.taskId);

  const differentAuthority = assertVerifiedOfficialSourcePair({
    missionId: MISSION,
    cycleKey: CYCLE,
    authorityKey: 'nta_alternate',
    schemaVersion: 'source_pair_schema_v1',
    sources: [
      source('notification', NOTIFICATION_SHA, { authorityKey: 'nta_alternate' }),
      source('syllabus', SYLLABUS_SHA, { authorityKey: 'nta_alternate' }),
    ],
    preflight: ({ source: item, expectation }) => ({
      status: item.authorityKey === expectation.authorityKey ? 'PASS' : 'FAIL',
    }),
  });
  assert.notEqual(pair().taskId, differentAuthority.taskId);
});

test('rejects wrong mission, cycle, authority, type, and unverified records', () => {
  const cases = [
    source('notification', NOTIFICATION_SHA, { missionId: 'other' }),
    source('notification', NOTIFICATION_SHA, { cycleKey: '2028' }),
    source('notification', NOTIFICATION_SHA, { authorityKey: 'ssc' }),
    source('notification', NOTIFICATION_SHA, { status: 'UPLOADED' }),
    source('notification', NOTIFICATION_SHA, { verifiedBy: 'client' }),
    source('notification', NOTIFICATION_SHA, { sourceType: 'syllabus' }),
  ];
  for (const badNotification of cases) {
    assert.throws(() => pair([badNotification, source('syllabus', SYLLABUS_SHA)]));
  }
});

test('rejects source hash mismatch, wrong content-addressed ID, and noncanonical storage path', () => {
  assert.throws(() => pair([
    source('notification', NOTIFICATION_SHA, { actualSha256: 'c'.repeat(64) }),
    source('syllabus', SYLLABUS_SHA),
  ]), /SHA_MISMATCH/);
  assert.throws(() => pair([
    source('notification', NOTIFICATION_SHA, { documentId: 'different-id', storagePath: `mission_realms/${MISSION}/official_documents/different-id/source.pdf` }),
    source('syllabus', SYLLABUS_SHA),
  ]), /SHA_MISMATCH/);
  assert.throws(() => pair([
    source('notification', NOTIFICATION_SHA, { storagePath: 'ingestion_refinery/source.pdf' }),
    source('syllabus', SYLLABUS_SHA),
  ]), /STORAGE_PATH_MISMATCH/);
});

test('rejects unsupported language and failed official-source preflight', () => {
  assert.throws(() => pair([
    source('notification', NOTIFICATION_SHA, { language: 'hi' }),
    source('syllabus', SYLLABUS_SHA),
  ]), /LANGUAGE_UNSUPPORTED/);
  assert.throws(() => assertVerifiedOfficialSourcePair({
    missionId: MISSION, cycleKey: CYCLE, authorityKey: AUTHORITY,
    schemaVersion: 'source_pair_schema_v1',
    sources: [source('notification', NOTIFICATION_SHA), source('syllabus', SYLLABUS_SHA)],
    preflight: () => ({ status: 'FAIL' }),
  }), /PREFLIGHT_FAILED/);
});


test('unproven claimed official URL is never enough to make a VERIFIED source pair', () => {
  for (const bad of [
    { originProofState: 'DECLARED_ONLY' },
    { originProofMethod: 'CLAIMED_BY_CLIENT' },
    { originSha256: '0'.repeat(64) },
    { originUrl: 'https://nta.ac.in/different.pdf' },
  ]) {
    assert.throws(() => pair([
      source('notification', NOTIFICATION_SHA, bad),
      source('syllabus', SYLLABUS_SHA),
    ]), /ORIGIN_ATTESTATION_REQUIRED/);
  }
});
