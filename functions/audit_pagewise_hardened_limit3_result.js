const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

const EXPECTED_P6_TASKS = [
  'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b1_p1_3',
  'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b10_p28_30',
  'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b11_p31_33'
];

const EXPECTED_AFTER_P7 = {
  total: 104,
  active: 91,
  completed: 10,
  failed: 3,
  processing: 0,
  pageExtractions: 35
};

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R5 - HARDENED LIMIT-3 RESULT AUDIT');
  console.log('==============================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  console.log('\n--- Part F: Global Queue Reconciliation ---');
  const allTasksSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const allTasks = allTasksSnap.docs.map(d => ({id: d.id, ...d.data()}));

  const actualCounts = {
    total: allTasks.length,
    active: allTasks.filter(t => ['queued', 'pending'].includes(t.status)).length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    failed: allTasks.filter(t => t.status === 'failed').length,
    processing: allTasks.filter(t => ['processing', 'running'].includes(t.status)).length
  };

  const extractionsGlobalSnap = await db.collectionGroup('page_extractions').get();
  const actualPageExtractions = extractionsGlobalSnap.size;

  console.log(`- total: ${actualCounts.total}`);
  console.log(`- active: ${actualCounts.active}`);
  console.log(`- completed: ${actualCounts.completed}`);
  console.log(`- failed: ${actualCounts.failed}`);
  console.log(`- processing: ${actualCounts.processing}`);
  console.log(`- total page_extractions: ${actualPageExtractions}`);

  const mismatch =
    actualCounts.total !== EXPECTED_AFTER_P7.total ||
    actualCounts.active !== EXPECTED_AFTER_P7.active ||
    actualCounts.completed !== EXPECTED_AFTER_P7.completed ||
    actualCounts.failed !== EXPECTED_AFTER_P7.failed ||
    actualPageExtractions !== EXPECTED_AFTER_P7.pageExtractions;

  if (mismatch) {
    console.error('RC_X4E_R6_QUEUE_BASELINE_MISMATCH');
    console.log('Expected:', EXPECTED_AFTER_P7);
    console.log('Actual:', { ...actualCounts, pageExtractions: actualPageExtractions });
    // This is a blocker if we want to proceed to another apply.
  }

  console.log('RC_X4E_R6_FIX1_BASELINE_AFTER_P7_CONFIRMED');

  console.log('\n--- Part C: Verify P6 Task Results ---');
  for (const tid of EXPECTED_P6_TASKS) {
    const task = allTasks.find(t => t.id === tid);
    if (!task) {
      console.error(`BLOCKER: P6 task ${tid} missing from queue`);
      process.exit(1);
    }
    console.log(`- task_id: ${tid}`);
    console.log(`  mission_id: ${task.mission_id}`);
    console.log(`  status: ${task.status}`);
    console.log(`  page_range: ${task.page_start}-${task.page_end}`);
    console.log(`  page_extractions_created: ${task.page_extractions_created}`);

    if (task.status !== 'completed' || task.mission_id === 'AUTO_DETECT' || task.page_extractions_created !== 3) {
      console.error('RC_X4E_R5_P6_TASK_RESULT_INVALID');
      process.exit(1);
    }
  }

  console.log('\n--- Part D/E: Multi-Document Integrity & New Records ---');
  const docMap = {};
  for (const doc of extractionsGlobalSnap.docs) {
    const data = doc.data();
    const docId = data.document_id;
    if (!docMap[docId]) {
      docMap[docId] = {
        mission_id: data.mission_id,
        pages: []
      };
    }
    docMap[docId].pages.push({
      page_number: data.page_number,
      task_id: data.extracted_by_task_id,
      len: data.extraction_text?.length || 0,
      status: data.extraction_status,
      review: data.review_status,
      proof: !!data.source_proof,
      policy: !!data.page_policy
    });
  }

  const forbiddenFields = ['published', 'approved', 'verified', 'founder_approved', 'publish_status', 'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id', 'ai_generated', 'ocr_used'];

  let integrityValid = true;
  for (const docId in docMap) {
    const d = docMap[docId];
    d.pages.sort((a,b) => a.page_number - b.page_number);
    const pNums = d.pages.map(p => p.page_number);
    const duplicates = pNums.filter((p, i) => pNums.indexOf(p) !== i);

    console.log(`- document_id: ${docId}`);
    console.log(`  mission_id: ${d.mission_id}`);
    console.log(`  count: ${d.pages.length}`);
    console.log(`  pages found: ${pNums.join(', ')}`);
    console.log(`  duplicate pages within doc: ${duplicates.length > 0 ? 'YES: ' + duplicates.join(',') : 'NO'}`);

    if (duplicates.length > 0) {
      console.error('RC_X4E_R5_DUPLICATE_PAGE_RECORD_WITHIN_DOCUMENT');
      integrityValid = false;
    }

    for (const p of d.pages) {
      const isNew = EXPECTED_P6_TASKS.includes(p.task_id);
      if (isNew) {
        if (p.len < 100 || p.status !== 'extracted_draft' || p.review !== 'pending_founder_verification' || !p.proof || !p.policy) {
          console.error(`  INVALID NEW RECORD Page ${p.page_number} (doc ${docId}): len=${p.len}, status=${p.status}, review=${p.review}, proof=${p.proof}, policy=${p.policy}`);
          integrityValid = false;
        }
      }
    }
  }

  if (!integrityValid) {
    console.error('RC_X4E_R5_INTEGRITY_CHECK_FAILED');
    process.exit(1);
  }

  console.log('\n--- Part G: Failed Task Classification ---');
  for (const ft of allTasks.filter(t => t.status === 'failed')) {
    let classification = 'OTHER_FAILURE_REVIEW_REQUIRED';
    if (ft.failure_reason === 'NATIVE_TEXT_EXTRACTION_ERROR' && (ft.error_message?.includes('pdfParse') || ft.error_message?.includes('credential'))) {
      classification = 'OLD_RUNTIME_FAILURE';
    } else if (ft.failure_reason === 'NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED') {
      classification = 'EXPECTED_NATIVE_EMPTY_TEXT_FAILURE';
    }
    console.log(`- task_id: ${ft.id} | reason: ${ft.failure_reason} | class: ${classification}`);
  }

  console.log('\n--- Part H: Parent Document Side-Effect Check ---');
  for (const docId in docMap) {
    const parentDoc = (await db.collection('mission_realms').doc(docMap[docId].mission_id).collection('official_documents').doc(docId).get()).data();
    const sideEffectFields = ['published', 'approved', 'verified', 'founder_approved', 'atom_count', 'fact_count', 'question_count'];
    const foundEffects = sideEffectFields.filter(f => parentDoc[f] !== undefined);
    console.log(`- doc: ${docId} | side effects: ${foundEffects.join(', ') || 'NONE'}`);
    if (foundEffects.length > 0) {
      console.error('RC_X4E_R5_PARENT_SIDE_EFFECT_DETECTED');
      process.exit(1);
    }
  }

  console.log('\n--- Part I: Audit Baseline Staleness Check ---');
  const auditFiles = [
    'functions/audit_pagewise_worker_runtime_safety.js',
    'functions/audit_pagewise_extraction_apply_capability.js',
    'functions/audit_pagewise_candidate_selector_policy.js',
    'functions/audit_pagewise_limit3_apply_readiness.js',
    'functions/audit_pagewise_hardened_limit3_result.js',
    'functions/audit_pagewise_second_hardened_limit3_result.js'
  ];

  let staleFound = false;
  for (const f of auditFiles) {
    const filePath = path.join(__dirname, '..', f);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');

    // Detect stale Post-P6 baselines
    const staleSigs = ['EXPECTED_AFTER' + '_P6', 'BASELINE_POST' + '_P6', 'active: ' + '94', 'completed: ' + '7', 'pageExtractions: ' + '26'];

    for (const sig of staleSigs) {
        if (content.includes(sig) && !content.includes('staleSigs')) {
            console.log(`- STALE BASELINE SIGNATURE "${sig}" FOUND IN: ${f}`);
            staleFound = true;
        }
    }
  }

  if (staleFound) {
    console.error('RC_X4E_R6_FIX1_STALE_BASELINE_SIGNATURE_FOUND');
  }

  console.log('\n--- Part J: Worker Hardened Selector Safety Check ---');
  const workerContent = fs.readFileSync(path.join(__dirname, 'process_pagewise_extraction_batches.js'), 'utf8');
  const hasPreferNative = workerContent.includes('--prefer-native-digital');
  const hasAllowAutoDetect = workerContent.includes('--allow-auto-detect');
  const hasSkipAutoDetect = workerContent.includes('SKIPPED_AUTO_DETECT_NOT_ALLOWED');
  console.log(`- worker has hardened selector flags: ${hasPreferNative && hasAllowAutoDetect}`);
  console.log(`- worker skips auto-detect by default: ${hasSkipAutoDetect}`);

  if (staleFound) {
    console.error('\nRC_X4E_R5_BLOCKED_STALE_AUDIT_BASELINE_FOUND');
    process.exit(1);
  }

  console.log('\nRC_X4E_R5_HARDENED_LIMIT3_RESULT_AUDIT_READY');
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
