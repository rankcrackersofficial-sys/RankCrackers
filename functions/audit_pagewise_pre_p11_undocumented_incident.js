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

async function main() {
  console.log('==============================================');
  console.log('RC-X4E-IR2: FORENSIC INCIDENT AUDIT');
  console.log('==============================================');

  const authorizedP11Tasks = [
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b23_p67_69',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b24_p70_72',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b25_p73_75'
  ];

  // 1. Query all completed pagewise tasks
  const snap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .get();

  const allPagewiseTasks = [];
  snap.forEach(doc => allPagewiseTasks.push({ id: doc.id, ...doc.data() }));

  const completedTasks = allPagewiseTasks.filter(t => ['completed', 'done', 'success'].includes(lower(t.status)));
  
  // Sort ascending by completed_at
  completedTasks.sort((a, b) => {
    const timeA = a.completed_at ? (a.completed_at._seconds || 0) : 0;
    const timeB = b.completed_at ? (b.completed_at._seconds || 0) : 0;
    return timeA - timeB;
  });

  // ---------------------------------------------------------------------------
  // Part C â€” Identify & Verify Authorized P11 Tasks
  // ---------------------------------------------------------------------------
  console.log('\n--- Part C: Verifying Authorized P11 Tasks ---');
  let p11TasksValid = true;
  const p11TaskDataList = [];

  for (const taskId of authorizedP11Tasks) {
    const task = allPagewiseTasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`- Missing authorized task: ${taskId}`);
      p11TasksValid = false;
      continue;
    }
    p11TaskDataList.push(task);
    
    const isCompleted = ['completed', 'done', 'success'].includes(lower(task.status));
    const peCreated = task.page_extractions_created === 3;
    const isJee = task.mission_id === 'jee_main_2026';
    const isNotAutoDetect = task.mission_id !== 'AUTO_DETECT';
    const isNative = task.extraction_method === 'native_pdf_text';
    const isCorrectRange = [67, 70, 73].includes(task.page_start);

    console.log(`- Task ${task.id}: status=${task.status}, PE_created=${task.page_extractions_created}, mission=${task.mission_id}, method=${task.extraction_method}, range=${task.page_start}-${task.page_end}`);

    if (!isCompleted || !peCreated || !isJee || !isNotAutoDetect || !isNative || !isCorrectRange) {
      p11TasksValid = false;
    }
  }

  if (!p11TasksValid) {
    console.error('\nRC_X4E_IR2_BLOCKED_AUTHORIZED_P11_TASK_INVALID');
    process.exit(1);
  }
  console.log('âœ… Authorized P11 Tasks verified successfully.');

  // ---------------------------------------------------------------------------
  // Part D â€” Identify Undocumented Pre-P11 Tasks
  // ---------------------------------------------------------------------------
  console.log('\n--- Part D: Sorting last 15 completed tasks ---');
  const last15Completed = completedTasks.slice(-15);
  last15Completed.forEach(t => {
    const dateStr = t.completed_at ? new Date(t.completed_at._seconds * 1000).toISOString() : 'N/A';
    console.log(`- ${t.id} | mission=${t.mission_id} | doc=${t.document_id} | range=${t.page_start}-${t.page_end} | status=${t.status} | PE=${t.page_extractions_created} | method=${t.extraction_method} | completed_at=${dateStr} | patch_completed=${t.created_by_patch_completed || 'NONE'}`);
  });

  // Find completed tasks not in authorized P11 task list
  const nonP11Completed = completedTasks.filter(t => !authorizedP11Tasks.includes(t.id));
  
  // The undocumented tasks are expected to immediately precede the first authorized task
  // Since completedTasks is sorted ascending, we can find the index of the first authorized task
  const firstP11Index = completedTasks.findIndex(t => authorizedP11Tasks.includes(t.id));
  
  // The 3 tasks before it
  let undocumentedTasks = [];
  if (firstP11Index >= 3) {
    undocumentedTasks = completedTasks.slice(firstP11Index - 3, firstP11Index);
  } else {
    // Fallback: take the last 3 from non-P11 completed list
    undocumentedTasks = nonP11Completed.slice(-3);
  }

  console.log('\n--- Identified Undocumented Pre-P11 Tasks ---');
  undocumentedTasks.forEach(t => {
    console.log(`- ${t.id} (Range: ${t.page_start}-${t.page_end})`);
  });

  if (undocumentedTasks.length !== 3) {
    console.error('\nRC_X4E_IR2_BLOCKED_PRE_P11_UNDOCUMENTED_TASKS_NOT_IDENTIFIED');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Part E â€” Verify Undocumented Task Safety
  // ---------------------------------------------------------------------------
  console.log('\n--- Part E: Verifying Undocumented Tasks Safety ---');
  let undocumentedSafetyValid = true;

  for (const task of undocumentedTasks) {
    if (task.mission_id === 'AUTO_DETECT') {
      console.error(`- Blocked: Task ${task.id} has AUTO_DETECT mission.`);
      console.error('\nRC_X4E_IR2_BLOCKED_AUTODETECT_PROCESSED_PRE_P11_UNDOCUMENTED');
      process.exit(1);
    }
    
    // Check overlap with pages 67â€“75
    const overlaps = (task.page_start >= 67 && task.page_start <= 75) || (task.page_end >= 67 && task.page_end <= 75);
    if (overlaps) {
      console.error(`- Blocked: Task ${task.id} overlaps with P11 pages 67-75.`);
      console.error('\nRC_X4E_IR2_BLOCKED_UNDOCUMENTED_OVERLAPS_AUTHORIZED_P11');
      process.exit(1);
    }

    const isCompleted = ['completed', 'done', 'success'].includes(lower(task.status));
    const isJee = task.mission_id === 'jee_main_2026';
    const hasDocId = !!task.document_id;
    const peCreated = task.page_extractions_created === 3;
    const isNative = task.extraction_method === 'native_pdf_text';
    const hasCompletedAt = !!task.completed_at;

    if (!isCompleted || !isJee || !hasDocId || !peCreated || !isNative || !hasCompletedAt) {
      console.error(`- Task ${task.id} failed safety checks: completed=${isCompleted}, jee=${isJee}, docId=${hasDocId}, PE=${peCreated}, native=${isNative}, completedAt=${hasCompletedAt}`);
      undocumentedSafetyValid = false;
    }
  }

  if (!undocumentedSafetyValid) {
    console.error('\nRC_X4E_IR2_BLOCKED_PRE_P11_UNDOCUMENTED_TASK_INVALID');
    process.exit(1);
  }
  console.log('âœ… Undocumented tasks safety verified successfully.');

  // Helper to verify page record schema
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

  // ---------------------------------------------------------------------------
  // Part F â€” Verify Undocumented Page Records
  // ---------------------------------------------------------------------------
  console.log('\n--- Part F: Verifying Undocumented Page Records Schema ---');
  let undocumentedPagesValid = true;

  for (const task of undocumentedTasks) {
    console.log(`- Checking page records for task: ${task.id}`);
    for (let p = task.page_start; p <= task.page_end; p++) {
      const res = await verifyPageRecord(task.id, task.mission_id, task.document_id, p);
      if (!res.valid) {
        console.error(`  Page ${p} failed schema check: ${res.reason}`);
        undocumentedPagesValid = false;
      } else {
        console.log(`  Page ${p} valid (text length = ${res.textLength})`);
      }
    }
  }

  if (!undocumentedPagesValid) {
    console.error('\nRC_X4E_IR2_BLOCKED_PRE_P11_RECORD_SCHEMA_INVALID');
    process.exit(1);
  }
  console.log('âœ… Undocumented page records verified successfully.');

  // ---------------------------------------------------------------------------
  // Part G â€” Verify Authorized P11 Records Separately
  // ---------------------------------------------------------------------------
  console.log('\n--- Part G: Verifying Authorized P11 Page Records Schema ---');
  let p11PagesValid = true;

  for (const task of p11TaskDataList) {
    console.log(`- Checking page records for task: ${task.id}`);
    for (let p = task.page_start; p <= task.page_end; p++) {
      const res = await verifyPageRecord(task.id, task.mission_id, task.document_id, p);
      if (!res.valid) {
        console.error(`  Page ${p} failed schema check: ${res.reason}`);
        p11PagesValid = false;
      } else {
        console.log(`  Page ${p} valid (text length = ${res.textLength})`);
      }
    }
  }

  if (!p11PagesValid) {
    console.error('\nRC_X4E_IR2_BLOCKED_P11_RECORD_SCHEMA_INVALID');
    process.exit(1);
  }
  console.log('âœ… Authorized P11 page records verified successfully.');

  // ---------------------------------------------------------------------------
  // Part H â€” Current Queue Reconciliation
  // ---------------------------------------------------------------------------
  console.log('\n--- Part H: Current Queue Reconciliation ---');
  
  const total = allPagewiseTasks.length;
  const active = allPagewiseTasks.filter(t => ['queued', 'pending', 'processing', 'running'].includes(lower(t.status))).length;
  const completed = completedTasks.length;
  const failed = allPagewiseTasks.filter(t => ['failed', 'error', 'dead_letter'].includes(lower(t.status))).length;
  const processing = allPagewiseTasks.filter(t => ['processing', 'running'].includes(lower(t.status))).length;

  const peGlobalSnap = await db.collectionGroup('page_extractions').get();
  const pageExtractionsCount = peGlobalSnap.size;

  console.log(`- Total tasks: ${total}`);
  console.log(`- Active tasks: ${active}`);
  console.log(`- Completed tasks: ${completed}`);
  console.log(`- Failed tasks: ${failed}`);
  console.log(`- Processing tasks: ${processing}`);
  console.log(`- Global page_extractions count: ${pageExtractionsCount}`);

  const matchTotal = total === 104;
  const matchActive = active === 61;
  const matchCompleted = completed === 40;
  const matchFailed = failed === 3;
  const matchProcessing = processing === 0;
  const matchPE = pageExtractionsCount === 133;

  if (!matchTotal || !matchActive || !matchCompleted || !matchFailed || !matchProcessing || !matchPE) {
    console.error('RC_X4E_R14_BASELINE_MISMATCH');
    process.exit(1);
  }
  console.log('RC_X4E_R14_BASELINE_AFTER_P15_CONFIRMED');

  // ---------------------------------------------------------------------------
  // Part I â€” Multi-Document Integrity
  // ---------------------------------------------------------------------------
  console.log('\n--- Part I: Multi-Document Integrity Check ---');
  
  const docPagesMap = new Map(); // document_id -> { mission_id, pages: Set }

  peGlobalSnap.forEach(d => {
    const docPath = d.ref.path;
    const parts = docPath.split('/');
    // path pattern: mission_realms/{missionId}/official_documents/{documentId}/page_extractions/{pageNumber}
    const missionId = parts[1];
    const documentId = parts[3];
    const pageNum = Number(d.id);

    if (!docPagesMap.has(documentId)) {
      docPagesMap.set(documentId, { mission_id: missionId, pages: [] });
    }
    docPagesMap.get(documentId).pages.push(pageNum);
  });

  let duplicateFound = false;

  for (const [docId, meta] of docPagesMap) {
    const rawPages = meta.pages;
    const uniquePages = [...new Set(rawPages)];
    const hasDuplicates = rawPages.length !== uniquePages.length;
    
    uniquePages.sort((a, b) => a - b);
    
    // Find gaps
    const gaps = [];
    if (uniquePages.length > 0) {
      const min = uniquePages[0];
      const max = uniquePages[uniquePages.length - 1];
      for (let i = min; i <= max; i++) {
        if (!uniquePages.includes(i)) gaps.push(i);
      }
    }

    console.log(`- Document: ${docId} | Mission: ${meta.mission_id} | Count: ${rawPages.length} | Pages: [${uniquePages.join(', ')}] | Duplicate: ${hasDuplicates ? 'YES' : 'NO'} | Gaps (Info): [${gaps.join(', ')}]`);

    if (hasDuplicates) {
      duplicateFound = true;
    }
  }

  if (duplicateFound) {
    console.error('\nRC_X4E_IR2_BLOCKED_DUPLICATE_PAGE_RECORD');
    process.exit(1);
  }
  console.log('âœ… Multi-document integrity check passed.');

  // ---------------------------------------------------------------------------
  // Part J â€” Parent Side-Effect Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Part J: Parent Document Side-Effect Check ---');
  let sideEffectFound = false;

  const parentFieldsToCheck = [
    'published', 'approved', 'verified', 'founder_approved',
    'topic_nodes_created', 'atom_count', 'fact_count', 'question_count',
    'crucible_generated', 'digibook_generated', 'notification_form_generated'
  ];

  for (const [docId, meta] of docPagesMap) {
    const docRef = db.collection('mission_realms').doc(meta.mission_id)
      .collection('official_documents').doc(docId);
    
    const docSnap = await docRef.get();
    if (!docSnap.exists) continue;

    const data = docSnap.data();
    for (const f of parentFieldsToCheck) {
      if (data[f] !== undefined && data[f] !== false && data[f] !== 0) {
        console.error(`- Document ${docId} has forbidden side-effect field: ${f} = ${data[f]}`);
        sideEffectFound = true;
      }
    }
  }

  if (sideEffectFound) {
    console.error('\nRC_X4E_IR2_BLOCKED_PARENT_SIDE_EFFECT_DETECTED');
    process.exit(1);
  }
  console.log('âœ… Parent document side-effect check passed.');

  console.log('\nRC_X4E_R11_PRE_P11_UNDOCUMENTED_APPLY_SAFE_ROLL_FORWARD_READY');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

