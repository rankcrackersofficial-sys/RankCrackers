const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R3 - TWO-BATCH CONTINUITY AUDIT');
  console.log('==============================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  const taskIds = [
    'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b1_p1_5',
    'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b2_p6_10'
  ];

  console.log('\n--- Part C: Verify Completed Tasks ---');
  let docId = '';
  let missionId = '';
  for (const tid of taskIds) {
      const taskDoc = await db.collection('ai_queue').doc(tid).get();
      if (!taskDoc.exists) {
          console.error(`BLOCKER: Task ${tid} missing`);
          process.exit(1);
      }
      const task = taskDoc.data();
      console.log(`- task_id: ${tid}`);
      console.log(`  status: ${task.status}`);
      console.log(`  page_range: ${task.page_start}-${task.page_end}`);

      if (task.status !== 'completed') {
          console.error(`BLOCKER: Task ${tid} is not completed`);
          process.exit(1);
      }
      docId = task.document_id;
      missionId = task.mission_id;
  }

  console.log('\n--- Part D/E: Verify Page Sequence & Schema (1-10) ---');
  const extractionPath = `mission_realms/${missionId}/official_documents/${docId}/page_extractions`;
  const extractionsSnap = await db.collection(extractionPath).get();

  console.log(`- total records for doc: ${extractionsSnap.size}`);
  const records = extractionsSnap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => Number(a.id) - Number(b.id));

  const expectedPages = [1,2,3,4,5,6,7,8,9,10];
  const foundPages = records.map(r => Number(r.id));

  const missing = expectedPages.filter(p => !foundPages.includes(p));
  const duplicates = foundPages.filter((p, i) => foundPages.indexOf(p) !== i);

  console.log(`- pages found: ${foundPages.join(', ')}`);
  console.log(`- missing pages: ${missing.join(', ') || 'NONE'}`);
  console.log(`- duplicate pages: ${duplicates.join(', ') || 'NONE'}`);

  if (missing.length > 0 || duplicates.length > 0 || records.length !== 10) {
      console.error('RC_X4E_R3_PAGE_SEQUENCE_OR_LINKAGE_INVALID');
      process.exit(1);
  }

  const forbiddenFields = ['published', 'approved', 'verified', 'founder_approved', 'publish_status', 'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id', 'ai_generated', 'ocr_used'];

  let schemaValid = true;
  for (const rec of records) {
      const pageNum = Number(rec.page_number);
      const taskId = pageNum <= 5 ? taskIds[0] : taskIds[1];
      const proofValid = rec.source_proof && rec.source_proof.task_id === taskId && rec.source_proof.page_number === pageNum;
      const forbiddenFound = forbiddenFields.filter(f => rec[f] !== undefined);

      if (!proofValid || forbiddenFound.length > 0 || rec.extraction_text.length < 100) {
          console.error(`- page ${pageNum} invalid: proof=${!!proofValid}, forbidden=${forbiddenFound.join(',') || 'NONE'}, len=${rec.extraction_text.length}`);
          schemaValid = false;
      }
  }

  if (!schemaValid) {
      console.error('RC_X4E_R3_RECORD_SCHEMA_INVALID');
      process.exit(1);
  }
  console.log('- Verdict: Sequence and schema are valid.');

  console.log('\n--- Part F: Text Continuity / Quality ---');
  let prevText = '';
  for (const rec of records) {
      const text = rec.extraction_text || '';
      const isIdentical = text === prevText;
      console.log(`- page ${rec.page_number}: len=${text.length}, identical_to_prev=${isIdentical}, snippet=${text.substring(0, 60).replace(/\\n/g, ' ')}...`);
      if (isIdentical && text.length > 0) {
          console.error('RC_X4E_R3_TEXT_QUALITY_BLOCKED: Identical consecutive pages');
          process.exit(1);
      }
      prevText = text;
  }

  console.log('\n--- Part G: Parent Document Side Effects ---');
  const parentDoc = (await db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId).get()).data();
  const sideEffectFields = ['published', 'approved', 'verified', 'founder_approved', 'atom_count', 'fact_count'];
  const foundEffects = sideEffectFields.filter(f => parentDoc[f] !== undefined);
  console.log(`- side effects found: ${foundEffects.join(', ') || 'NONE'}`);
  if (foundEffects.length > 0) {
      console.error('RC_X4E_R3_PARENT_SIDE_EFFECT_DETECTED');
      process.exit(1);
  }

  console.log('\n--- Part H: Global Queue Reconciliation ---');
  const allTasksSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const allTasks = allTasksSnap.docs.map(d => d.data());
  const counts = {
      total: allTasks.length,
      active: allTasks.filter(t => ['queued', 'pending'].includes(t.status)).length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      failed: allTasks.filter(t => t.status === 'failed').length
  };
  console.log(`- total: ${counts.total}`);
  console.log(`- active: ${counts.active}`);
  console.log(`- completed: ${counts.completed}`);
  console.log(`- failed: ${counts.failed}`);

  if (counts.completed !== 2 || counts.failed !== 2) {
      console.log('  WARNING: Global counts differ from expected (C:2, F:2)');
  }

  console.log('\n--- Part I: Scaling Readiness ---');
  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  const workerContent = fs.readFileSync(workerPath, 'utf8');
  const hasLimit1 = workerContent.includes('cli.limit !== 1');
  const hasTaskId = workerContent.includes('cli.taskId');
  console.log(`- worker has --limit 1 lock: ${hasLimit1}`);
  console.log(`- worker has --task-id support: ${hasTaskId}`);

  console.log('\nscaling_recommendation: Option B (RC-X4E-P4-L3 - Controlled Limit 3)');
  console.log('\nRC_X4E_R3_TWO_BATCH_CONTINUITY_AUDIT_READY');
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
