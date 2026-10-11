'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveExpectedSourceSha } = require('../src/syllabus/sourceShaAuthority');
const {
  PAGE_EXTRACTION_TASK,
  shouldBypassQueueForTest,
  shouldQuarantineLegacyQueueInProduction,
} = require('../src/workers/queueExecutionPolicy');

const SHA = 'a'.repeat(64);

test('queue execution is bypassed in Jest and allowed in production/emulator contexts', () => {
  assert.equal(shouldBypassQueueForTest('3'), true);
  assert.equal(shouldBypassQueueForTest(undefined), false);
  assert.equal(shouldBypassQueueForTest(''), false);
});

test('only the page extraction task is allowed through the production queue boundary', () => {
  assert.equal(shouldQuarantineLegacyQueueInProduction(PAGE_EXTRACTION_TASK, undefined), false);
  assert.equal(shouldQuarantineLegacyQueueInProduction('pdfParse', undefined), true);
  assert.equal(shouldQuarantineLegacyQueueInProduction('mcq', undefined), true);
  assert.equal(shouldQuarantineLegacyQueueInProduction('pdfParse', '3'), false);
});

test('source digest comes from explicit sourceSha256, not an unrelated document ID', () => {
  assert.equal(resolveExpectedSourceSha({ sourceSha256: SHA, document_id: 'official-notice-v1' }), SHA);
  assert.throws(
    () => resolveExpectedSourceSha({ document_id: 'official-notice-v1' }),
    /EXPECTED_SHA_INVALID/,
  );
});

test('legacy hash-addressed document IDs remain compatible and normalize to lowercase', () => {
  assert.equal(resolveExpectedSourceSha({ document_id: `hash_${SHA.toUpperCase()}` }), SHA);
});

test('malformed explicit digest fails closed even when a hash-like document ID exists', () => {
  assert.throws(
    () => resolveExpectedSourceSha({ sourceSha256: 'bad', document_id: `hash_${SHA}` }),
    /EXPECTED_SHA_INVALID/,
  );
});
