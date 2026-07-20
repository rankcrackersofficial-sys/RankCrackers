const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R11 - FIRST SUCCESSFUL EXTRACTION AUDIT');
  console.log('==============================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  const selectedTaskId = 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b1_p1_5';

  console.log(`\n--- Part C: Verify Completed Task (${selectedTaskId}) ---`);
  const taskDoc = await db.collection('ai_queue').doc(selectedTaskId).get();

  if (!taskDoc.exists) {
      console.error('BLOCKER: Completed task document missing');
      process.exit(1);
  }

  const task = taskDoc.data();
  console.log(`- task_id: ${taskDoc.id}`);
  console.log(`- status: ${task.status}`);
  console.log(`- mission_id: ${task.mission_id}`);
  console.log(`- document_id: ${task.document_id}`);
  console.log(`- document_type: ${task.document_type}`);
  console.log(`- source_document_id: ${task.source_document_id}`);
  console.log(`- source_path: ${task.source_path}`);
  console.log(`- page_start: ${task.page_start}`);
  console.log(`- page_end: ${task.page_end}`);
  console.log(`- page_extractions_created: ${task.page_extractions_created}`);
  console.log(`- extraction_method: ${task.extraction_method}`);
  console.log(`- completed_at exists: ${!!task.completed_at}`);
  console.log(`- updated_at exists: ${!!task.updated_at}`);
  console.log(`- created_by_patch_completed: ${task.created_by_patch_completed}`);

  const statusMatch = task.status === 'completed';
  const missionMatch = task.mission_id === 'jee_main_2026';
  const rangeMatch = task.page_start === 1 && task.page_end === 5;
  const countMatch = task.page_extractions_created === 5;
  const methodMatch = task.extraction_method === 'native_pdf_text';

  if (!statusMatch || !missionMatch || !rangeMatch || !countMatch || !methodMatch) {
      console.error('RC_X4E_R2_COMPLETED_TASK_STATE_MISMATCH');
      process.exit(1);
  } else {
      console.log('- Verdict: Task state matches expectations.');
  }

  console.log('\n--- Part D: Verify Page Extraction Records ---');
  const extractionPath = `mission_realms/${task.mission_id}/official_documents/${task.document_id}/page_extractions`;
  const extractionsSnap = await db.collection(extractionPath).get();

  console.log(`- extraction records count for target doc: ${extractionsSnap.size}`);

  const forbiddenFields = ['published', 'approved', 'verified', 'founder_approved', 'publish_status', 'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id', 'ai_generated', 'ocr_used'];

  const records = extractionsSnap.docs
    .map(d => ({id: d.id, ...d.data()}))
    .filter(rec => rec.page_number >= 1 && rec.page_number <= 5)
    .sort((a,b) => Number(a.id) - Number(b.id));

  let allRecordsValid = true;
  for (const rec of records) {
      console.log(`\n- page_number: ${rec.page_number}`);
      const textLen = rec.extraction_text?.length || 0;
      console.log(`  text_length: ${textLen}`);
      console.log(`  extraction_status: ${rec.extraction_status}`);
      console.log(`  review_status: ${rec.review_status}`);

      const proofValid = rec.source_proof &&
                         rec.source_proof.source_path === task.source_path &&
                         rec.source_proof.page_number === rec.page_number &&
                         rec.source_proof.task_id === selectedTaskId;
      console.log(`  source_proof_valid: ${!!proofValid}`);

      const policyValid = rec.page_policy &&
                          rec.page_policy.all_pages_required === true &&
                          rec.page_policy.fixed_page_limit_allowed === false &&
                          rec.page_policy.batch_size_is_not_page_limit === true;
      console.log(`  page_policy_valid: ${!!policyValid}`);

      const foundForbidden = forbiddenFields.filter(f => rec[f] !== undefined);
      console.log(`  forbidden_fields_found: ${foundForbidden.join(', ') || 'NONE'}`);

      if (textLen === 0 ||
          rec.extraction_status !== 'extracted_draft' ||
          rec.review_status !== 'pending_founder_verification' ||
          rec.extraction_method !== 'native_pdf_text' ||
          !proofValid || !policyValid || foundForbidden.length > 0) {
          allRecordsValid = false;
      }
  }

  if (!allRecordsValid || records.length !== 5) {
      console.error('RC_X4E_R2_PAGE_EXTRACTION_RECORD_INVALID');
      process.exit(1);
  } else {
      console.log('\n- Verdict: All 5 page records are valid.');
  }

  console.log('\n--- Part E: Text Quality Sanity Check ---');
  for (const rec of records) {
      const text = rec.extraction_text || '';
      console.log(`\n- Page ${rec.page_number} Quality:`);
      console.log(`  Length: ${text.length}`);
      console.log(`  Snippet: ${text.substring(0, 120).replace(/\\n/g, ' ')}...`);

      const isWhitespace = text.trim().length === 0;
      const isObjectString = text.includes('[object Object]');

      if (text.length < 100) console.log('  WARNING: Short text length (< 100)');
      if (isWhitespace) console.log('  ERROR: Text is only whitespace');
      if (isObjectString) console.log('  ERROR: Text contains "[object Object]"');

      if (isWhitespace || isObjectString) {
          console.error('RC_X4E_R2_TEXT_QUALITY_ERROR');
          process.exit(1);
      }
  }

  console.log('\n--- Part F: Verify Global Queue State ---');
  const allPagewiseSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const allTasks = allPagewiseSnap.docs.map(d => ({id: d.id, ...d.data()}));

  const groups = {
      active: allTasks.filter(t => ['queued', 'pending'].includes(t.status)),
      completed: allTasks.filter(t => t.status === 'completed'),
      failed: allTasks.filter(t => t.status === 'failed')
  };

  console.log(`- total pagewise tasks: ${allTasks.length}`);
  console.log(`- active queued/pending: ${groups.active.length}`);
  console.log(`- completed: ${groups.completed.length}`);
  console.log(`- failed: ${groups.failed.length}`);

  let totalRecordsFound = 0;
  let docsWithRecords = 0;
  const missionsSnap = await db.collection('mission_realms').get();
  for (const mDoc of missionsSnap.docs) {
      const docsSnap = await mDoc.ref.collection('official_documents').get();
      for (const doc of docsSnap.docs) {
          const exSnap = await doc.ref.collection('page_extractions').get();
          if (exSnap.size > 0) {
              docsWithRecords++;
              totalRecordsFound += exSnap.size;
              console.log(`  Document with extractions: ${mDoc.id}/${doc.id} (Count: ${exSnap.size})`);
          }
      }
  }
  console.log(`- documents with page_extractions: ${docsWithRecords}`);
  console.log(`- total page_extraction records found: ${totalRecordsFound}`);

  if (docsWithRecords !== 3 || totalRecordsFound !== 118) {
      console.error('RC_X4E_R13_BASELINE_MISMATCH');
      process.exit(1);
  }

  console.log('\n--- Part G: Verify No Publish/Approval Side Effects ---');
  const parentDocRef = db.collection('mission_realms').doc(task.mission_id).collection('official_documents').doc(task.document_id);
  const parentDoc = (await parentDocRef.get()).data();

  const forbiddenParentFields = ['published', 'approved', 'verified', 'founder_approved', 'publish_status'];
  const genFields = ['atom_count', 'fact_count', 'question_count', 'crucible_item_count', 'digibook_unit_count'];

  const foundPub = forbiddenParentFields.filter(f => parentDoc[f] !== undefined);
  const foundGen = genFields.filter(f => parentDoc[f] !== undefined);

  console.log(`- parent_doc_publish_fields_found: ${foundPub.join(', ') || 'NONE'}`);
  console.log(`- parent_doc_generation_fields_found: ${foundGen.join(', ') || 'NONE'}`);

  if (foundPub.length > 0 || foundGen.length > 0) {
      console.error('RC_X4E_R2_PARENT_DOC_SIDE_EFFECT_DETECTED');
      process.exit(1);
  }

  console.log('\n--- Part H: Verify --task-id Targeting Safety ---');
  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  const workerContent = fs.readFileSync(workerPath, 'utf8');

  const hasTaskId = workerContent.includes('cli.taskId');
  const hasFilter = workerContent.includes('allActiveTasks.find(t => t.id === cli.taskId)');
  const hasLimitLock = workerContent.includes('cli.limit !== 3');

  console.log(`- --task-id support: ${hasTaskId ? 'YES' : 'NO'}`);
  console.log(`- filtering logic exists: ${hasFilter ? 'YES' : 'NO'}`);
  console.log(`- limit 3 lock exists: ${hasLimitLock ? 'YES' : 'NO'}`);

  if (!hasTaskId || !hasFilter || !hasLimitLock) {
      console.error('RC_X4E_R11_TASK_ID_TARGETING_UNSAFE');
      process.exit(1);
  }

  console.log('\nRC_X4E_R13_FIRST_SUCCESSFUL_EXTRACTION_AUDIT_READY');
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
