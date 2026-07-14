const admin = require('firebase-admin');
const policy = require('./helpers/workerTrainingPolicy');

const PROJECT_ID = 'rankcrackers-55';
const ACTIVE_STATUSES = ['queued', 'pending'];
const PROCESSING_STATUSES = ['processing', 'running'];
const COMPLETED_STATUSES = ['completed', 'done', 'success'];
const FAILED_STATUSES = ['failed', 'error', 'dead_letter'];

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function first(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
}

function statusGroup(status) {
  const normalized = lower(status);
  if (ACTIVE_STATUSES.includes(normalized)) return 'active';
  if (PROCESSING_STATUSES.includes(normalized)) return 'processing';
  if (COMPLETED_STATUSES.includes(normalized)) return 'completed';
  if (FAILED_STATUSES.includes(normalized)) return 'failed';
  return 'other';
}

function assertPolicyPrerequisites() {
  const blockers = [];
  if (policy.WORKER_MODES.SAFE_AUTO !== 'SAFE_AUTO') blockers.push('SAFE_AUTO mode missing');
  if (policy.DEFAULT_WORKER_MODE === policy.WORKER_MODES.SAFE_AUTO) blockers.push('SAFE_AUTO must not be default mode');
  if (policy.BATCH_POLICY.SAFE_AUTO_INITIAL_LIMIT !== 3) blockers.push('SAFE_AUTO initial limit must be 3');
  if (policy.AUTO_DETECT_POLICY.DEFAULT_ALLOWED !== false) blockers.push('AUTO_DETECT default allowed must be false');
  if (policy.BATCH_POLICY.REQUIRE_READINESS_AUDIT !== true) blockers.push('Readiness audit must be required');
  if (policy.BATCH_POLICY.REQUIRE_POST_RUN_AUDIT !== true) blockers.push('Post-run audit must be required');
  if (policy.SAFETY_REQUIREMENTS.sourceProofRequired !== true) blockers.push('Source proof must be required');
  if (policy.SAFETY_REQUIREMENTS.reviewLockRequired !== true) blockers.push('Review lock must be required');
  if (policy.SAFETY_REQUIREMENTS.studentDeliveryBlockRequired !== true) blockers.push('Student delivery block must be required');
  if (policy.SAFETY_REQUIREMENTS.founderApprovalRequiredForPublish !== true) blockers.push('Founder approval must be required for publish');
  if (blockers.length > 0) {
    console.error('RC_WORKER_TRAINING_2_POLICY_PREREQUISITES_BLOCKED');
    blockers.forEach(blocker => console.error('- ' + blocker));
    process.exit(1);
  }
}

async function topLevelCollectionHasDocs(db, collectionName) {
  const snap = await db.collection(collectionName).limit(1).get();
  return !snap.empty;
}

async function loadOfficialDocs(db) {
  const docs = new Map();
  const missionsSnap = await db.collection('mission_realms').get();
  for (const missionDoc of missionsSnap.docs) {
    const missionId = missionDoc.id;
    const missionData = missionDoc.data();
    const subSnap = await missionDoc.ref.collection('official_documents').get();
    subSnap.forEach(doc => {
      const data = doc.data();
      const key = `${missionId}::${doc.id}`;
      docs.set(key, {
        key,
        missionId,
        documentId: doc.id,
        title: first(data.title, data.fileName, data.name, data.documentTitle, doc.id),
        documentType: first(data.documentType, data.document_type, data.type, 'unknown'),
        ref: doc.ref,
        data,
        missionName: first(missionData.name, missionData.title, missionId)
      });
    });
  }
  return docs;
}

async function pageExtractionSummary(docInfo) {
  const snap = await docInfo.ref.collection('page_extractions').get();
  const pages = [];
  let sourceProof = 0;
  let reviewLocks = 0;
  let emptyText = 0;
  let studentRisk = 0;
  snap.forEach(doc => {
    const data = doc.data();
    const page = Number(first(data.page_number, data.pageNumber, doc.id));
    pages.push(page);
    const proof = data.source_proof || data.sourceProof;
    if (proof && proof.task_id && (proof.page_number !== undefined || proof.pageNumber !== undefined)) sourceProof += 1;
    if (lower(data.review_status) === 'pending_founder_verification' || lower(data.reviewStatus) === 'pending_founder_verification') reviewLocks += 1;
    const text = String(first(data.extraction_text, data.markdown_content, data.markdownContent, '') || '');
    if (text.trim().length === 0) emptyText += 1;
    if (data.studentVisible === true || data.userPanelVisible === true || data.isUserVisible === true || lower(data.publishStatus) === 'published') studentRisk += 1;
  });
  const duplicates = pages.filter((page, index) => pages.indexOf(page) !== index);
  return {
    count: snap.size,
    sourceProof,
    reviewLocks,
    emptyText,
    studentRisk,
    duplicatePages: [...new Set(duplicates)]
  };
}

function classifyDocument({ taskStats, pe }) {
  if (taskStats.autoDetect > 0) return { status: 'BLOCKED_AUTO_DETECT_POLICY', blocker: 'AUTO_DETECT task present' };
  if (taskStats.failed > 0) return { status: 'BLOCKED_FAILED_TASKS', blocker: 'failed pagewise task present' };
  if (pe.duplicatePages.length > 0) return { status: 'BLOCKED_DUPLICATE_RISK', blocker: `duplicate pages ${pe.duplicatePages.join(',')}` };
  if (pe.count > 0 && pe.sourceProof < pe.count) return { status: 'BLOCKED_MISSING_SOURCE_PROOF', blocker: 'source proof coverage below 100%' };
  if (pe.count > 0 && pe.reviewLocks < pe.count) return { status: 'BLOCKED_MISSING_REVIEW_LOCK', blocker: 'review lock coverage below 100%' };
  if (pe.studentRisk > 0) return { status: 'BLOCKED_STUDENT_DELIVERY_RISK', blocker: 'student-visible field detected on extraction record' };
  if (taskStats.total === 0) return { status: 'INSUFFICIENT_METADATA', blocker: 'no pagewise tasks found' };
  if (pe.count !== taskStats.expectedPageExtractionsFromCompleted) return { status: 'BLOCKED_INCONSISTENT_COUNTS', blocker: `PE ${pe.count} != completed page total ${taskStats.expectedPageExtractionsFromCompleted}` };
  return { status: 'READY_FOR_SAFE_AUTO_DRY_RUN', blocker: 'none' };
}

async function duplicateRiskForTask(db, task) {
  if (!task.mission_id || !task.document_id) return true;
  const docRef = db.collection('mission_realms').doc(task.mission_id).collection('official_documents').doc(task.document_id);
  for (let page = Number(task.page_start); page <= Number(task.page_end); page += 1) {
    const snap = await docRef.collection('page_extractions').doc(String(page)).get();
    if (snap.exists) return true;
  }
  return false;
}

function candidateReason(task, duplicateRisk) {
  if (task.mission_id === 'AUTO_DETECT') return 'AUTO_DETECT blocked by policy';
  if (!task.document_id) return 'missing documentId';
  if (!Number.isFinite(Number(task.page_start)) || !Number.isFinite(Number(task.page_end)) || Number(task.page_start) < 1 || Number(task.page_end) < Number(task.page_start)) return 'invalid page range';
  if (duplicateRisk) return 'duplicate page_extractions would be created';
  return 'eligible for future SAFE_AUTO dry-run preview';
}

async function main() {
  console.log('==============================================');
  console.log('RC-WORKER-TRAINING-2 AUTONOMOUS READINESS AUDIT');
  console.log('==============================================');
  assertPolicyPrerequisites();

  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const taskSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const tasks = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const peGlobalSnap = await db.collectionGroup('page_extractions').get();
  const baseline = {
    total: tasks.length,
    active: tasks.filter(task => statusGroup(task.status) === 'active').length,
    completed: tasks.filter(task => statusGroup(task.status) === 'completed').length,
    failed: tasks.filter(task => statusGroup(task.status) === 'failed').length,
    processing: tasks.filter(task => statusGroup(task.status) === 'processing').length,
    pageExtractions: peGlobalSnap.size,
    autoDetectActive: tasks.filter(task => statusGroup(task.status) === 'active' && task.mission_id === 'AUTO_DETECT').length
  };

  const officialDocs = await loadOfficialDocs(db);
  for (const task of tasks) {
    const key = `${task.mission_id}::${task.document_id}`;
    if (!officialDocs.has(key)) {
      officialDocs.set(key, {
        key,
        missionId: task.mission_id || 'unknown',
        documentId: task.document_id || 'unknown',
        title: task.document_id || 'unknown',
        documentType: task.document_type || 'unknown',
        ref: db.collection('mission_realms').doc(task.mission_id || 'unknown').collection('official_documents').doc(task.document_id || 'unknown'),
        data: {},
        missionName: task.mission_id || 'unknown'
      });
    }
  }

  const docsWithTasks = [];
  for (const docInfo of officialDocs.values()) {
    const docTasks = tasks.filter(task => task.mission_id === docInfo.missionId && task.document_id === docInfo.documentId);
    if (docTasks.length === 0) continue;
    const pe = await pageExtractionSummary(docInfo);
    const taskStats = {
      total: docTasks.length,
      completed: docTasks.filter(task => statusGroup(task.status) === 'completed').length,
      active: docTasks.filter(task => statusGroup(task.status) === 'active').length,
      failed: docTasks.filter(task => statusGroup(task.status) === 'failed').length,
      processing: docTasks.filter(task => statusGroup(task.status) === 'processing').length,
      autoDetect: docTasks.filter(task => task.mission_id === 'AUTO_DETECT').length,
      nativeDigital: docTasks.filter(task => lower(task.extraction_method) === 'native_pdf_text' || lower(task.extractionMethod) === 'native_pdf_text').length,
      expectedPageExtractionsFromCompleted: docTasks
        .filter(task => statusGroup(task.status) === 'completed')
        .reduce((sum, task) => sum + (Number(task.page_extractions_created) || Math.max(0, Number(task.page_end) - Number(task.page_start) + 1)), 0)
    };
    const readiness = classifyDocument({ taskStats, pe });
    docsWithTasks.push({ docInfo, taskStats, pe, readiness });
  }

  const activeTasks = tasks.filter(task => statusGroup(task.status) === 'active')
    .sort((a, b) => {
      const aTime = a.created_at?.toMillis?.() || 0;
      const bTime = b.created_at?.toMillis?.() || 0;
      if (aTime !== bTime) return aTime - bTime;
      return a.id.localeCompare(b.id);
    });

  const candidatePreview = [];
  for (const task of activeTasks) {
    if (candidatePreview.length >= policy.BATCH_POLICY.SAFE_AUTO_INITIAL_LIMIT) break;
    const duplicateRisk = await duplicateRiskForTask(db, task);
    const reason = candidateReason(task, duplicateRisk);
    candidatePreview.push({
      taskId: task.id,
      documentId: task.document_id || 'unknown',
      pages: `${task.page_start || '?'}-${task.page_end || '?'}`,
      pageCount: Number(task.page_end) - Number(task.page_start) + 1,
      type: task.document_type || 'unknown',
      eligible: reason.startsWith('eligible'),
      reason
    });
  }
  baseline.safelySelectableActive = candidatePreview.filter(candidate => candidate.eligible).length;

  const proReadiness = {
    policyCategoriesAvailable: Array.isArray(policy.PRO_VERIFICATION_POLICY.mandatoryCategories) && policy.PRO_VERIFICATION_POLICY.mandatoryCategories.length >= 7,
    proVerificationQueueExists: await topLevelCollectionHasDocs(db, 'pro_verification_queue'),
    verificationRunsExists: await topLevelCollectionHasDocs(db, 'verification_runs'),
    founderReviewQueueExists: await topLevelCollectionHasDocs(db, 'founder_review_queue'),
    currentOutputsNeedingProVerification: docsWithTasks.filter(row => ['syllabus', 'PYQ', 'notification', 'answer_key', 'cutoff', 'result', 'exam_rules'].includes(String(row.docInfo.documentType))).length
  };

  const missingSchemaPieces = [];
  if (!proReadiness.proVerificationQueueExists) missingSchemaPieces.push('pro_verification_queue');
  if (!proReadiness.verificationRunsExists) missingSchemaPieces.push('verification_runs');
  if (!proReadiness.founderReviewQueueExists) missingSchemaPieces.push('founder_review_queue');

  console.log('\nPolicy prerequisites: PASS');
  console.log(`- default mode: ${policy.DEFAULT_WORKER_MODE}`);
  console.log('- SAFE_AUTO enabled: NO');
  console.log(`- SAFE_AUTO initial limit: ${policy.BATCH_POLICY.SAFE_AUTO_INITIAL_LIMIT}`);
  console.log(`- AUTO_DETECT default allowed: ${policy.AUTO_DETECT_POLICY.DEFAULT_ALLOWED}`);

  console.log('\nCurrent queue baseline:', JSON.stringify(baseline, null, 2));

  console.log('\nDocument readiness summary:');
  docsWithTasks.forEach(row => {
    console.log(`- ${row.docInfo.documentId} | type=${row.docInfo.documentType} | mission=${row.docInfo.missionId} | tasks=${row.taskStats.total}/${row.taskStats.completed}/${row.taskStats.active}/${row.taskStats.failed}/${row.taskStats.processing} | PE=${row.pe.count} | status=${row.readiness.status} | blocker=${row.readiness.blocker}`);
  });

  console.log('\nCandidate preview:');
  candidatePreview.forEach(row => {
    console.log(`- ${row.taskId} | doc=${row.documentId} | pages=${row.pages} | count=${row.pageCount} | type=${row.type} | eligible=${row.eligible ? 'YES' : 'NO'} | reason=${row.reason}`);
  });

  console.log('\nPro verification readiness:', JSON.stringify({ ...proReadiness, missingSchemaPieces }, null, 2));

  if (baseline.total !== 104 || baseline.active !== 70 || baseline.completed !== 31 || baseline.failed !== 3 || baseline.processing !== 0 || baseline.pageExtractions !== 96) {
    console.error('RC_WORKER_TRAINING_2_BASELINE_MISMATCH');
    process.exit(1);
  }

  console.log('\nConfirmations: no Firestore write, no extraction apply, no AI/OCR, no SAFE_AUTO enablement.');
  console.log('RC_WORKER_TRAINING_2_AUTONOMOUS_READINESS_READY');
}

main().catch(error => {
  console.error('RC_WORKER_TRAINING_2_BLOCKED');
  console.error(error);
  process.exit(1);
});