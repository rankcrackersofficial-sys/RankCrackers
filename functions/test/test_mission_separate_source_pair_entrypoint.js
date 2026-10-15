'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runSeparateSourcePairPipeline } = require('../services/mission_separate_source_pair_entrypoint');

test('separate pair rejects incomplete identity before any database work', async () => {
  let reads = 0;
  const db = { runTransaction: async () => {}, collection: () => ({ doc: () => ({ get: async () => { reads += 1; return { exists: false }; } }) }) };
  await assert.rejects(() => runSeparateSourcePairPipeline({
    db, storage: { bucket: () => ({}) }, auth: { uid: 'founder', token: { founder: true } },
    payload: { missionId: 'pilot' },
  }), /CYCLE_KEY_REQUIRED/);
  assert.equal(reads, 0);
});

test('separate pair rejects non-English source evidence before storage finalization', async () => {
  let reads = 0;
  const db = { runTransaction: async () => {}, collection: () => ({ doc: () => ({ get: async () => { reads += 1; return { exists: true, data: () => ({ status: 'ACTIVE' }) }; } }) }) };
  await assert.rejects(() => runSeparateSourcePairPipeline({
    db, storage: { bucket: () => ({}) }, auth: { uid: 'founder', token: { founder: true } },
    payload: { missionId: 'pilot', cycleKey: '2027', authorityKey: 'nta', sourceLanguage: 'hindi' },
  }), /MISSION_SOURCE_LANGUAGE_UNSUPPORTED/);
  assert.equal(reads, 0);
});
