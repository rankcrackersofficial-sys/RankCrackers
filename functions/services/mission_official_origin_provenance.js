'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { canonicalAuthorityRegistry } = require('./authority_intelligence');

const MAX_OFFICIAL_BYTES = 50 * 1024 * 1024;
const ORIGIN_PROOF_METHOD = 'TRUSTED_HTTPS_200_SAME_BYTES_SHA256_NO_REDIRECT';

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function validateOfficialFetchUrl(sourceUrl, authorityKey) {
  let url;
  try { url = new URL(sourceUrl); } catch (_) { throw new Error('OFFICIAL_ORIGIN_URL_INVALID'); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('OFFICIAL_ORIGIN_HTTPS_AUTHORITY_REQUIRED');
  }
  if (!canonicalAuthorityRegistry.isDomainApprovedForAuthority(url.toString(), authorityKey)) {
    throw new Error('OFFICIAL_ORIGIN_DOMAIN_NOT_APPROVED');
  }
  url.hash = '';
  return url.toString();
}

async function defaultOfficialBytesFetcher(url) {
  let response;
  try {
    response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 0,
      maxContentLength: MAX_OFFICIAL_BYTES,
      maxBodyLength: MAX_OFFICIAL_BYTES,
      decompress: true,
      proxy: false,
      validateStatus: status => status === 200,
    });
  } catch (_) {
    throw new Error('OFFICIAL_ORIGIN_FETCH_FAILED');
  }
  return Buffer.from(response.data);
}

async function corroborateOfficialOrigin({
  sourceUrl, authorityKey, bytes, officialBytesFetcher = defaultOfficialBytesFetcher,
}) {
  const validatedUrl = validateOfficialFetchUrl(sourceUrl, authorityKey);
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_OFFICIAL_BYTES) {
    throw new Error('OFFICIAL_ORIGIN_STAGED_BYTES_INVALID');
  }
  if (typeof officialBytesFetcher !== 'function') throw new Error('OFFICIAL_ORIGIN_FETCHER_REQUIRED');
  let officialBytes;
  try {
    officialBytes = await officialBytesFetcher(validatedUrl);
  } catch (_) {
    throw new Error('OFFICIAL_ORIGIN_FETCH_FAILED');
  }
  if (!Buffer.isBuffer(officialBytes) || officialBytes.length === 0
      || officialBytes.length > MAX_OFFICIAL_BYTES
      || officialBytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('OFFICIAL_ORIGIN_REMOTE_PDF_INVALID');
  }
  const stagedSha = sha256(bytes);
  const originSha = sha256(officialBytes);
  if (stagedSha !== originSha) throw new Error('OFFICIAL_ORIGIN_BYTES_MISMATCH');
  return Object.freeze({
    originProofState: 'OFFICIAL_URL_BYTES_MATCHED',
    originSha256: originSha,
    originProofMethod: ORIGIN_PROOF_METHOD,
    originUrl: validatedUrl,
  });
}

module.exports = {
  MAX_OFFICIAL_BYTES, ORIGIN_PROOF_METHOD,
  validateOfficialFetchUrl, corroborateOfficialOrigin,
};
