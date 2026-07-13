const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R4 - LIMIT-3 RESULT & POLICY AUDIT');
  console.log('==============================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  const p4Tasks = [
    'rc_x4a_pagewise_auto_detect_hash_d99e44db716c44f7b210952651f5e9fea5918584cb7c49dc3c8d1d0a6a4f6f86_b2_p6_10',
    'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b3_p11_15',
    'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b4_p16_17'
  ];

  console.log('\n--- Part C: Verify P4-L3 Per-Task Results ---');
  for (const tid of p4Tasks) {
    const taskDoc = await db.collection('ai_queue').doc(tid).get();
    if (!taskDoc.exists) {
      console.log(`- task_id: ${tid} (MISSING)`);
      continue;
    }
    const task = taskDoc.data();
    console.log(`- task_id: ${tid}`);
    console.log(`  mission_id: ${task.mission_id}`);
    console.log(`  document_id: ${task.document_id}`);
    console.log(`  document_type: ${task.document_type}`);
    console.log(`  page_range: ${task.page_start}-${task.page_end}`);
    console.log(`  status: ${task.status}`);
    if (task.status === 'failed') {
      console.log(`  failure_reason: ${task.failure_reason}`);
    } else if (task.status === 'completed') {
      console.log(`  page_extractions_created: ${task.page_extractions_created}`);
    }
    console.log(`  created_by: ${task.created_by_patch_completed || task.created_by_patch_failed || 'N/A'}`);
    console.log(`  updated_at exists: ${!!task.updated_at}`);
  }

  console.log('\n--- Part D: Verify JEE Pages 1-17 Continuity ---');
  const jeeMissionId = 'jee_main_2026';
  const jeeDocId = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
  const extractionPath = `mission_realms/${jeeMissionId}/official_documents/${jeeDocId}/page_extractions`;
  const extractionsSnap = await db.collection(extractionPath).get();

  const records = extractionsSnap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => Number(a.id) - Number(b.id));
  const foundPages = records.map(r => Number(r.id));
  console.log(`- pages found: ${foundPages.join(', ')} (Total: ${records.length})`);

  let continuityValid = true;
  for (let i = 1; i <= 17; i++) {
    if (!foundPages.includes(i)) {
      console.log(`  MISSING PAGE: ${i}`);
      continuityValid = false;
    }
  }

  const taskMappings = {
    1: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b1_p1_5',
    2: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b1_p1_5',
    3: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b1_p1_5',
    4: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b1_p1_5',
    5: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b1_p1_5',
    6: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b2_p6_10',
    7: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b2_p6_10',
    8: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b2_p6_10',
    9: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b2_p6_10',
    10: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b2_p6_10',
    11: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b3_p11_15',
    12: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b3_p11_15',
    13: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b3_p11_15',
    14: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b3_p11_15',
    15: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b3_p11_15',
    16: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b4_p16_17',
    17: 'rc_x4a_pagewise_jee_main_2026_hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905_b4_p16_17'
  };

  const forbiddenFields = ['published', 'approved', 'verified', 'founder_approved', 'publish_status', 'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id', 'ai_generated', 'ocr_used'];

  for (const rec of records) {
    const pageNum = Number(rec.id);
    if (pageNum > 17) continue;
    const expectedTaskId = taskMappings[pageNum];
    const isLinked = rec.extracted_by_task_id === expectedTaskId;
    const forbiddenFound = forbiddenFields.filter(f => rec[f] !== undefined);
    if (!isLinked || forbiddenFound.length > 0 || !rec.source_proof || rec.extraction_text.length < 100) {
      console.log(`  INVALID RECORD Page ${pageNum}: linked=${isLinked}, forbidden=${forbiddenFound.join(',') || 'NONE'}, proof=${!!rec.source_proof}, len=${rec.extraction_text?.length}`);
      continuityValid = false;
    }
  }

  if (continuityValid && records.length === 17) {
    console.log('- Verdict: Segment 1-17 continuity and schema are valid.');
  } else {
    console.error('RC_X4E_R4_JEE_CONTINUITY_OR_SCHEMA_BLOCKED');
    process.exit(1);
  }

  console.log('\n--- Part E: Verify Global Queue State ---');
  const allPagewiseSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const allTasks = allPagewiseSnap.docs.map(d => d.data());
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

  const extractionsGlobalSnap = await db.collectionGroup('page_extractions').get();
  console.log(`- total global page_extractions records: ${extractionsGlobalSnap.size}`);

  if (counts.completed !== 4 || counts.failed !== 3 || extractionsGlobalSnap.size !== 17) {
    console.log('  WARNING: Global counts differ from expectations (C:4, F:3, PE:17)');
  }

  console.log('\n--- Part F: Verify Failed Tasks Classification ---');
  const failedTasks = allPagewiseSnap.docs.filter(d => d.data().status === 'failed').map(d => ({id: d.id, ...d.data()}));
  for (const ft of failedTasks) {
    let classification = 'OTHER_FAILURE_REVIEW_REQUIRED';
    if (ft.failure_reason === 'NATIVE_TEXT_EXTRACTION_ERROR' && (ft.error_message?.includes('pdfParse') || ft.error_message?.includes('credential'))) {
      classification = 'OLD_RUNTIME_FAILURE';
    } else if (ft.failure_reason === 'NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED') {
      classification = 'EXPECTED_NATIVE_EMPTY_TEXT_FAILURE';
    }
    console.log(`- task_id: ${ft.id} | reason: ${ft.failure_reason} | class: ${classification}`);
  }

  console.log('\n--- Part G: Parent Document Side-Effect Check ---');
  const parentDoc = (await db.collection('mission_realms').doc(jeeMissionId).collection('official_documents').doc(jeeDocId).get()).data();
  const sideEffectFields = ['published', 'approved', 'verified', 'founder_approved', 'atom_count', 'fact_count', 'question_count'];
  const foundEffects = sideEffectFields.filter(f => parentDoc[f] !== undefined);
  console.log(`- parent_doc_side_effect_fields_found: ${foundEffects.join(', ') || 'NONE'}`);

  console.log('\n--- Part H: Candidate Selection Policy Audit ---');
  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  const workerContent = fs.readFileSync(workerPath, 'utf8');

  const justSelectsFirst = workerContent.includes('allActiveTasks.slice(0, cli.limit)');
  const filtersScanned = workerContent.includes('mission_id !== \'AUTO_DETECT\'');

  console.log(`- selects first queued tasks by order: ${justSelectsFirst}`);
  console.log(`- filters out AUTO_DETECT scanned candidates: ${filtersScanned}`);

  if (justSelectsFirst && !filtersScanned) {
    console.log('\nWARNING: RC_X4E_R4_CANDIDATE_POLICY_WARNING_AUTO_DETECT_SELECTED');
    console.log('Reason: The default selection logic only uses slice(0, limit), allowing scanned AUTO_DETECT tasks at the front of lexicographical/chronological order to be picked.');
  }

  console.log('\n--- Part I: Candidate Hardening Plan ---');
  console.log('RECOMMENDED NEXT PATCH: RC-X4E-P5-CANDIDATE-FIX');
  console.log('Requirements:');
  console.log('1. Add --prefer-native-digital selector mode to worker.');
  console.log('2. Implement automatic native text probe for all 3 tasks in limit-3 readiness audit.');
  console.log('3. Block AUTO_DETECT from selection unless --allow-auto-detect is passed.');
  console.log('4. Ensure candidate selector skips documents with recent native-empty failures.');

  console.log('\nRC_X4E_R4_LIMIT3_RESULT_AUDIT_READY_WITH_CANDIDATE_POLICY_WARNING');
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
