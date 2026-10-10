// Deterministic verification test suite for Problem #6 (P06) Source SHA-256 Binding
// Runs against Local Firestore Emulator on 127.0.0.1:8080.
// FIRESTORE_PRODUCTION_WRITES = 0

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const cp = require('child_process');
const axios = require('axios');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

// 1. Setup Stubs & Mocks
const originalExecSync = cp.execSync;
cp.execSync = (command, options) => {
  if (command.includes('gcloud auth print-access-token')) {
    return 'mock-token';
  }
  return originalExecSync(command, options);
};

const originalExistsSync = fs.existsSync;
fs.existsSync = (p) => {
  if (p.includes('verify5_p15_auth_candidate.json')) return true;
  return originalExistsSync(p);
};
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = (p, options) => {
  if (p.includes('verify5_p15_auth_candidate.json')) {
    return JSON.stringify({ P15ExplicitAuthorization: true, P15ExecutionAllowed: true });
  }
  return originalReadFileSync(p, options);
};

// Mock pdf-parse
let pdfParseCallCount = 0;
let pdfParseMockText = 'Sample NEET UG 2026 page text content';
require.cache[require.resolve('pdf-parse')] = {
  exports: {
    PDFParse: function(options) {
      pdfParseCallCount++;
      return {
        getText: async () => ({
          total: 124,
          pages: [{ num: 25, text: pdfParseMockText }]
        }),
        destroy: async () => {}
      };
    }
  }
};

// Mock Axios for source PDF resolution
let currentMockBytes = Buffer.from('real-mock-pdf-bytes-for-neet-ug-2026');
let axiosGetCallCount = 0;
let axiosThrowError = false;
axios.get = async (url, options) => {
  axiosGetCallCount++;
  if (axiosThrowError) {
    throw new Error('GCS connection timed out');
  }
  return { data: currentMockBytes };
};

// Console output capture helpers
let capturedErrors = [];
let capturedLogs = [];
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

function startCapture() {
  capturedErrors = [];
  capturedLogs = [];
  console.error = (...args) => {
    capturedErrors.push(args.join(' '));
    originalConsoleError(...args);
  };
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
    originalConsoleLog(...args);
  };
}

function stopCapture() {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
}

// Process exit mock
let lastExitCode = null;
process.exit = (code) => {
  lastExitCode = code;
  throw new Error(`PROCESS_EXIT_${code}`);
};

// Runner helper
async function runWorker(args) {
  lastExitCode = null;
  pdfParseCallCount = 0;
  axiosGetCallCount = 0;
  
  const finalArgs = [...args];
  if (finalArgs.some(a => a.startsWith('--task-id=')) && !finalArgs.some(a => a.startsWith('--limit'))) {
    finalArgs.push('--limit=1');
  }
  
  process.argv = ['node', 'process_pagewise_extraction_batches.js', ...finalArgs];
  
  delete require.cache[require.resolve('../process_pagewise_extraction_batches.js')];
  const worker = require('../process_pagewise_extraction_batches.js');
  
  startCapture();
  try {
    await worker.main();
  } catch (err) {
    if (!err.message.startsWith('PROCESS_EXIT_')) {
      originalConsoleError('Unexpected error:', err);
    }
  } finally {
    stopCapture();
  }
}

// Data reset helpers
async function resetTask(taskId, data) {
  const ref = db.collection('ai_queue').doc(taskId);
  await ref.set(data);
}

async function clearExtractions(missionId, docId) {
  const pathStr = `mission_realms/${missionId}/official_documents/${docId}/page_extractions`;
  const snap = await db.collection(pathStr).get();
  const batch = db.batch();
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

async function runAllTests() {
  const targetMission = 'neet_(ug)-2027';
  const targetDoc = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
  const validSha = crypto.createHash('sha256').update(currentMockBytes).digest('hex');
  const validDocId = `hash_${validSha}`;
  
  const baseTaskData = {
    task_type: 'pagewise_text_extraction_batch',
    mission_id: targetMission,
    document_id: validDocId,
    source_document_id: validDocId,
    document_type: 'original_notification',
    source_path: `mission_realms/${targetMission}/official_documents/${validDocId}.pdf`,
    page_start: 25,
    page_end: 25,
    page_batch_index: 1,
    total_batches: 42,
    status: 'queued',
    expected_output: 'page_extractions',
    language: 'en'
  };

  originalConsoleLog('\n============================================================');
  originalConsoleLog('RUNNING P06 CRYPTOGRAPHIC BINDING TEST SUITE (T01-T15)');
  originalConsoleLog('============================================================\n');

  let failedTests = 0;

  function assert(condition, message) {
    if (!condition) {
      failedTests++;
      originalConsoleLog(`  ❌ FAIL: ${message}`);
    } else {
      originalConsoleLog(`  ✅ PASS: ${message}`);
    }
  }

  // --- P06-T01: Valid source bytes + correct SHA ---
  originalConsoleLog('Running P06-T01: Valid source bytes + correct SHA...');
  const t01Task = 'test_task_p06_t01';
  await resetTask(t01Task, { ...baseTaskData, id: t01Task });
  await clearExtractions(targetMission, validDocId);
  await runWorker(['--task-id=' + t01Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  const t01TaskDoc = (await db.collection('ai_queue').doc(t01Task).get()).data();
  assert(t01TaskDoc.status === 'completed', 'Task should be completed');
  assert(pdfParseCallCount > 0, 'PDF parser should have been invoked');
  
  const t01PageDoc = (await db.collection(`mission_realms/${targetMission}/official_documents/${validDocId}/page_extractions`).doc('25').get()).data();
  assert(t01PageDoc !== undefined, 'Page extraction should be written');
  assert(t01PageDoc.extraction_text === pdfParseMockText, 'Page text should match');

  // --- P06-T02: Valid source bytes + wrong expected SHA ---
  originalConsoleLog('Running P06-T02: Valid source bytes + wrong expected SHA...');
  const t02Task = 'test_task_p06_t02';
  await resetTask(t02Task, { ...baseTaskData, id: t02Task, document_id: 'hash_0000000000000000000000000000000000000000000000000000000000000000' });
  await runWorker(['--task-id=' + t02Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  assert(lastExitCode === 1, 'Worker should exit with status 1');
  assert(capturedErrors.includes('RC_SYLLABUS_P06_BLOCKED_SOURCE_SHA_MISMATCH'), 'Logs should contain source SHA mismatch code');
  
  const t02TaskDoc = (await db.collection('ai_queue').doc(t02Task).get()).data();
  assert(t02TaskDoc.status === 'failed', 'Task status should be failed');
  assert(t02TaskDoc.failure_reason === 'RC_SYLLABUS_P06_BLOCKED_SOURCE_SHA_MISMATCH', 'Failure reason must match mismatch error');

  // --- P06-T03: Modified source bytes with old expected SHA ---
  originalConsoleLog('Running P06-T03: Modified source bytes with old expected SHA...');
  const t03Task = 'test_task_p06_t03';
  await resetTask(t03Task, { ...baseTaskData, id: t03Task });
  currentMockBytes = Buffer.from('modified-pdf-bytes-differing-hash');
  await runWorker(['--task-id=' + t03Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  assert(lastExitCode === 1, 'Worker must exit on modified source bytes');
  assert(capturedErrors.includes('RC_SYLLABUS_P06_BLOCKED_SOURCE_SHA_MISMATCH'), 'Logs should flag SHA mismatch');
  currentMockBytes = Buffer.from('real-mock-pdf-bytes-for-neet-ug-2026'); // restore

  // --- P06-T04: Missing expected SHA ---
  originalConsoleLog('Running P06-T04: Missing expected SHA...');
  const t04Task = 'test_task_p06_t04';
  await resetTask(t04Task, { ...baseTaskData, id: t04Task, document_id: 'hash_' });
  await runWorker(['--task-id=' + t04Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  assert(lastExitCode === 1, 'Exit on missing expected SHA');
  assert(capturedErrors.includes('RC_SYLLABUS_P06_BLOCKED_EXPECTED_SHA_MISSING'), 'Log missing SHA code');
  
  const t04TaskDoc = (await db.collection('ai_queue').doc(t04Task).get()).data();
  assert(t04TaskDoc.status === 'failed' && t04TaskDoc.failure_reason === 'RC_SYLLABUS_P06_BLOCKED_EXPECTED_SHA_MISSING', 'Task marked with missing expected SHA reason');

  // --- P06-T05: Malformed expected SHA ---
  originalConsoleLog('Running P06-T05: Malformed expected SHA...');
  const t05Task = 'test_task_p06_t05';
  await resetTask(t05Task, { ...baseTaskData, id: t05Task, document_id: 'hash_not_64_chars' });
  await runWorker(['--task-id=' + t05Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  assert(lastExitCode === 1, 'Exit on malformed expected SHA');
  assert(capturedErrors.includes('RC_SYLLABUS_P06_BLOCKED_EXPECTED_SHA_INVALID'), 'Log malformed SHA code');
  
  const t05TaskDoc = (await db.collection('ai_queue').doc(t05Task).get()).data();
  assert(t05TaskDoc.status === 'failed' && t05TaskDoc.failure_reason === 'RC_SYLLABUS_P06_BLOCKED_EXPECTED_SHA_INVALID', 'Task marked invalid expected SHA');

  // --- P06-T06: Source-byte retrieval failure ---
  originalConsoleLog('Running P06-T06: Source-byte retrieval failure...');
  const t06Task = 'test_task_p06_t06';
  await resetTask(t06Task, { ...baseTaskData, id: t06Task });
  axiosThrowError = true;
  await runWorker(['--task-id=' + t06Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  assert(lastExitCode === 1, 'Exit on byte retrieval failure');
  assert(capturedErrors.includes('RC_SYLLABUS_P06_BLOCKED_SOURCE_BYTES_UNAVAILABLE'), 'Log bytes unavailable code');
  axiosThrowError = false; // restore

  // --- P06-T07: Verify parser is NOT invoked after a failed SHA check ---
  originalConsoleLog('Running P06-T07: Verify parser is NOT invoked after failed SHA...');
  const t07Task = 'test_task_p06_t07';
  await resetTask(t07Task, { ...baseTaskData, id: t07Task, document_id: 'hash_0000000000000000000000000000000000000000000000000000000000000000' });
  await runWorker(['--task-id=' + t07Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  assert(pdfParseCallCount === 0, 'PARSER_CALL_COUNT_ON_SHA_FAILURE must be exactly 0');

  // --- P06-T08: Verify no page extraction writes after failed SHA check ---
  originalConsoleLog('Running P06-T08: Verify no page writes after failed SHA...');
  const t08Task = 'test_task_p06_t08';
  const wrongDocId = 'hash_0000000000000000000000000000000000000000000000000000000000000000';
  await resetTask(t08Task, { ...baseTaskData, id: t08Task, document_id: wrongDocId });
  await clearExtractions(targetMission, wrongDocId);
  await runWorker(['--task-id=' + t08Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  const t08Pages = await db.collection(`mission_realms/${targetMission}/official_documents/${wrongDocId}/page_extractions`).get();
  assert(t08Pages.size === 0, 'No pages should be written to page_extractions subcollection');

  // --- P06-T09: Verify task cannot be completed after failed SHA check ---
  originalConsoleLog('Running P06-T09: Verify task cannot be completed after failed SHA...');
  const t09Task = 'test_task_p06_t09';
  await resetTask(t09Task, { ...baseTaskData, id: t09Task, document_id: wrongDocId });
  await runWorker(['--task-id=' + t09Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  const t09TaskDoc = (await db.collection('ai_queue').doc(t09Task).get()).data();
  assert(t09TaskDoc.status !== 'completed', 'Task status must not be completed');

  // --- P06-T10: Correct SHA preserves existing native extraction flow ---
  originalConsoleLog('Running P06-T10: Correct SHA preserves native extraction flow...');
  const t10Task = 'test_task_p06_t10';
  await resetTask(t10Task, { ...baseTaskData, id: t10Task });
  await clearExtractions(targetMission, validDocId);
  await runWorker(['--task-id=' + t10Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  const t10PageDoc = (await db.collection(`mission_realms/${targetMission}/official_documents/${validDocId}/page_extractions`).doc('25').get()).data();
  assert(t10PageDoc.extraction_method === 'native_pdf_text', 'Extraction method must be native_pdf_text');

  // --- P06-T11: P07 exact-task contract regression ---
  originalConsoleLog('Running P06-T11: P07 exact-task contract regression...');
  await runWorker(['--task-id=non_existent_task_id', '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  assert(lastExitCode === 1, 'Exits on non-existent task');
  assert(capturedErrors.includes('RC_SYLLABUS_P1_BLOCKED_EXACT_TASK_NOT_FOUND'), 'Flag exact task not found error');

  // --- P06-T12: P08 one-task enforcement regression ---
  originalConsoleLog('Running P06-T12: P08 one-task enforcement regression...');
  await runWorker(['--task-id=some_task', '--limit=2', '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  assert(lastExitCode === 1, 'Exits on explicit task with limit !== 1');
  assert(capturedErrors.includes('RC_SYLLABUS_P1_BLOCKED_EXPLICIT_TASK_LIMIT_MUST_BE_1'), 'Flag limit must be 1 error');

  // --- P06-T13: P03 mission/document scope regression ---
  originalConsoleLog('Running P06-T13: P03 scope gating regression...');
  await runWorker(['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  assert(lastExitCode === 1, 'Exits on unscoped apply');
  assert(capturedErrors.includes('RC_SYLLABUS_P1_BLOCKED_UNSCOPED_APPLY'), 'Flag unscoped apply error');

  // --- P06-T14: P05 empty-text fail-closed regression ---
  originalConsoleLog('Running P06-T14: P05 empty-text fail-closed regression...');
  const t14Task = 'test_task_p06_t14';
  await resetTask(t14Task, { ...baseTaskData, id: t14Task });
  pdfParseMockText = ''; // empty text mock
  await runWorker(['--task-id=' + t14Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  const t14TaskDoc = (await db.collection('ai_queue').doc(t14Task).get()).data();
  assert(t14TaskDoc.status === 'failed', 'Empty text pages must fail task');
  assert(t14TaskDoc.failure_reason === 'NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED', 'Failed with empty native text reason');
  pdfParseMockText = 'Sample NEET UG 2026 page text content'; // restore

  // --- P06-T15: P04 simulated wrapper remains blocked ---
  originalConsoleLog('Running P06-T15: P04 simulation containment regression...');
  const t15Task = 'test_task_p06_t15';
  await resetTask(t15Task, { ...baseTaskData, id: t15Task });
  await clearExtractions(targetMission, validDocId);
  pdfParseMockText = 'This is a Simulated text response placeholder'; // simulated keyword
  await runWorker(['--task-id=' + t15Task, '--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION']);
  
  const t15TaskDoc = (await db.collection('ai_queue').doc(t15Task).get()).data();
  assert(t15TaskDoc.status === 'failed', 'Simulated text must fail task');
  assert(t15TaskDoc.failure_reason === 'NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED', 'Failed with empty/unsupported reason');
  pdfParseMockText = 'Sample NEET UG 2026 page text content'; // restore

  originalConsoleLog('\n============================================================');
  originalConsoleLog(`TEST RESULTS: ${15 - failedTests}/15 PASSED`);
  originalConsoleLog('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch(originalConsoleError);
