const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const DOC_B18D = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';
const DOC_7CAD = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
const DOC_BA8B = 'hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

const EXPECTED_AFTER_P14 = {
  total: 104,
  active: 64,
  completed: 37,
  failed: 3,
  processing: 0,
  pageExtractions: 118
};

const activeScripts = [
  'functions/audit_pagewise_worker_runtime_safety.js',
  'functions/audit_pagewise_candidate_selector_policy.js',
  'functions/audit_pagewise_limit3_apply_readiness.js',
  'functions/audit_pagewise_hardened_limit3_result.js',
  'functions/audit_pagewise_second_hardened_limit3_result.js',
  'functions/audit_pagewise_third_hardened_limit3_result.js',
  'functions/audit_pagewise_undocumented_apply_incident.js',
  'functions/audit_pagewise_pre_p11_undocumented_incident.js',
  'functions/audit_pagewise_post_p12_result.js',
  'functions/audit_pagewise_post_p13_result.js',
  'functions/audit_pagewise_post_ir3_rollforward_acceptance.js',
  'functions/audit_pagewise_post_p14_result.js',
  'functions/audit_pagewise_baseline_exit_logic.js',
  'functions/audit_pagewise_extraction_apply_capability.js',
  'functions/audit_pagewise_queue_state.js',
  'functions/audit_pagewise_worker_capability.js',
  'functions/audit_pagewise_limit3_result_and_candidate_policy.js',
  'functions/audit_first_pagewise_extraction_result.js',
  'functions/audit_first_successful_pagewise_extraction.js',
  'functions/audit_pagewise_two_batch_continuity.js'
];

const forbiddenPageFields = [
  'published', 'approved', 'verified', 'founder_approved', 'publish_status',
  'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
  'ai_generated', 'ocr_used'
];

const forbiddenParentFields = [
  'published', 'approved', 'verified', 'founder_approved',
  'topic_nodes_created', 'atom_count', 'fact_count', 'question_count',
  'crucible_generated', 'digibook_generated', 'notification_form_generated'
];

function lower(val) {
  return String(val || '').trim().toLowerCase();
}
function bool(val) {
  return val === true || lower(val) === 'true';
}

async function verifyGlobalBaseline() {
  console.log('\n--- 1. Global Baseline Verification ---');
  const taskSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .get();
  const tasks = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const peGlobalSnap = await db.collectionGroup('page_extractions').get();

  const actual = {
    total: tasks.length,
    active: tasks.filter(t => ['queued', 'pending', 'processing', 'running'].includes(lower(t.status))).length,
    completed: tasks.filter(t => ['completed', 'done', 'success'].includes(lower(t.status))).length,
    failed: tasks.filter(t => ['failed', 'error', 'dead_letter'].includes(lower(t.status))).length,
    processing: tasks.filter(t => ['processing', 'running'].includes(lower(t.status))).length,
    pageExtractions: peGlobalSnap.size
  };

  console.log('Actual counts:', actual);
  console.log('Expected counts:', EXPECTED_AFTER_P14);

  const mismatch = Object.keys(EXPECTED_AFTER_P14).filter(k => actual[k] !== EXPECTED_AFTER_P14[k]);
  if (mismatch.length > 0) {
    console.error('RC_X4E_R13_BASELINE_MISMATCH');
    process.exit(1);
  }
  console.log('RC_X4E_R13_BASELINE_AFTER_P14_CONFIRMED');
}

async function verifyP14Tasks() {
  console.log('\n--- 2. P14 Tasks Verification ---');
  const p14TaskIds = [
    { id: `rc_x4a_pagewise_jee_main_2026_${DOC_B18D}_b9_p25_27`, pages: 3 },
    { id: `rc_x4a_pagewise_jee_main_2026_${DOC_BA8B}_b1_p1_5`, pages: 5 },
    { id: `rc_x4a_pagewise_jee_main_2026_${DOC_BA8B}_b2_p6_10`, pages: 5 }
  ];

  for (const { id, pages } of p14TaskIds) {
    const docSnap = await db.collection('ai_queue').doc(id).get();
    if (!docSnap.exists) {
      console.error(`RC_X4E_R13_P14_RECORD_INVALID: Task ${id} missing`);
      process.exit(1);
    }
    const t = docSnap.data();
    console.log(`Task ${id}: status=${t.status}, page_extractions_created=${t.page_extractions_created}`);

    const isCompleted = ['completed', 'done', 'success'].includes(lower(t.status));
    const isJee = t.mission_id === MISSION_ID;
    const isNotAuto = t.mission_id !== 'AUTO_DETECT';
    const isMethod = t.extraction_method === 'native_pdf_text';
    const isPagesMatch = t.page_extractions_created === pages;
    const completedAtExists = !!(t.completed_at || t.completedAt);

    if (!isCompleted || !isJee || !isNotAuto || !isMethod || !isPagesMatch || !completedAtExists) {
      console.error(`RC_X4E_R13_P14_RECORD_INVALID: Task validation failed for ${id}`);
      process.exit(1);
    }
  }
}

async function verifyPageRecord(missionId, docId, pageNum, taskId) {
  const ref = db.collection('mission_realms').doc(missionId)
    .collection('official_documents').doc(docId)
    .collection('page_extractions').doc(String(pageNum));
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`Page ${pageNum} under doc ${docId} missing`);
    return false;
  }
  const data = snap.data();
  const text = data.extraction_text || data.markdown_content || data.markdownContent || '';
  if (text.length <= 100) {
    console.error(`Page ${pageNum} text too short: ${text.length}`);
    return false;
  }

  const isDraft = data.extraction_status === 'extracted_draft' || data.status === 'extracted_draft';
  const isPending = data.review_status === 'pending_founder_verification';
  const isNative = data.extraction_method === 'native_pdf_text';
  const taskMatch = data.extracted_by_task_id === taskId || data.taskId === taskId;

  const proof = data.source_proof || data.sourceProof || {};
  const proofTaskMatch = proof.task_id === taskId;
  const proofPageMatch = proof.page_number === pageNum || proof.pageNumber === pageNum;

  const policy = data.page_policy || data.pagePolicy || {};
  const policyAllReq = policy.all_pages_required === true;
  const policyFixedLimit = policy.fixed_page_limit_allowed === false;
  const policyBatchSize = policy.batch_size_is_not_page_limit === true;

  if (!isDraft || !isPending || !isNative || !taskMatch || !proofTaskMatch || !proofPageMatch || !policyAllReq || !policyFixedLimit || !policyBatchSize) {
    console.error(`Page metadata validation mismatch on page ${pageNum}`);
    return false;
  }

  // Check forbidden fields
  for (const f of forbiddenPageFields) {
    if (data[f] !== undefined) {
      console.error(`Forbidden field ${f} found in page ${pageNum}`);
      return false;
    }
  }
  return true;
}

async function verifyP14PageRecords() {
  console.log('\n--- 3. P14 Page Records Verification ---');
  // Main doc pages 25-27
  const mainTaskId = `rc_x4a_pagewise_jee_main_2026_${DOC_B18D}_b9_p25_27`;
  for (let p = 25; p <= 27; p++) {
    const ok = await verifyPageRecord(MISSION_ID, DOC_B18D, p, mainTaskId);
    if (!ok) {
      console.error('RC_X4E_R13_P14_RECORD_INVALID');
      process.exit(1);
    }
  }

  // PYQ doc pages 1-10
  const pyq1TaskId = `rc_x4a_pagewise_jee_main_2026_${DOC_BA8B}_b1_p1_5`;
  for (let p = 1; p <= 5; p++) {
    const ok = await verifyPageRecord(MISSION_ID, DOC_BA8B, p, pyq1TaskId);
    if (!ok) {
      console.error('RC_X4E_R13_P14_RECORD_INVALID');
      process.exit(1);
    }
  }

  const pyq2TaskId = `rc_x4a_pagewise_jee_main_2026_${DOC_BA8B}_b2_p6_10`;
  for (let p = 6; p <= 10; p++) {
    const ok = await verifyPageRecord(MISSION_ID, DOC_BA8B, p, pyq2TaskId);
    if (!ok) {
      console.error('RC_X4E_R13_P14_RECORD_INVALID');
      process.exit(1);
    }
  }
  console.log('P14 page records verified successfully.');
}

async function verifyPriorPageRanges() {
  console.log('\n--- 4. Prior Verified Ranges Verification ---');
  // R11 incident pages 16-24
  for (let p = 16; p <= 24; p++) {
    const ref = db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_B18D).collection('page_extractions').doc(String(p));
    if (!(await ref.get()).exists) {
      console.error(`RC_X4E_R13_PRIOR_RECORD_INVALID: R11 page ${p} missing`);
      process.exit(1);
    }
  }

  // P13 pages 91 and 10-15
  for (const p of [91, 10, 11, 12, 13, 14, 15]) {
    const ref = db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_B18D).collection('page_extractions').doc(String(p));
    if (!(await ref.get()).exists) {
      console.error(`RC_X4E_R13_PRIOR_RECORD_INVALID: P13 page ${p} missing`);
      process.exit(1);
    }
  }

  // P12 pages 7-9 and 85-90
  for (let p = 7; p <= 9; p++) {
    const ref = db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_B18D).collection('page_extractions').doc(String(p));
    if (!(await ref.get()).exists) {
      console.error(`RC_X4E_R13_PRIOR_RECORD_INVALID: P12 page ${p} missing`);
      process.exit(1);
    }
  }
  for (let p = 85; p <= 90; p++) {
    const ref = db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_B18D).collection('page_extractions').doc(String(p));
    if (!(await ref.get()).exists) {
      console.error(`RC_X4E_R13_PRIOR_RECORD_INVALID: P12 page ${p} missing`);
      process.exit(1);
    }
  }

  // P11/pre-P11 pages 58-84
  for (let p = 58; p <= 84; p++) {
    const ref = db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_B18D).collection('page_extractions').doc(String(p));
    if (!(await ref.get()).exists) {
      console.error(`RC_X4E_R13_PRIOR_RECORD_INVALID: P11/pre-P11 page ${p} missing`);
      process.exit(1);
    }
  }

  // Syllabus hash_7cad pages 1-17
  for (let p = 1; p <= 17; p++) {
    const ref = db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_7CAD).collection('page_extractions').doc(String(p));
    if (!(await ref.get()).exists) {
      console.error(`RC_X4E_R13_PRIOR_RECORD_INVALID: Syllabus page ${p} missing`);
      process.exit(1);
    }
  }
  console.log('Prior verified ranges are intact.');
}

async function verifyParentDocs() {
  console.log('\n--- 5. Parent Document Side-Effect Check ---');
  for (const docId of [DOC_7CAD, DOC_B18D, DOC_BA8B]) {
    const snap = await db.collection('mission_realms').doc(MISSION_ID)
      .collection('official_documents').doc(docId).get();
    if (!snap.exists) {
      console.error(`Doc ${docId} not found!`);
      process.exit(1);
    }
    const data = snap.data();
    const sideEffects = [];
    for (const field of forbiddenParentFields) {
      const val = data[field];
      if (val === true || lower(val) === 'published' || lower(val) === 'approved') {
        sideEffects.push(`${field}=${val}`);
      }
    }
    if (sideEffects.length > 0) {
      console.error(`Doc ${docId} side-effects detected: ${sideEffects.join(', ')}`);
      process.exit(1);
    }
  }
  console.log('Parent documents are clean of side effects.');
}

async function verifyMultiDocCounts() {
  console.log('\n--- 6. Multi-Document Page Counts Integrity ---');
  const expectedCounts = {
    'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905': 17,
    'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e': 91,
    'hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b': 10
  };

  for (const docId of Object.keys(expectedCounts)) {
    const peSnap = await db.collection('mission_realms').doc(MISSION_ID)
      .collection('official_documents').doc(docId)
      .collection('page_extractions').get();
    const expected = expectedCounts[docId];
    console.log(`Document ${docId.substring(0, 9)} count: ${peSnap.size} (expected ${expected})`);
    if (peSnap.size !== expected) {
      console.error(`Count mismatch for doc ${docId}: actual ${peSnap.size}, expected ${expected}`);
      process.exit(1);
    }
  }
  console.log('Multi-document page counts are correct.');
}

function verifyNoActiveStaleSignatures() {
  console.log('\n--- 7. Stale Baseline Signatures Scan ---');
  const staleBaselineNames = [
    'EXPECTED_AFTER_P12', 'EXPECTED_AFTER_P11', 'EXPECTED_AFTER_P10', 'EXPECTED_AFTER_P9', 'EXPECTED_AFTER_P8', 'EXPECTED_AFTER_P7',
    'BASELINE_POST_P12', 'BASELINE_POST_P11', 'BASELINE_POST_P10', 'BASELINE_POST_P9', 'BASELINE_POST_P8', 'BASELINE_POST_P7'
  ];
  const staleExpectedBlocks = [
    'active: 67', 'completed: 34', 'pageExtractions: 105',
    'active: 70', 'completed: 31', 'pageExtractions: 96',
    'active: 73', 'completed: 28', 'pageExtractions: 89',
    'active: 76', 'completed: 25', 'pageExtractions: 80',
    'active: 82', 'completed: 19', 'pageExtractions: 62',
    'active: 85', 'completed: 16', 'pageExtractions: 53',
    'active: 88', 'completed: 13', 'pageExtractions: 44',
    'active: 91', 'completed: 10', 'pageExtractions: 35'
  ];

  const blockers = [];
  for (const rel of activeScripts) {
    const fullPath = path.join(__dirname, '..', rel);
    if (!fs.existsSync(fullPath)) continue;
    const raw = fs.readFileSync(fullPath, 'utf8');
    const stripped = raw
      .replace(/const staleSigs = \[[\s\S]*?\];/g, '')
      .replace(/const staleExpectedBlocks = \[[\s\S]*?\];/g, '')
      .replace(/const staleBaselineNames = \[[\s\S]*?\];/g, '');

    for (const sig of staleBaselineNames) {
      if (stripped.includes(sig)) blockers.push(`${rel}: ${sig}`);
    }

    const expectedObjectMatches = stripped.match(/const (EXPECTED|BASELINE)[\s\S]*?\};/g) || [];
    for (const block of expectedObjectMatches) {
      for (const sig of staleExpectedBlocks) {
        if (block.includes(sig)) blockers.push(`${rel}: stale expected ${sig}`);
      }
    }
  }

  if (blockers.length > 0) {
    console.error('RC_X4E_R13_STALE_BASELINE_SIGNATURE_FOUND');
    blockers.forEach(item => console.error('- ' + item));
    process.exit(1);
  }
  console.log('Active scripts contain no stale baseline signatures.');
}

async function main() {
  await verifyGlobalBaseline();
  await verifyP14Tasks();
  await verifyP14PageRecords();
  await verifyPriorPageRanges();
  await verifyParentDocs();
  await verifyMultiDocCounts();
  verifyNoActiveStaleSignatures();

  console.log('\n==============================================');
  console.log('RC_X4E_R13_POST_P14_RESULT_AUDIT_READY');
  console.log('==============================================');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
