const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

function lower(val) {
  return String(val || '').trim().toLowerCase();
}

const activeScripts = [
  'functions/audit_pagewise_worker_runtime_safety.js',
  'functions/audit_pagewise_candidate_selector_policy.js',
  'functions/audit_pagewise_limit3_apply_readiness.js',
  'functions/audit_pagewise_hardened_limit3_result.js',
  'functions/audit_pagewise_second_hardened_limit3_result.js',
  'functions/audit_pagewise_third_hardened_limit3_result.js',
  'functions/audit_pagewise_undocumented_apply_incident.js',
  'functions/audit_pagewise_pre_p11_undocumented_incident.js',
  'functions/audit_pagewise_extraction_apply_capability.js',
  'functions/audit_pagewise_queue_state.js'
];

const forbiddenFields = [
  'published', 'approved', 'verified', 'founder_approved', 'publish_status',
  'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
  'ai_generated', 'ocr_used'
];

async function verifyPageRecord(taskId, missionId, docId, pageNum) {
  const peRef = db.collection('mission_realms').doc(missionId)
    .collection('official_documents').doc(docId)
    .collection('page_extractions').doc(String(pageNum));

  const snap = await peRef.get();
  if (!snap.exists) return { valid: false, reason: `Page ${pageNum} record does not exist.` };
  
  const pe = snap.data();
  const text = pe.extraction_text || pe.markdown_content || pe.markdownContent || '';
  if (text.length <= 100) return { valid: false, reason: `Page ${pageNum} text too short (${text.length} chars).` };
  
  const isDraft = pe.extraction_status === 'extracted_draft' || pe.status === 'extracted_draft';
  const isPending = pe.review_status === 'pending_founder_verification';
  const isNative = pe.extraction_method === 'native_pdf_text';
  const taskMatch = pe.extracted_by_task_id === taskId || pe.taskId === taskId;

  const proof = pe.source_proof || pe.sourceProof || {};
  const proofTaskMatch = proof.task_id === taskId;
  const proofPageMatch = proof.page_number === pageNum || proof.pageNumber === pageNum;

  const policy = pe.page_policy || pe.pagePolicy || {};
  const policyAllReq = policy.all_pages_required === true;
  const policyFixedLimit = policy.fixed_page_limit_allowed === false;
  const policyBatchSize = policy.batch_size_is_not_page_limit === true;

  if (!isDraft || !isPending || !isNative || !taskMatch || !proofTaskMatch || !proofPageMatch || !policyAllReq || !policyFixedLimit || !policyBatchSize) {
    return {
      valid: false,
      reason: `Schema values mismatch: draft=${isDraft}, pending=${isPending}, native=${isNative}, taskMatch=${taskMatch}, proofTask=${proofTaskMatch}, proofPage=${proofPageMatch}, policyAllReq=${policyAllReq}, policyFixedLimit=${policyFixedLimit}, policyBatch=${policyBatchSize}`
    };
  }

  // Check forbidden fields
  for (const f of forbiddenFields) {
    if (pe[f] !== undefined) return { valid: false, reason: `Forbidden field present: ${f}` };
  }

  return { valid: true, textLength: text.length };
}

async function main() {
  console.log('==============================================');
  console.log('RC-X4E-R10: POST-P12 RESULT AUDIT & STATIC GUARD');
  console.log('==============================================');

  // 1. Verify Global Queue State = 104 / 67 / 34 / 3 / 0 / 105
  console.log('\n--- Checking Global Queue Baseline (104 / 67 / 34 / 3 / 0 / 105) ---');
  const allTasksSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const allTasks = allTasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const total = allTasks.length;
  const active = allTasks.filter(t => ['queued', 'pending', 'processing', 'running'].includes(lower(t.status))).length;
  const completed = allTasks.filter(t => ['completed', 'done', 'success'].includes(lower(t.status))).length;
  const failed = allTasks.filter(t => ['failed', 'error', 'dead_letter'].includes(lower(t.status))).length;
  const processing = allTasks.filter(t => ['processing', 'running'].includes(lower(t.status))).length;

  const peGlobalSnap = await db.collectionGroup('page_extractions').get();
  const pageExtractionsCount = peGlobalSnap.size;

  console.log(`- Total tasks: ${total} (Expected: 104)`);
  console.log(`- Active tasks: ${active} (Expected: 64)`);
  console.log(`- Completed tasks: ${completed} (Expected: 37)`);
  console.log(`- Failed tasks: ${failed} (Expected: 3)`);
  console.log(`- Processing tasks: ${processing} (Expected: 0)`);
  console.log(`- Global page_extractions count: ${pageExtractionsCount} (Expected: 118)`);

  const match = total === 104 && active === 64 && completed === 37 && failed === 3 && processing === 0 && pageExtractionsCount === 118;
  if (!match) {
    console.error('RC_X4E_R13_BASELINE_MISMATCH');
    process.exit(1);
  }
  console.log('✅ Global queue baseline matches expected counts.');

  // 2. Verify P12 Page Records (pages 7-9, 85-87, 88-90)
  console.log('\n--- Verifying Authorized P12 Page Records (7-9, 85-87, 88-90) ---');
  const p12Tasks = [
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b3_p7_9', start: 7, end: 9 },
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b29_p85_87', start: 85, end: 87 },
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b30_p88_90', start: 88, end: 90 }
  ];

  let p12Valid = true;
  for (const t of p12Tasks) {
    for (let p = t.start; p <= t.end; p++) {
      const res = await verifyPageRecord(t.id, 'jee_main_2026', 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e', p);
      if (!res.valid) {
        console.error(`- Page ${p} failed schema check: ${res.reason}`);
        p12Valid = false;
      }
    }
  }
  if (!p12Valid) {
    console.error('RC_X4E_R10_BLOCKED_AUTHORIZED_P12_RECORD_INVALID');
    process.exit(1);
  }
  console.log('✅ Authorized P12 records verified successfully.');

  // 3. Verify P11 Page Records (pages 67-75)
  console.log('\n--- Verifying Authorized P11 Page Records (67-75) ---');
  const p11Tasks = [
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b23_p67_69', start: 67, end: 69 },
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b24_p70_72', start: 70, end: 72 },
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b25_p73_75', start: 73, end: 75 }
  ];

  let p11Valid = true;
  for (const t of p11Tasks) {
    for (let p = t.start; p <= t.end; p++) {
      const res = await verifyPageRecord(t.id, 'jee_main_2026', 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e', p);
      if (!res.valid) {
        console.error(`- Page ${p} failed schema check: ${res.reason}`);
        p11Valid = false;
      }
    }
  }
  if (!p11Valid) {
    console.error('RC_X4E_R10_BLOCKED_AUTHORIZED_P11_RECORD_INVALID');
    process.exit(1);
  }
  console.log('✅ Authorized P11 records verified successfully.');

  // 4. Verify pre-P11 Incident Page Records (pages 58-66)
  console.log('\n--- Verifying Pre-P11 Incident Page Records (58-66) ---');
  const preP11Tasks = [
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b20_p58_60', start: 58, end: 60 },
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b21_p61_63', start: 61, end: 63 },
    { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b22_p64_66', start: 64, end: 66 }
  ];

  let preP11Valid = true;
  for (const t of preP11Tasks) {
    for (let p = t.start; p <= t.end; p++) {
      const res = await verifyPageRecord(t.id, 'jee_main_2026', 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e', p);
      if (!res.valid) {
        console.error(`- Page ${p} failed schema check: ${res.reason}`);
        preP11Valid = false;
      }
    }
  }
  if (!preP11Valid) {
    console.error('RC_X4E_R10_BLOCKED_PRE_P11_INCIDENT_RECORD_INVALID');
    process.exit(1);
  }
  console.log('✅ Pre-P11 incident records verified successfully.');

  // 5. Verify no duplicate page records within same document
  console.log('\n--- Checking Multi-Document Integrity ---');
  const docPagesMap = new Map();
  peGlobalSnap.forEach(d => {
    const parts = d.ref.path.split('/');
    const docId = parts[3];
    const pageNum = Number(d.id);
    if (!docPagesMap.has(docId)) {
      docPagesMap.set(docId, []);
    }
    docPagesMap.get(docId).push(pageNum);
  });

  let duplicateFound = false;
  for (const [docId, pages] of docPagesMap) {
    const unique = [...new Set(pages)];
    if (pages.length !== unique.length) {
      console.error(`- Document ${docId} contains duplicate page records.`);
      duplicateFound = true;
    }
  }
  if (duplicateFound) {
    console.error('RC_X4E_R10_BLOCKED_DUPLICATE_PAGE_RECORD');
    process.exit(1);
  }
  console.log('✅ Multi-document integrity check passed.');

  // 6. Verify parent documents are clean
  console.log('\n--- Checking Parent Documents for Side-Effects ---');
  let sideEffectFound = false;
  for (const [docId] of docPagesMap) {
    const docSnap = await db.collection('mission_realms').doc('jee_main_2026')
      .collection('official_documents').doc(docId).get();
    if (!docSnap.exists) continue;

    const data = docSnap.data();
    for (const f of forbiddenFields) {
      if (data[f] !== undefined && data[f] !== false && data[f] !== 0) {
        console.error(`- Document ${docId} has side-effect field: ${f} = ${data[f]}`);
        sideEffectFound = true;
      }
    }
  }
  if (sideEffectFound) {
    console.error('RC_X4E_R10_BLOCKED_PARENT_SIDE_EFFECT_DETECTED');
    process.exit(1);
  }
  console.log('✅ Parent document side-effect check passed.');

  // 7. Verify active audit scripts contain no stale baseline signatures
  console.log('\n--- Scanning Active Audit Scripts for Stale Baseline Signatures ---');
  const staleSigs = [
    'active: 70',
    'completed: 31',
    'pageExtractions: 96',
    'EXPECTED_AFTER_P' + '11',
    'BASELINE_POST_P' + '11',
    'active: ' + '76',
    'completed: ' + '25',
    'pageExtractions: ' + '80',
    'EXPECTED_AFTER_P' + '10',
    'BASELINE_POST_P' + '10',
    'active: ' + '79',
    'completed: ' + '22',
    'pageExtractions: ' + '71',
    'active: ' + '82',
    'completed: ' + '19',
    'pageExtractions: ' + '62',
    'EXPECTED_AFTER_P' + '9',
    'BASELINE_POST_P' + '9'
  ];

  let staleFoundGlobal = false;
  for (const f of activeScripts) {
    const fullPath = path.join(__dirname, '..', f);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    const found = staleSigs.filter(sig => content.includes(sig));
    if (found.length > 0) {
      console.error(`- Stale signature found in ${f}:`);
      found.forEach(sig => console.error(`  * "${sig}"`));
      staleFoundGlobal = true;
    }
  }

  if (staleFoundGlobal) {
    console.error('\nRC_X4E_R11_STALE_BASELINE_SIGNATURE_FOUND');
    process.exit(1);
  }
  console.log('✅ No stale baseline signatures detected in active audit scripts.');

  console.log('\nRC_X4E_R13_POST_P12_RESULT_AUDIT_READY');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
