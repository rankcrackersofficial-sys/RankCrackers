const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

const BASELINE_POST_P13 = {
  total: 104,
  active: 70,
  completed: 31,
  failed: 3,
  processing: 0,
  page_extractions: 96
};

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-IR1 - UNDOCUMENTED APPLY INCIDENT REVIEW');
  console.log('==============================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  // Part C: Identify Undocumented Completed Tasks
  console.log('\n--- Part C: Identifying Undocumented Completed Tasks ---');
  const allTasksSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .get();

  const allTasks = allTasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const completedTasks = allTasks.filter(t => t.status === 'completed');

  // Sort by completed_at descending (last completed first)
  completedTasks.sort((a, b) => {
    const timeA = a.completed_at?.toMillis() || 0;
    const timeB = b.completed_at?.toMillis() || 0;
    return timeB - timeA;
  });

  console.log('Last 10 completed tasks:');
  completedTasks.slice(0, 10).forEach(t => {
    console.log(`- task_id: ${t.id}`);
    console.log(`  mission_id: ${t.mission_id} | document_id: ${t.document_id}`);
    console.log(`  range: ${t.page_start}-${t.page_end} | PE created: ${t.page_extractions_created}`);
    console.log(`  completed_at: ${t.completed_at?.toDate().toISOString()}`);
    console.log(`  created_by_patch_completed: ${t.created_by_patch_completed}`);
    console.log('---');
  });

  // The undocumented tasks are the ones since P8.
  // P8 ended with completed 13. We target the specific 6 task IDs.
  const targetIds = [
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b10_p28_30',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b11_p31_33',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b12_p34_36',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b13_p37_39',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b14_p40_42',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b15_p43_45'
  ];
  const undocumentedTasks = completedTasks.filter(t => targetIds.includes(t.id));
  if (undocumentedTasks.length !== 6) {
    console.error('RC_X4E_IR1_BLOCKED_UNDOCUMENTED_TASKS_NOT_IDENTIFIED');
    process.exit(1);
  }

  // Part D: Verify Undocumented Tasks Safety
  console.log('\n--- Part D: Verifying Undocumented Tasks Safety ---');
  let tasksValid = true;
  undocumentedTasks.forEach(t => {
    const isAutoDetect = t.mission_id === 'AUTO_DETECT';
    const hasPE = t.page_extractions_created === 3;
    const isNative = t.extraction_method === 'native_pdf_text';

    console.log(`Verifying Task: ${t.id}`);
    console.log(`- Not AUTO_DETECT: ${!isAutoDetect}`);
    console.log(`- PE created == 3: ${hasPE}`);
    console.log(`- Method is native: ${isNative}`);

    if (isAutoDetect) {
      console.error('RC_X4E_IR1_BLOCKED_AUTODETECT_PROCESSED_UNDOCUMENTED');
      tasksValid = false;
    }
    if (!hasPE || !isNative) {
      console.error('RC_X4E_IR1_BLOCKED_UNDOCUMENTED_TASK_INVALID');
      tasksValid = false;
    }
  });

  if (!tasksValid) process.exit(1);

  // Part E: Verify Undocumented Page Records
  console.log('\n--- Part E: Verifying Undocumented Page Records ---');
  let recordsValid = true;
  const forbiddenFields = [
    'published', 'approved', 'verified', 'founder_approved', 'publish_status',
    'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
    'ai_generated', 'ocr_used'
  ];

  for (const t of undocumentedTasks) {
    for (let p = t.page_start; p <= t.page_end; p++) {
      const pePath = `mission_realms/${t.mission_id}/official_documents/${t.document_id}/page_extractions/${p}`;
      const peSnap = await db.doc(pePath).get();
      if (!peSnap.exists) {
        console.error(`Missing PE record: ${pePath}`);
        recordsValid = false;
        continue;
      }
      const data = peSnap.data();
      const textLen = data.extraction_text?.length || 0;
      const hasProof = data.source_proof?.task_id === t.id && data.source_proof?.page_number === p;
      const hasPolicy = data.page_policy?.all_pages_required === true;
      const foundForbidden = forbiddenFields.filter(f => data[f] !== undefined);

      console.log(`Page ${p} (Doc ${t.document_id}): len=${textLen}, proof=${hasProof}, policy=${hasPolicy}, forbidden=${foundForbidden.join(',') || 'NONE'}`);

      if (textLen < 100 || !hasProof || !hasPolicy || foundForbidden.length > 0 || data.extraction_status !== 'extracted_draft' || data.review_status !== 'pending_founder_verification') {
        console.error(`RC_X4E_IR1_BLOCKED_UNDOCUMENTED_RECORD_SCHEMA_INVALID at Page ${p}`);
        recordsValid = false;
      }
    }
  }
  if (!recordsValid) process.exit(1);

  // Part F: Queue Reconciliation
  console.log('\n--- Part F: Queue Reconciliation ---');
  const peGlobalSnap = await db.collectionGroup('page_extractions').get();
  const actualCounts = {
    total: allTasks.length,
    active: allTasks.filter(t => ['queued', 'pending'].includes(t.status)).length,
    completed: completedTasks.length,
    failed: allTasks.filter(t => t.status === 'failed').length,
    page_extractions: peGlobalSnap.size
  };

  console.log('Actual State:', actualCounts);
  if (actualCounts.total !== BASELINE_POST_P13.total ||
      actualCounts.active !== BASELINE_POST_P13.active ||
      actualCounts.completed !== BASELINE_POST_P13.completed ||
      actualCounts.page_extractions !== BASELINE_POST_P13.page_extractions) {
    console.error('RC_X4E_P13_BASELINE_MISMATCH');
    process.exit(1);
  }
  console.log('RC_X4E_R10_BASELINE_AFTER_P13_CONFIRMED');

  // Part G: Multi-Document Integrity
  console.log('\n--- Part G: Multi-Document Integrity ---');
  const docMap = {};
  peGlobalSnap.docs.forEach(d => {
    const data = d.data();
    const docId = data.document_id;
    if (!docMap[docId]) docMap[docId] = { mission_id: data.mission_id, pages: [] };
    docMap[docId].pages.push(data.page_number);
  });

  let integrityValid = true;
  for (const docId in docMap) {
    const d = docMap[docId];
    d.pages.sort((a, b) => a - b);
    const duplicates = d.pages.filter((p, i) => d.pages.indexOf(p) !== i);
    console.log(`Doc ${docId} (Mission ${d.mission_id}): ${d.pages.length} pages, duplicates=${duplicates.join(',') || 'NONE'}`);
    if (duplicates.length > 0) {
      console.error('RC_X4E_IR1_BLOCKED_DUPLICATE_PAGE_RECORD');
      integrityValid = false;
    }
  }
  if (!integrityValid) process.exit(1);

  // Part H: Parent Side-Effect Check
  console.log('\n--- Part H: Parent Document Side-Effect Check ---');
  const parentSideEffects = [
    'published', 'approved', 'verified', 'founder_approved', 'topic_nodes_created',
    'atom_count', 'fact_count', 'question_count', 'crucible_generated',
    'digibook_generated', 'notification_form_generated'
  ];
  let sideEffectsFound = false;
  for (const docId in docMap) {
    const parentSnap = await db.collection('mission_realms').doc(docMap[docId].mission_id).collection('official_documents').doc(docId).get();
    const parentData = parentSnap.data();
    const found = parentSideEffects.filter(f => parentData[f] !== undefined);
    console.log(`Doc ${docId} side effects: ${found.join(',') || 'NONE'}`);
    if (found.length > 0) {
      console.error(`RC_X4E_IR1_BLOCKED_PARENT_SIDE_EFFECT_DETECTED in ${docId}`);
      sideEffectsFound = true;
    }
  }
  if (sideEffectsFound) process.exit(1);

  // Part I: Audit Script Safety Fix Recommendation
  console.log('\n--- Part I: Audit Script Safety Check ---');
  const auditFiles = [
    'functions/audit_pagewise_worker_runtime_safety.js',
    'functions/audit_pagewise_candidate_selector_policy.js',
    'functions/audit_pagewise_limit3_apply_readiness.js',
    'functions/audit_pagewise_hardened_limit3_result.js',
    'functions/audit_pagewise_second_hardened_limit3_result.js',
    'functions/audit_pagewise_third_hardened_limit3_result.js',
    'functions/audit_pagewise_queue_state.js'
  ];

  auditFiles.forEach(f => {
    const fullPath = path.join(__dirname, '..', f);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('if (mismatch)') && !content.includes('process.exit(1)') && !content.includes('process.exit(0)')) {
       console.log(`RC_X4E_IR1_WARNING_NON_FATAL_BASELINE_MISMATCH in ${f}`);
    }
  });

  console.log('\nRC_X4E_IR1_UNDOCUMENTED_APPLY_SAFE_ROLL_FORWARD_READY');
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
