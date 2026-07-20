const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const DOC_ID = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

const EXPECTED_AFTER_P15 = {
  total: 104,
  active: 61,
  completed: 40,
  failed: 3,
  processing: 0,
  pageExtractions: 133
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
  'functions/audit_pagewise_baseline_exit_logic.js',
  'functions/audit_pagewise_post_p13_result.js'
];

const forbiddenPageFields = [
  'published', 'approved', 'verified', 'founder_approved', 'publish_status',
  'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
  'ai_generated', 'ocr_used'
];

const forbiddenParentTruthFields = [
  'published', 'approved', 'verified', 'founder_approved', 'studentVisible',
  'userPanelVisible', 'isUserVisible', 'ai_generated', 'ocr_used'
];

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function pageTasks() {
  return [
    { phase: 'R11_INCIDENT', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b6_p16_18', pages: range(16, 18) },
    { phase: 'R11_INCIDENT', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b7_p19_21', pages: range(19, 21) },
    { phase: 'R11_INCIDENT', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b8_p22_24', pages: range(22, 24) },
    { phase: 'P13', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b4_p10_12', pages: range(10, 12) },
    { phase: 'P13', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b5_p13_15', pages: range(13, 15) },
    { phase: 'P13', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b31_p91_91', pages: [91] },
    { phase: 'P12', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b3_p7_9', pages: range(7, 9) },
    { phase: 'P12', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b29_p85_87', pages: range(85, 87) },
    { phase: 'P12', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b30_p88_90', pages: range(88, 90) },
    { phase: 'P11', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b23_p67_69', pages: range(67, 69) },
    { phase: 'P11', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b24_p70_72', pages: range(70, 72) },
    { phase: 'P11', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b25_p73_75', pages: range(73, 75) },
    { phase: 'P11', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b26_p76_78', pages: range(76, 78) },
    { phase: 'P11', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b27_p79_81', pages: range(79, 81) },
    { phase: 'P11', id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b28_p82_84', pages: range(82, 84) }
  ];
}

async function verifyGlobalBaseline() {
  const taskSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .get();
  const tasks = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const actual = {
    total: tasks.length,
    active: tasks.filter(task => ['queued', 'pending'].includes(lower(task.status))).length,
    completed: tasks.filter(task => ['completed', 'done', 'success'].includes(lower(task.status))).length,
    failed: tasks.filter(task => ['failed', 'error', 'dead_letter'].includes(lower(task.status))).length,
    processing: tasks.filter(task => ['processing', 'running'].includes(lower(task.status))).length,
    pageExtractions: (await db.collectionGroup('page_extractions').get()).size
  };

  console.log('Global baseline:', actual);
  const mismatch = Object.keys(EXPECTED_AFTER_P15).filter(key => actual[key] !== EXPECTED_AFTER_P15[key]);
  if (mismatch.length > 0) {
    console.error('RC_X4E_R14_BASELINE_MISMATCH');
    console.error('Expected:', EXPECTED_AFTER_P15);
    console.error('Actual:', actual);
    process.exit(1);
  }
}

async function verifyPageRecord(taskId, pageNum) {
  const ref = db.collection('mission_realms').doc(MISSION_ID)
    .collection('official_documents').doc(DOC_ID)
    .collection('page_extractions').doc(String(pageNum));
  const snap = await ref.get();
  if (!snap.exists) return { valid: false, reason: 'page ' + pageNum + ' missing' };

  const data = snap.data();
  const text = data.extraction_text || data.markdown_content || data.markdownContent || '';
  const proof = data.source_proof || data.sourceProof || {};
  const policy = data.page_policy || data.pagePolicy || {};
  const valid = text.length > 100 &&
    (data.extraction_status === 'extracted_draft' || data.status === 'extracted_draft') &&
    data.review_status === 'pending_founder_verification' &&
    data.extraction_method === 'native_pdf_text' &&
    (data.extracted_by_task_id === taskId || data.taskId === taskId) &&
    proof.task_id === taskId &&
    (proof.page_number === pageNum || proof.pageNumber === pageNum) &&
    policy.all_pages_required === true &&
    policy.fixed_page_limit_allowed === false &&
    policy.batch_size_is_not_page_limit === true;

  if (!valid) return { valid: false, reason: 'schema mismatch for page ' + pageNum };

  const forbidden = forbiddenPageFields.filter(field => data[field] !== undefined);
  if (forbidden.length > 0) return { valid: false, reason: 'forbidden fields on page ' + pageNum + ': ' + forbidden.join(', ') };

  return { valid: true };
}

async function verifyPageGroups() {
  const seen = new Set();
  for (const task of pageTasks()) {
    for (const page of task.pages) {
      if (seen.has(page)) {
        console.error('RC_X4E_R11_BLOCKED_DUPLICATE_EXPECTED_PAGE');
        process.exit(1);
      }
      seen.add(page);
      const result = await verifyPageRecord(task.id, page);
      if (!result.valid) {
        console.error('RC_X4E_R11_BLOCKED_' + task.phase + '_PAGE_RECORD_INVALID');
        console.error(result.reason);
        process.exit(1);
      }
    }
  }
  console.log('P13, P12, and P11 page records verified.');
}

async function verifyNoDuplicatePageRecords() {
  const snap = await db.collection('mission_realms').doc(MISSION_ID)
    .collection('official_documents').doc(DOC_ID)
    .collection('page_extractions')
    .get();
  const pages = snap.docs.map(doc => Number(doc.id || doc.data().page_number || doc.data().pageNumber));
  const duplicatePages = pages.filter((page, index) => pages.indexOf(page) !== index);
  if (duplicatePages.length > 0) {
    console.error('RC_X4E_R11_BLOCKED_DUPLICATE_PAGE_RECORD');
    console.error([...new Set(duplicatePages)]);
    process.exit(1);
  }
  console.log('No duplicate page records in official document.');
}

async function verifyParentDocumentNoSideEffects() {
  const snap = await db.collection('mission_realms').doc(MISSION_ID)
    .collection('official_documents').doc(DOC_ID)
    .get();
  if (!snap.exists) {
    console.error('RC_X4E_P13_BLOCKED_PARENT_DOCUMENT_MISSING');
    process.exit(1);
  }
  const data = snap.data();
  const sideEffects = [];
  for (const field of forbiddenParentTruthFields) {
    const value = data[field];
    if (value === true || lower(value) === 'published' || lower(value) === 'approved') sideEffects.push(field + '=' + value);
  }
  if (sideEffects.length > 0) {
    console.error('RC_X4E_R11_BLOCKED_PARENT_SIDE_EFFECT_DETECTED');
    console.error(sideEffects.join('\n'));
    process.exit(1);
  }
  console.log('Parent official document side-effect check passed.');
}

function verifyNoActiveStaleBaselineSignatures() {
  const staleBaselineNames = [
    'EXPECTED_AFTER_P12', 'EXPECTED_AFTER_P11', 'EXPECTED_AFTER_P10', 'EXPECTED_AFTER_P9', 'EXPECTED_AFTER_P8', 'EXPECTED_AFTER_P7',
    'BASELINE_POST_P12', 'BASELINE_POST_P11', 'BASELINE_POST_P10', 'BASELINE_POST_P9', 'BASELINE_POST_P8', 'BASELINE_POST_P7'
  ];
  const staleExpectedBlocks = [
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
      .replace(/const staleBaselineNames = \[[\s\S]*?\];/g, '')
      .replace(/const staleExpectedBlocks = \[[\s\S]*?\];/g, '');
    for (const sig of staleBaselineNames) {
      if (stripped.includes(sig)) blockers.push(rel + ': ' + sig);
    }
    const expectedObjectMatches = stripped.match(/const (EXPECTED|BASELINE)[\s\S]*?\};/g) || [];
    for (const block of expectedObjectMatches) {
      for (const sig of staleExpectedBlocks) {
        if (block.includes(sig)) blockers.push(rel + ': stale expected ' + sig);
      }
    }
  }
  if (blockers.length > 0) {
    console.error('RC_X4E_R11_STALE_BASELINE_SIGNATURE_FOUND');
    blockers.forEach(item => console.error('- ' + item));
    process.exit(1);
  }
  console.log('No stale active expected-baseline signatures detected.');
}

async function main() {
  console.log('==============================================');
  console.log('RC-X4E-R11: POST-P13 RESULT AUDIT');
  console.log('==============================================');
  await verifyGlobalBaseline();
  await verifyPageGroups();
  await verifyNoDuplicatePageRecords();
  await verifyParentDocumentNoSideEffects();
  verifyNoActiveStaleBaselineSignatures();
  console.log('RC_X4E_R14_BASELINE_AFTER_P15_CONFIRMED');
  console.log('RC_X4E_R11_POST_P13_RESULT_AUDIT_READY');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

