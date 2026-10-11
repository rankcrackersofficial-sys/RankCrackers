'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assessPrintedPageEvidence } = require('../services/mission_scanned_page_numbering');

test('unmapped printed folio never pretends the physical PDF page is wrong', () => {
  assert.deepEqual(assessPrintedPageEvidence('Cover page\nSSC CGL'), {
    status: 'UNMAPPED', expected: null, detected: null,
  });
  assert.deepEqual(assessPrintedPageEvidence('Instructions\nPage 12'), {
    status: 'UNMAPPED', expected: null, detected: 12,
  });
});

test('document-specific verified printed folio mapping supports match, missing and mismatch', () => {
  assert.equal(assessPrintedPageEvidence('Source body\n12', 12).status, 'MATCH');
  assert.equal(assessPrintedPageEvidence('Source body\nPage 12', 12).status, 'MATCH');
  assert.equal(assessPrintedPageEvidence('Source body\n8', 12).status, 'MISMATCH');
  assert.equal(assessPrintedPageEvidence('Source body', 12).status, 'MISSING');
});

test('caller cannot supply invalid editorial page mapping', () => {
  assert.throws(() => assessPrintedPageEvidence('Page 2', 0), /EXPECTATION_INVALID/);
  assert.throws(() => assessPrintedPageEvidence('Page 2', '2'), /EXPECTATION_INVALID/);
  assert.throws(() => assessPrintedPageEvidence('Page 2', 1.5), /EXPECTATION_INVALID/);
});
