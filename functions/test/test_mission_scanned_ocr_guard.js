'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assertExternalOcrAllowed, buildGovernedOcrDraft } =
  require('../services/mission_scanned_ocr_guard');

test('local Firestore, Storage and demo projects never invoke production Vision', () => {
  const environments = [
    { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8388' },
    { FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9399' },
    { GCLOUD_PROJECT: 'demo-rankcrackers-force-pipeline' },
    { GOOGLE_CLOUD_PROJECT: 'demo-test' },
    { FIREBASE_PROJECT_ID: 'demo-test' },
  ];
  for (const env of environments) {
    assert.throws(() => assertExternalOcrAllowed(env), /EXTERNAL_PROVIDER_FORBIDDEN_IN_EMULATOR/);
  }
  assert.equal(assertExternalOcrAllowed({ GCLOUD_PROJECT: 'rankcrackers-real-project' }), true);
});

test('OCR transcription remains byte-exact pending review, without forced scientific substitutions', () => {
  const raw = 'SSC CGL Question: 2 Cl are present. Page 76. AG and C3 notation.';
  const draft = buildGovernedOcrDraft(raw);
  assert.equal(draft.correctedText, raw);
  assert.deepEqual(draft.corrections, []);
  assert.equal(draft.correctionState, 'UNMODIFIED_AWAITING_FOUNDER_REVIEW');
});

test('empty and simulated OCR cannot enter draft queue as real transcription', () => {
  for (const text of ['', '  ', 'Simulated text on page', 'This is placeholder evidence']) {
    assert.throws(() => buildGovernedOcrDraft(text), /EMPTY_TRANSCRIPTION|SYNTHETIC_TRANSCRIPTION_FORBIDDEN/);
  }
});
