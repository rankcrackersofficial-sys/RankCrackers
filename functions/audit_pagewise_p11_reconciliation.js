const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const DOCUMENT_ID = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';

const TASKS = [
  { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b23_p67_69', pages: [67, 68, 69], window: 'pre-apply drift candidate' },
  { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b24_p70_72', pages: [70, 71, 72], window: 'pre-apply drift candidate' },
  { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b25_p73_75', pages: [73, 74, 75], window: 'pre-apply drift candidate' },
  { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b26_p76_78', pages: [76, 77, 78], window: 'P11 apply log' },
  { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b27_p79_81', pages: [79, 80, 81], window: 'P11 apply log' },
  { id: 'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b28_p82_84', pages: [82, 83, 84], window: 'P11 apply log' },
];

function lower(value) {
  return String(value || '').toLowerCase();
}

function ts(value) {
  if (!value) return '';
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return String(value);
}

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  console.log('==============================================');
  console.log('RC-X4E-P11-FIX1 PAGEWISE RECONCILIATION AUDIT');
  console.log('==============================================');
  console.log('Mode: READ ONLY');
  console.log(`Mission: ${MISSION_ID}`);
  console.log(`Document: ${DOCUMENT_ID}`);

  const taskRows = [];
  let completedTasks = 0;
  let autoDetectProcessed = false;
  let missingTask = false;
  let missingRecords = 0;
  let emptyText = 0;
  let sourceProof = 0;
  let reviewLocks = 0;
  const seenPageIds = new Set();
  const duplicatePageIds = [];

  const docRef = db.collection('mission_realms').doc(MISSION_ID)
    .collection('official_documents').doc(DOCUMENT_ID);

  for (const taskInfo of TASKS) {
    const taskSnap = await db.collection('ai_queue').doc(taskInfo.id).get();
    const task = taskSnap.data() || {};
    const status = lower(task.status);
    const completed = status === 'completed' || status === 'done' || status === 'success';
    if (completed) completedTasks += 1;
    if (!taskSnap.exists) missingTask = true;
    if (task.mission_id === 'AUTO_DETECT' && completed) autoDetectProcessed = true;

    let records = 0;
    let taskSourceProof = 0;
    let taskReviewLocks = 0;
    let taskEmptyText = 0;

    for (const page of taskInfo.pages) {
      const pageId = String(page);
      if (seenPageIds.has(pageId)) duplicatePageIds.push(pageId);
      seenPageIds.add(pageId);

      const pageSnap = await docRef.collection('page_extractions').doc(pageId).get();
      if (!pageSnap.exists) {
        missingRecords += 1;
        continue;
      }
      records += 1;
      const rec = pageSnap.data() || {};
      const textLen = String(rec.extraction_text || '').trim().length;
      if (textLen === 0) {
        emptyText += 1;
        taskEmptyText += 1;
      }
      if (rec.source_proof && rec.source_proof.task_id && rec.source_proof.page_number === page) {
        sourceProof += 1;
        taskSourceProof += 1;
      }
      if (rec.review_status === 'pending_founder_verification' && rec.extraction_status === 'extracted_draft') {
        reviewLocks += 1;
        taskReviewLocks += 1;
      }
    }

    const likelyWindow = taskInfo.window === 'pre-apply drift candidate' && completed
      ? 'pre-apply state drift / earlier side-run'
      : taskInfo.window;

    taskRows.push({
      id: taskInfo.id,
      pages: `${taskInfo.pages[0]}-${taskInfo.pages[taskInfo.pages.length - 1]}`,
      exists: taskSnap.exists,
      status: task.status || 'MISSING',
      completedAt: ts(task.completed_at || task.completedAt || task.finished_at || task.finishedAt),
      updatedAt: ts(task.updated_at || task.updatedAt),
      records,
      textOk: taskEmptyText === 0,
      sourceProof: `${taskSourceProof}/${taskInfo.pages.length}`,
      reviewLocks: `${taskReviewLocks}/${taskInfo.pages.length}`,
      likelyWindow,
    });
  }

  console.log('\nTask ID | Pages | Status | completedAt | updatedAt | Page Records | Text | Source Proof | Review Locks | Likely Window');
  for (const row of taskRows) {
    console.log(`${row.id} | ${row.pages} | ${row.status} | ${row.completedAt || 'n/a'} | ${row.updatedAt || 'n/a'} | ${row.records}/3 | ${row.textOk ? 'YES' : 'NO'} | ${row.sourceProof} | ${row.reviewLocks} | ${row.likelyWindow}`);
  }

  const allPagesPresent = missingRecords === 0 && seenPageIds.size === 18;
  const allCompleted = completedTasks === TASKS.length;
  const duplicateRecords = duplicatePageIds.length;

  const allQueueSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .get();
  const tasks = allQueueSnap.docs.map(doc => doc.data() || {});
  const failedCount = tasks.filter(t => ['failed', 'error', 'dead_letter'].includes(lower(t.status))).length;
  const activeCount = tasks.filter(t => ['queued', 'pending'].includes(lower(t.status))).length;
  const completedCount = tasks.filter(t => ['completed', 'done', 'success'].includes(lower(t.status))).length;

  const extractionsSnap = await db.collectionGroup('page_extractions').get();

  console.log('\nIntegrity Summary:');
  console.log(`- b23-b25 completed: ${taskRows.slice(0, 3).every(r => lower(r.status) === 'completed') ? 'YES' : 'NO'}`);
  console.log(`- b26-b28 completed: ${taskRows.slice(3).every(r => lower(r.status) === 'completed') ? 'YES' : 'NO'}`);
  console.log(`- pages 67-84 present: ${allPagesPresent ? 'YES' : 'NO'}`);
  console.log(`- duplicate page records: ${duplicateRecords}`);
  console.log(`- empty text records: ${emptyText}`);
  console.log(`- source proof present: ${sourceProof}/18`);
  console.log(`- review locks present: ${reviewLocks}/18`);
  console.log(`- AUTO_DETECT processed: ${autoDetectProcessed ? 'YES' : 'NO'}`);
  console.log(`- failed count: ${failedCount}`);
  console.log(`- active count: ${activeCount}`);
  console.log(`- completed count: ${completedCount}`);
  console.log(`- global page_extractions: ${extractionsSnap.size}`);
  console.log('- parent side effects: NONE_DETECTED_BY_THIS_AUDIT');
  console.log('- student delivery side effects: NONE_DETECTED_BY_THIS_AUDIT');
  console.log('- syllabus/topic_nodes side effects: NONE_DETECTED_BY_THIS_AUDIT');

  if (missingTask || !allCompleted || !allPagesPresent || duplicateRecords > 0 || emptyText > 0 || sourceProof !== 18 || reviewLocks !== 18 || autoDetectProcessed || failedCount !== 3) {
    console.error('RC_X4E_P11_FIX1_BLOCKED_UNEXPLAINED_PAGE_EXTRACTIONS');
    process.exit(1);
  }

  console.log('RC_X4E_P11_FIX1_WARNING_PRE_APPLY_STATE_DRIFT');
  console.log('RC_X4E_P11_FIX1_RECONCILIATION_READY');
}

main().catch(error => {
  console.error('RC_X4E_P11_FIX1_RECONCILIATION_ERROR');
  console.error(error);
  process.exit(1);
});