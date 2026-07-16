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

function lower(val) {
  return String(val || '').trim().toLowerCase();
}

async function verifyPageRecord(taskId, pageNum) {
  const peRef = db.collection('mission_realms').doc(MISSION_ID)
    .collection('official_documents').doc(DOC_ID)
    .collection('page_extractions').doc(String(pageNum));

  const snap = await peRef.get();
  if (!snap.exists) return { valid: false, reason: `Page ${pageNum} record does not exist.` };

  const pe = snap.data();
  const text = pe.extraction_text || '';
  if (text.length <= 100) return { valid: false, reason: `Page ${pageNum} text too short (${text.length} chars).` };

  const isDraft = pe.extraction_status === 'extracted_draft';
  const isPending = pe.review_status === 'pending_founder_verification';
  const isNative = pe.extraction_method === 'native_pdf_text';
  const taskMatch = pe.extracted_by_task_id === taskId;

  const proof = pe.source_proof || {};
  const proofTaskMatch = proof.task_id === taskId;
  const proofPageMatch = proof.page_number === pageNum;

  const policy = pe.page_policy || {};
  const policyAllReq = policy.all_pages_required === true;
  const policyFixedLimit = policy.fixed_page_limit_allowed === false;
  const policyBatchSize = policy.batch_size_is_not_page_limit === true;

  if (!isDraft || !isPending || !isNative || !taskMatch || !proofTaskMatch || !proofPageMatch || !policyAllReq || !policyFixedLimit || !policyBatchSize) {
    return {
      valid: false,
      reason: `Schema values mismatch: draft=${isDraft}, pending=${isPending}, native=${isNative}, taskMatch=${taskMatch}, proofTask=${proofTaskMatch}, proofPage=${proofPageMatch}, policyAllReq=${policyAllReq}, policyFixedLimit=${policyFixedLimit}, policyBatch=${policyBatchSize}`
    };
  }

  const forbiddenFields = [
    'published', 'approved', 'verified', 'founder_approved', 'publish_status',
    'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
    'ai_generated', 'ocr_used'
  ];

  for (const f of forbiddenFields) {
    if (pe[f] !== undefined) return { valid: false, reason: `Forbidden field present: ${f}` };
  }

  return { valid: true };
}

async function audit() {
  console.log('==============================================');
  console.log('RC-X4E-IR3: R11 UNDOCUMENTED APPLY INCIDENT AUDIT');
  console.log('==============================================');

  // 1. All pagewise tasks
  const snap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .get();
  const allTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. Completed tasks sorted by completed_at
  const completedTasks = allTasks.filter(t => lower(t.status) === 'completed');
  completedTasks.sort((a, b) => {
    const timeA = a.completed_at?.toMillis() || 0;
    const timeB = b.completed_at?.toMillis() || 0;
    return timeB - timeA; // Descending (latest first)
  });

  console.log('\n--- Part C: Last 20 Completed Tasks ---');
  completedTasks.slice(0, 20).forEach(t => {
    console.log(`- ${t.id} | mission: ${t.mission_id} | range: ${t.page_start}-${t.page_end} | PE: ${t.page_extractions_created} | finished: ${t.completed_at?.toDate().toISOString()}`);
  });

  const p13TaskIds = [
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b31_p91_91',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b4_p10_12',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b5_p13_15'
  ];

  const suspectedR11Ids = [
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b6_p16_18',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b7_p19_21',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b8_p22_24'
  ];

  const r11Tasks = completedTasks.filter(t => suspectedR11Ids.includes(t.id));
  if (r11Tasks.length !== 3) {
    console.error('RC_X4E_IR3_BLOCKED_R11_UNDOCUMENTED_TASKS_NOT_IDENTIFIED');
    console.error('Identified:', r11Tasks.map(t => t.id));
    process.exit(1);
  }

  // 4. Verify Undocumented Task Safety
  console.log('\n--- Part D: Verifying Undocumented R11 Task Safety ---');
  for (const t of r11Tasks) {
    const isCompleted = lower(t.status) === 'completed';
    const isJee = t.mission_id === MISSION_ID;
    const peCreated = t.page_extractions_created === 3;
    const isNative = t.extraction_method === 'native_pdf_text';
    const rangeOverlap = (t.page_start >= 10 && t.page_start <= 15) || t.page_start === 91;

    console.log(`- Task ${t.id}: completed=${isCompleted}, mission=${t.mission_id}, pe_created=${t.page_extractions_created}, native=${isNative}, overlap=${rangeOverlap}`);

    if (!isCompleted || !isJee || !peCreated || !isNative || rangeOverlap) {
      if (rangeOverlap) console.error('RC_X4E_IR3_BLOCKED_OVERLAPS_AUTHORIZED_P13');
      else console.error('RC_X4E_IR3_BLOCKED_R11_TASK_INVALID');
      process.exit(1);
    }
    if (t.mission_id === 'AUTO_DETECT') {
        console.error('RC_X4E_IR3_BLOCKED_AUTODETECT_PROCESSED');
        process.exit(1);
    }
  }

  // 5. Verify R11 Incident Page Records
  console.log('\n--- Part E: Verifying R11 Incident Page Records ---');
  for (const t of r11Tasks) {
    for (let p = t.page_start; p <= t.page_end; p++) {
      const res = await verifyPageRecord(t.id, p);
      if (!res.valid) {
        console.error(`- Page ${p} invalid: ${res.reason}`);
        console.error('RC_X4E_IR3_BLOCKED_R11_RECORD_SCHEMA_INVALID');
        process.exit(1);
      }
    }
  }
  console.log('✅ R11 incident page records verified.');

  // 6. Verify Authorized P13 Records
  console.log('\n--- Part F: Verifying Authorized P13 Records ---');
  const p13Pages = [91, 10, 11, 12, 13, 14, 15];
  for (const p of p13Pages) {
    let taskId = '';
    if (p === 91) taskId = p13TaskIds[0];
    else if (p >= 10 && p <= 12) taskId = p13TaskIds[1];
    else taskId = p13TaskIds[2];

    const res = await verifyPageRecord(taskId, p);
    if (!res.valid) {
      console.error(`- P13 Page ${p} invalid: ${res.reason}`);
      console.error('RC_X4E_IR3_BLOCKED_P13_RECORD_SCHEMA_INVALID');
      process.exit(1);
    }
  }
  console.log('✅ Authorized P13 page records verified.');

  // 7. Global Reconciliation
  console.log('\n--- Part G: Global Queue Reconciliation ---');
  const peSnap = await db.collectionGroup('page_extractions').get();
  const totalPE = peSnap.size;
  const totalTasks = allTasks.length;
  const activeCount = allTasks.filter(t => ['queued', 'pending'].includes(lower(t.status))).length;
  const completedCount = completedTasks.length;
  const failedCount = allTasks.filter(t => lower(t.status) === 'failed').length;

  console.log(`- total tasks: ${totalTasks} (Expected: 104)`);
  console.log(`- active tasks: ${activeCount} (Expected: 67)`);
  console.log(`- completed tasks: ${completedCount} (Expected: 34)`);
  console.log(`- failed tasks: ${failedCount} (Expected: 3)`);
  console.log(`- total page_extractions: ${totalPE} (Expected: 105)`);

  if (totalTasks !== 104 || activeCount !== 67 || completedCount !== 34 || failedCount !== 3 || totalPE !== 105) {
    console.error('RC_X4E_IR3_BLOCKED_CURRENT_STATE_MISMATCH');
    process.exit(1);
  }

  // 8. Multi-Document Integrity
  console.log('\n--- Part H: Multi-Document Integrity ---');
  const docPagesMap = new Map();
  peSnap.forEach(d => {
    const parts = d.ref.path.split('/');
    const docId = parts[3];
    const pageNum = Number(d.id);
    if (!docPagesMap.has(docId)) docPagesMap.set(docId, []);
    docPagesMap.get(docId).push(pageNum);
  });

  for (const [docId, pages] of docPagesMap) {
    const unique = [...new Set(pages)];
    if (pages.length !== unique.length) {
      console.error(`- Document ${docId} has duplicate pages:`, pages.filter((p, i) => pages.indexOf(p) !== i));
      console.error('RC_X4E_IR3_BLOCKED_DUPLICATE_PAGE_RECORD');
      process.exit(1);
    }
    console.log(`- Document ${docId}: ${pages.length} pages, unique=YES`);
  }

  // 9. Parent Side-Effect Check
  console.log('\n--- Part I: Parent Document Side-Effect Check ---');
  const parentSideEffects = [
    'published', 'approved', 'verified', 'founder_approved', 'topic_nodes_created',
    'atom_count', 'fact_count', 'question_count', 'crucible_generated',
    'digibook_generated', 'notification_form_generated'
  ];
  for (const [docId] of docPagesMap) {
    const parentSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(docId).get();
    if (!parentSnap.exists) continue;
    const data = parentSnap.data();
    const found = parentSideEffects.filter(f => data[f] !== undefined && data[f] !== false && data[f] !== 0);
    if (found.length > 0) {
      console.error(`- Document ${docId} side effects:`, found);
      console.error('RC_X4E_IR3_BLOCKED_PARENT_SIDE_EFFECT_DETECTED');
      process.exit(1);
    }
  }
  console.log('✅ Parent side-effect check passed.');

  console.log('\nRC_X4E_IR3_R11_UNDOCUMENTED_APPLY_SAFE_ROLL_FORWARD_READY');
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
