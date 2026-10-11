'use strict';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function resolveExpectedSourceSha(taskData = {}) {
  let candidate = typeof taskData.sourceSha256 === 'string' ? taskData.sourceSha256 : '';
  if (!candidate && typeof taskData.document_id === 'string' && taskData.document_id.startsWith('hash_')) {
    candidate = taskData.document_id.slice('hash_'.length);
  }
  const normalized = candidate.trim().toLowerCase();
  if (!SHA256_PATTERN.test(normalized)) {
    throw new Error('RC_SYLLABUS_P06_BLOCKED_EXPECTED_SHA_INVALID: A valid pinned sourceSha256 is required');
  }
  return normalized;
}

module.exports = { SHA256_PATTERN, resolveExpectedSourceSha };
