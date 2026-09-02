const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Mock task data
const baseTask = {
  id: 'test_task',
  task_type: 'pagewise_text_extraction_batch',
  mission_id: 'neet_(ug)-2027',
  document_id: 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
  source_document_id: 'doc_123',
  document_type: 'syllabus',
  source_path: 'test.pdf',
  page_start: 1,
  page_end: 1,
  page_batch_index: 0,
  total_batches: 1,
  status: 'queued',
  expected_output: 'page_extractions'
};

const mockPdfBytes = Buffer.from('PDF CONTENT FOR TESTING');
const correctSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');

function runTest(name, taskOverride, bytes, expectedError) {
  console.log(`\n--- Running Test: ${name} ---`);
  const task = { ...baseTask, ...taskOverride };

  // Simulation of the worker logic
  try {
    // 1. Resolve authorized SHA
    if (!task.document_id) {
      throw new Error('RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_MISSING');
    }
    const canonicalSha = task.document_id.startsWith('hash_') ? task.document_id.substring(5).toLowerCase() : task.document_id.toLowerCase();

    if (!canonicalSha || canonicalSha.length !== 64 || !/^[0-9a-f]{64}$/.test(canonicalSha)) {
      throw new Error('RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_INVALID');
    }

    // 2. Calculate actual SHA
    const actualSha = crypto.createHash('sha256').update(bytes).digest('hex').toLowerCase();

    // 3. Compare
    if (actualSha !== canonicalSha) {
      throw new Error('RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_MISMATCH');
    }

    console.log(`PASS: SHA matches (${actualSha})`);
    if (expectedError) console.error(`FAIL: Expected error ${expectedError} but got success`);
  } catch (e) {
    if (e.message === expectedError) {
      console.log(`PASS: Caught expected error: ${e.message}`);
    } else {
      console.error(`FAIL: Got unexpected error: ${e.message} (Expected: ${expectedError || 'SUCCESS'})`);
    }
  }
}

// SHA-01: Correct authorized SHA + correct source bytes
runTest('SHA-01: Correct SHA', { document_id: `hash_${correctSha}` }, mockPdfBytes, null);

// SHA-02: Wrong authorized SHA
runTest('SHA-02: Wrong authorized SHA', { document_id: 'hash_' + 'a'.repeat(64) }, mockPdfBytes, 'RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_MISMATCH');

// SHA-03: Correct metadata but modified source bytes
runTest('SHA-03: Modified source bytes', { document_id: `hash_${correctSha}` }, Buffer.from('MODIFIED BYTES'), 'RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_MISMATCH');

// SHA-04: Missing authorized SHA
runTest('SHA-04: Missing authorized SHA', { document_id: '' }, mockPdfBytes, 'RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_MISSING');

// SHA-05: Malformed/non-64-char SHA
runTest('SHA-05: Malformed SHA', { document_id: 'hash_tooshort' }, mockPdfBytes, 'RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_INVALID');

// SHA-06: Non-hex SHA
runTest('SHA-06: Non-hex SHA', { document_id: 'hash_' + 'g'.repeat(64) }, mockPdfBytes, 'RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_INVALID');
