'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { validateOfficialFetchUrl, corroborateOfficialOrigin, ORIGIN_PROOF_METHOD } =
  require('../services/mission_official_origin_provenance');

const BYTES = Buffer.from('%PDF-1.7\nindependently fetched official source fixture\n%%EOF');
const OTHER = Buffer.from('%PDF-1.7\nunrelated Founder uploaded PDF\n%%EOF');
const URL = 'https://ssc.gov.in/official.pdf';

test('official source URL must be approved HTTPS with no embedded credentials or alternate ports', () => {
  assert.equal(validateOfficialFetchUrl(URL, 'auth_in_ssc'), URL);
  for (const invalid of [
    'http://ssc.gov.in/official.pdf',
    'https://user:password@ssc.gov.in/official.pdf',
    'https://ssc.gov.in:444/official.pdf',
    'https://ssc.gov.in.attacker.invalid/official.pdf',
    'https://example.invalid/official.pdf',
  ]) assert.throws(() => validateOfficialFetchUrl(invalid, 'auth_in_ssc'), /OFFICIAL_ORIGIN_/);
});

test('independent HTTPS bytes and staged bytes must match exactly', async () => {
  let requests = 0;
  const proof = await corroborateOfficialOrigin({
    sourceUrl: URL, authorityKey: 'auth_in_ssc', bytes: BYTES,
    officialBytesFetcher: async url => { requests++; assert.equal(url, URL); return BYTES; },
  });
  assert.equal(requests, 1);
  assert.equal(proof.originProofMethod, ORIGIN_PROOF_METHOD);
  assert.equal(proof.originProofState, 'OFFICIAL_URL_BYTES_MATCHED');
  assert.equal(proof.originSha256, crypto.createHash('sha256').update(BYTES).digest('hex'));
});

test('approved domain alone cannot attest unrelated uploaded bytes', async () => {
  await assert.rejects(() => corroborateOfficialOrigin({
    sourceUrl: URL, authorityKey: 'auth_in_ssc', bytes: OTHER,
    officialBytesFetcher: async () => BYTES,
  }), /OFFICIAL_ORIGIN_BYTES_MISMATCH/);
});

test('empty, oversized, non-PDF and unreachable official responses fail closed', async () => {
  for (const invalid of [Buffer.alloc(0), Buffer.from('<html>not a PDF</html>')]) {
    await assert.rejects(() => corroborateOfficialOrigin({
      sourceUrl: URL, authorityKey: 'auth_in_ssc', bytes: BYTES,
      officialBytesFetcher: async () => invalid,
    }), /OFFICIAL_ORIGIN_REMOTE_PDF_INVALID/);
  }
  await assert.rejects(() => corroborateOfficialOrigin({
    sourceUrl: URL, authorityKey: 'auth_in_ssc', bytes: BYTES,
    officialBytesFetcher: async () => { throw new Error('provider rejected'); },
  }), /OFFICIAL_ORIGIN_FETCH_FAILED/);
});
