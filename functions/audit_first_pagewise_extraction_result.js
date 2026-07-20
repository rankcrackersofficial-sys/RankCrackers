const admin = require('firebase-admin');
const cp = require('child_process');
const axios = require('axios');
const { PDFParse } = require('pdf-parse');

const PROJECT_ID = 'rankcrackers-55';

function getAccessToken() {
  try { return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim(); }
  catch (error) {
    console.error('Authentication Error: Could not get gcloud access token.', error.message);
    process.exit(1);
  }
}

async function resolveSourceBytes(path, token) {
  if (!path) throw new Error('EMPTY_SOURCE_PATH');
  const headers = { 'Authorization': `Bearer ${token}` };
  const bucket = `${PROJECT_ID}.firebasestorage.app`;
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
  const response = await axios.get(url, { headers, responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function probeNativeText(bytes) {
    const parser = new PDFParse({ data: bytes });
    try {
        const result = await parser.getText({ partial: [1] });
        const text = result.pages?.[0]?.text || result.text || '';
        return { hasText: text.trim().length > 0, length: text.trim().length };
    } catch (e) {
        return { hasText: false, error: e.message };
    } finally {
        await parser.destroy();
    }
}

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R11 - FIRST PAGEWISE EXTRACTION AUDIT');
  console.log('==============================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();
  const token = getAccessToken();

  const lastFailedTaskId = 'rc_x4a_pagewise_auto_detect_hash_d99e44db716c44f7b210952651f5e9fea5918584cb7c49dc3c8d1d0a6a4f6f86_b1_p1_5';

  console.log(`\n--- Part C: Verify Failed Task (${lastFailedTaskId}) ---`);
  const taskDoc = await db.collection('ai_queue').doc(lastFailedTaskId).get();

  if (!taskDoc.exists) {
      console.error('BLOCKER: Last failed task document missing');
      process.exit(1);
  }

  const task = taskDoc.data();
  console.log(`- task_id: ${taskDoc.id}`);
  console.log(`- status: ${task.status}`);
  console.log(`- failure_reason: ${task.failure_reason}`);
  console.log(`- error_message: ${task.error_message}`);
  console.log(`- mission_id: ${task.mission_id}`);
  console.log(`- document_id: ${task.document_id}`);
  console.log(`- document_type: ${task.document_type}`);
  console.log(`- source_path: ${task.source_path}`);
  console.log(`- page_start: ${task.page_start}`);
  console.log(`- page_end: ${task.page_end}`);
  console.log(`- created_by_patch_failed: ${task.created_by_patch_failed}`);
  console.log(`- updated_at exists: ${!!task.updated_at}`);

  const expectedReason = 'NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED';
  const reasonMatch = task.failure_reason === expectedReason;
  const statusMatch = task.status === 'failed';
  const rangeMatch = task.page_start === 1 && task.page_end === 5;
  const errorMatch = task.error_message.includes('1, 2, 3, 5');

  if (!reasonMatch || !statusMatch || !rangeMatch || !errorMatch) {
      console.log('\nRC_X4E_R1_FAILED_TASK_STATE_MISMATCH');
      if (!reasonMatch) console.log(`  - Expected reason: ${expectedReason}, got: ${task.failure_reason}`);
      if (!statusMatch) console.log(`  - Expected status: failed, got: ${task.status}`);
      if (!rangeMatch) console.log(`  - Expected range: 1-5, got: ${task.page_start}-${task.page_end}`);
      if (!errorMatch) console.log(`  - Error message missing expected pages: ${task.error_message}`);
  } else {
      console.log('- Verdict: Task state matches expectations.');
  }

  console.log('\n--- Part D: Verify No Page Extractions Created ---');
  const extractionPath = `mission_realms/${task.mission_id}/official_documents/${task.document_id}/page_extractions`;
  const extractionsSnap = await db.collection(extractionPath).get();

  console.log(`- extraction records count for target doc: ${extractionsSnap.size}`);
  console.log(`- pages found: ${extractionsSnap.docs.map(d => d.id).join(', ')}`);
  console.log(`- expected empty: true`);

  if (extractionsSnap.size > 0) {
      console.error('\nRC_X4E_R1_BLOCKED_FAILED_TASK_CREATED_EXTRACTIONS');
      process.exit(1);
  } else {
      console.log('- Verdict: Correctly no extractions created.');
  }

  console.log('\n--- Part E: Verify Global Queue State ---');
  const allPagewiseSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const allTasks = allPagewiseSnap.docs.map(d => ({id: d.id, ...d.data()}));

  const groups = {
      queued: allTasks.filter(t => t.status === 'queued' || t.status === 'pending'),
      processing: allTasks.filter(t => t.status === 'processing' || t.status === 'running'),
      completed: allTasks.filter(t => t.status === 'completed' || t.status === 'success'),
      failed: allTasks.filter(t => t.status === 'failed'),
      unexpected: allTasks.filter(t => !['queued', 'pending', 'processing', 'running', 'completed', 'success', 'failed'].includes(t.status))
  };

  console.log(`- total pagewise tasks: ${allTasks.length}`);
  console.log(`- active queued/pending: ${groups.queued.length}`);
  console.log(`- processing/running: ${groups.processing.length}`);
  console.log(`- completed: ${groups.completed.length}`);
  console.log(`- failed: ${groups.failed.length}`);
  console.log(`- unexpected status: ${groups.unexpected.length}`);

  // Document extraction count (slow scan)
  let docWithExtractionsCount = 0;
  const missionsSnap = await db.collection('mission_realms').get();
  for (const missionDoc of missionsSnap.docs) {
      const docsSnap = await missionDoc.ref.collection('official_documents').get();
      for (const doc of docsSnap.docs) {
          const exSnap = await doc.ref.collection('page_extractions').limit(1).get();
          if (!exSnap.empty) docWithExtractionsCount++;
      }
  }
  console.log(`- documents with page_extractions count: ${docWithExtractionsCount}`);

  console.log('\n--- Part F: Classify Failed Tasks ---');
  for (const ft of groups.failed) {
      console.log(`\n- task_id: ${ft.id}`);
      console.log(`  mission_id: ${ft.mission_id}`);
      console.log(`  document_id: ${ft.document_id}`);
      console.log(`  page range: ${ft.page_start}-${ft.page_end}`);
      console.log(`  failure_reason: ${ft.failure_reason}`);
      console.log(`  error_message: ${ft.error_message}`);
      console.log(`  created_by_patch_failed: ${ft.created_by_patch_failed}`);

      if (ft.failure_reason === 'NATIVE_TEXT_EXTRACTION_ERROR' && (ft.error_message.includes('pdfParse') || ft.error_message.includes('credential'))) {
          console.log('  Classification: OLD_RUNTIME_FAILURE');
      } else if (ft.failure_reason === 'NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED') {
          console.log('  Classification: EXPECTED_NATIVE_EMPTY_TEXT_FAILURE');
      } else {
          console.log('  Classification: OTHER_FAILURE_REVIEW_REQUIRED');
      }
  }

  console.log('\n--- Part G: Next Candidate Selection Preview ---');
  const top10Active = groups.queued.sort((a,b) => {
      const timeA = a.created_at?.toMillis?.() || 0;
      const timeB = b.created_at?.toMillis?.() || 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id);
  }).slice(0, 10);

  for (const t of top10Active) {
      console.log(`\n- task_id: ${t.id}`);
      console.log(`  mission_id: ${t.mission_id}`);
      console.log(`  document_type: ${t.document_type}`);
      console.log(`  pages: ${t.page_start}-${t.page_end}`);

      let access = 'unknown';
      let fileSize = 'unknown';
      let probe = { hasText: 'unknown' };

      try {
          const bytes = await resolveSourceBytes(t.source_path, token);
          access = 'YES';
          fileSize = bytes.length;
          probe = await probeNativeText(bytes);
      } catch (e) {
          access = 'NO (' + e.message + ')';
      }

      console.log(`  source access: ${access}`);
      console.log(`  source size: ${fileSize}`);
      console.log(`  native text layer: ${probe.hasText === true ? 'YES' : (probe.hasText === false ? 'NO' : 'UNKNOWN')}`);

      let candidate = 'NO';
      let reason = '';

      if (t.mission_id === 'AUTO_DETECT') {
          reason = 'Avoid AUTO_DETECT for first success test.';
      } else if (probe.hasText === false) {
          reason = 'No native text layer detected in probe.';
      } else if (probe.hasText === true) {
          candidate = 'YES';
          reason = 'Digital PDF with native text layer found.';
      } else {
          reason = 'Probe failed or inconclusive.';
      }

      console.log(`  likely_native_text_candidate: ${candidate}`);
      console.log(`  reason: ${reason}`);
  }

  if (groups.queued.length !== 64 || groups.completed.length !== 37 || groups.failed.length !== 3) {
      console.error('RC_X4E_R13_BASELINE_MISMATCH');
      process.exit(1);
  }

  console.log('\nRC_X4E_R13_FIRST_EXTRACTION_RESULT_AUDIT_READY');
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
