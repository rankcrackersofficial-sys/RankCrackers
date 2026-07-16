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

function verifyPolicy() {
  const blockers = [];
  if (policy.WORKER_MODES.SAFE_AUTO !== 'SAFE_AUTO') blockers.push('SAFE_AUTO mode missing');
  if (policy.DEFAULT_WORKER_MODE !== policy.WORKER_MODES.MANUAL_DEBUG) blockers.push('DEFAULT_WORKER_MODE must remain MANUAL_DEBUG');
  if (policy.DEFAULT_WORKER_MODE === policy.WORKER_MODES.SAFE_AUTO) blockers.push('SAFE_AUTO must not be enabled as default');
  if (policy.BATCH_POLICY.SAFE_AUTO_INITIAL_LIMIT !== 3) blockers.push('SAFE_AUTO initial limit must be 3');
  if (policy.AUTO_DETECT_POLICY.DEFAULT_ALLOWED !== false) blockers.push('AUTO_DETECT default allowed must be false');
  if (policy.BATCH_POLICY.REQUIRE_READINESS_AUDIT !== true) blockers.push('Readiness audit must be required');
  if (policy.BATCH_POLICY.REQUIRE_POST_RUN_AUDIT !== true) blockers.push('Post-run audit must be required');
  if (policy.SAFETY_REQUIREMENTS.sourceProofRequired !== true) blockers.push('Source proof must be required');
  if (policy.SAFETY_REQUIREMENTS.reviewLockRequired !== true) blockers.push('Review lock must be required');
  if (policy.SAFETY_REQUIREMENTS.studentDeliveryBlockRequired !== true) blockers.push('Student delivery block must be required');
  if (policy.SAFETY_REQUIREMENTS.founderApprovalRequiredForPublish !== true) blockers.push('Founder approval must be required for publish');
  if (blockers.length > 0) {
    console.error('RC_WORKER_TRAINING_3_POLICY_BLOCKED');
    blockers.forEach(blocker => console.error('- ' + blocker));
    process.exit(1);
  }
}

async function loadDocument(db, task) {
  if (!task.mission_id || !task.document_id) return null;
  const ref = db.collection('mission_realms').doc(task.mission_id).collection('official_documents').doc(task.document_id);
  const snap = await ref.get();
  if (!snap.exists) return { ref, exists: false, data: {}, missionId: task.mission_id, documentId: task.document_id };
  const data = snap.data();
  return {
    ref,
    exists: true,
    data,
    missionId: task.mission_id,
    documentId: task.document_id,
    title: first(data.title, data.fileName, data.name, task.document_id),
    type: first(data.documentType, data.document_type, task.document_type, 'unknown')
  };
}

async function duplicateRisk(db, task) {
  if (!task.mission_id || !task.document_id) return true;
  const start = Number(task.page_start);
  const end = Number(task.page_end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) return true;
  const docRef = db.collection('mission_realms').doc(task.mission_id).collection('official_documents').doc(task.document_id);
  for (let page = start; page <= end; page += 1) {
    const snap = await docRef.collection('page_extractions').doc(String(page)).get();
    if (snap.exists) return true;
  }
  return false;
}

async function studentDeliveryRisk(doc) {
  if (!doc || !doc.data) return false;
  const data = doc.data;
  return data.studentVisible === true || data.userPanelVisible === true || data.isUserVisible === true || lower(data.publishStatus) === 'published';
}

function validPageRange(task) {
  const start = Number(task.page_start);
  const end = Number(task.page_end);
  return Number.isFinite(start) && Number.isFinite(end) && start >= 1 && end >= start;
}

function pageCount(task) {
  if (!validPageRange(task)) return 0;
  return Number(task.page_end) - Number(task.page_start) + 1;
}

function taskSort(a, b) {
  const aTime = a.created_at?.toMillis?.() || 0;
  const bTime = b.created_at?.toMillis?.() || 0;
  if (aTime !== bTime) return aTime - bTime;
  return a.id.localeCompare(b.id);
}

async function evaluateTask(db, task, documentTaskStats) {
  const blockers = [];
  const warnings = [];
  const doc = await loadDocument(db, task);
  const group = statusGroup(task.status);
  const docKey = `${task.mission_id}::${task.document_id}`;
  const stats = documentTaskStats.get(docKey) || { completed: 0, active: 0, failed: 0, processing: 0, total: 0 };

  if (group !== 'active') blockers.push('task is not active');
  if (task.mission_id === 'AUTO_DETECT') blockers.push('AUTO_DETECT blocked by policy');
  if (!task.document_id) blockers.push('missing documentId');
  if (!validPageRange(task)) blockers.push('invalid page range');
  if (group === 'failed') blockers.push('task failed');
  if (group === 'processing') blockers.push('task processing');
  if (group === 'completed') blockers.push('task already completed');
  if (stats.processing > 0) blockers.push('document has processing tasks');
  if (stats.failed > 0) blockers.push('document has failed tasks');
  if (doc && doc.exists === false) warnings.push('official document metadata missing');
  if (await duplicateRisk(db, task)) blockers.push('duplicate page extraction risk');
  if (await studentDeliveryRisk(doc)) blockers.push('student delivery side-effect risk');

  const continuationBonus = stats.completed > 0 && stats.active > 0;
  return {
    task,
    doc,
    stats,
    eligible: blockers.length === 0,
    blockers,
    warnings,
    continuationBonus,
    pageCount: pageCount(task),
    reason: blockers.length === 0 ? 'eligible SAFE_AUTO dry-run candidate' : blockers.join('; ')
  };
}

function scoreDocumentGroup(evaluations) {
  const firstEval = evaluations[0];
  const eligible = evaluations.filter(item => item.eligible);
  const stats = firstEval?.stats || { completed: 0, active: 0, failed: 0, processing: 0, total: 0 };
  let score = 0;
  if (stats.failed > 0) score += 40;
  if (stats.processing > 0) score += 30;
  if (firstEval?.task?.mission_id === 'AUTO_DETECT') score += 100;
  if (eligible.length === 0) score += 25;
  if (stats.completed > 0 && stats.active > 0) score -= 20;
  score += Math.min(20, Math.max(0, stats.active - 6));
  return score;
}

function riskLevel(score, blockers) {
  if (blockers.length > 0 || score >= 90) return 'BLOCKED';
  if (score >= 60) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

async function main() {
  console.log('==============================================');
  console.log('RC-WORKER-TRAINING-3 SAFE_AUTO DRY-RUN SCHEDULER');
  console.log('==============================================');
  verifyPolicy();

  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const taskSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const tasks = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const peCount = (await db.collectionGroup('page_extractions').get()).size;
  const baseline = {
    total: tasks.length,
    active: tasks.filter(task => statusGroup(task.status) === 'active').length,
    completed: tasks.filter(task => statusGroup(task.status) === 'completed').length,
    failed: tasks.filter(task => statusGroup(task.status) === 'failed').length,
    processing: tasks.filter(task => statusGroup(task.status) === 'processing').length,
    pageExtractions: peCount
  };

  if (baseline.total !== 104 || baseline.active !== 67 || baseline.completed !== 34 || baseline.failed !== 3 || baseline.processing !== 0 || baseline.pageExtractions !== 105) {
    console.error('RC_WORKER_TRAINING_3_BASELINE_MISMATCH');
    console.error(JSON.stringify(baseline, null, 2));
    process.exit(1);
  }

  const documentTaskStats = new Map();
  for (const task of tasks) {
    const key = `${task.mission_id}::${task.document_id}`;
    if (!documentTaskStats.has(key)) documentTaskStats.set(key, { total: 0, completed: 0, active: 0, failed: 0, processing: 0 });
    const stats = documentTaskStats.get(key);
    stats.total += 1;
    stats[statusGroup(task.status)] = (stats[statusGroup(task.status)] || 0) + 1;
  }

  const activeTasks = tasks.filter(task => statusGroup(task.status) === 'active').sort(taskSort);
  const evaluations = [];
  for (const task of activeTasks) {
    evaluations.push(await evaluateTask(db, task, documentTaskStats));
  }

  const byDocument = new Map();
  for (const evaluation of evaluations) {
    const key = `${evaluation.task.mission_id}::${evaluation.task.document_id}`;
    if (!byDocument.has(key)) byDocument.set(key, []);
    byDocument.get(key).push(evaluation);
  }

  const rankedDocuments = [...byDocument.entries()].map(([key, items]) => ({
    key,
    items,
    score: scoreDocumentGroup(items),
    eligibleCount: items.filter(item => item.eligible).length,
    continuation: items.some(item => item.continuationBonus)
  })).filter(group => group.eligibleCount > 0).sort((a, b) => {
    if (a.continuation !== b.continuation) return a.continuation ? -1 : 1;
    if (a.score !== b.score) return a.score - b.score;
    return a.key.localeCompare(b.key);
  });

  if (rankedDocuments.length === 0) {
    console.error('RC_WORKER_TRAINING_3_NO_SAFE_CANDIDATE');
    process.exit(1);
  }

  const selectedGroup = rankedDocuments[0];
  const selected = selectedGroup.items.filter(item => item.eligible).slice(0, policy.BATCH_POLICY.SAFE_AUTO_INITIAL_LIMIT);
  const selectedDoc = selected[0].doc || { documentId: selected[0].task.document_id, missionId: selected[0].task.mission_id, type: selected[0].task.document_type };
  const selectedBlockers = selected.flatMap(item => item.blockers);
  const selectedWarnings = selected.flatMap(item => item.warnings);
  if (selected.some(item => item.task.mission_id === 'AUTO_DETECT')) {
    console.error('RC_WORKER_TRAINING_3_BLOCKED_AUTO_DETECT_SELECTED');
    process.exit(1);
  }
  if (selected.length > policy.BATCH_POLICY.SAFE_AUTO_INITIAL_LIMIT) {
    console.error('RC_WORKER_TRAINING_3_BLOCKED_LIMIT_EXCEEDED');
    process.exit(1);
  }

  const riskScore = Math.max(0, Math.min(100, scoreDocumentGroup(selected) + selectedBlockers.length * 25 + selectedWarnings.length * 5));
  const runPlan = {
    mode: 'SAFE_AUTO_DRY_RUN',
    wouldProcess: selected.length > 0,
    batchLimit: policy.BATCH_POLICY.SAFE_AUTO_INITIAL_LIMIT,
    selectedDocumentId: selectedDoc.documentId || selected[0].task.document_id,
    selectedTasks: selected.map(item => item.task.id),
    expectedNewPageRecords: selected.reduce((sum, item) => sum + item.pageCount, 0),
    autoDetectIncluded: selected.some(item => item.task.mission_id === 'AUTO_DETECT'),
    firestoreWrites: false,
    studentDeliveryTouched: false,
    proVerificationRequiredAfterRun: true,
    founderReviewRequiredAfterRun: true,
    nextIfApproved: 'RC-WORKER-TRAINING-4 SAFE_AUTO controlled apply'
  };

  const candidateRows = selected.map(item => ({
    taskId: item.task.id,
    documentId: item.task.document_id,
    pages: `${item.task.page_start}-${item.task.page_end}`,
    pageCount: item.pageCount,
    type: item.task.document_type || selectedDoc.type || 'unknown',
    eligible: item.eligible,
    reason: item.reason
  }));

  console.log('Policy check: PASS');
  console.log(`- default mode: ${policy.DEFAULT_WORKER_MODE}`);
  console.log('- SAFE_AUTO enabled: NO');
  console.log(`- SAFE_AUTO initial limit: ${policy.BATCH_POLICY.SAFE_AUTO_INITIAL_LIMIT}`);
  console.log(`- AUTO_DETECT default allowed: ${policy.AUTO_DETECT_POLICY.DEFAULT_ALLOWED}`);
  console.log('\nQueue baseline:', JSON.stringify(baseline, null, 2));
  console.log('\nSelected document:');
  console.log(`- documentId: ${runPlan.selectedDocumentId}`);
  console.log(`- type: ${selectedDoc.type || selected[0].task.document_type || 'unknown'}`);
  console.log(`- mission: ${selectedDoc.missionId || selected[0].task.mission_id}`);
  console.log(`- reason selected: ${selectedGroup.continuation ? 'continuation of partially completed safe document' : 'lowest-risk eligible document group'}`);
  console.log('- readiness status: READY_FOR_SAFE_AUTO_DRY_RUN');
  console.log('\nCandidate tasks:');
  candidateRows.forEach(row => console.log(`- ${row.taskId} | ${row.documentId} | ${row.pages} | ${row.pageCount} | ${row.type} | ${row.eligible ? 'YES' : 'NO'} | ${row.reason}`));
  console.log('\nDry-run plan:', JSON.stringify(runPlan, null, 2));
  console.log('\nRisk:', JSON.stringify({ riskScore, riskLevel: riskLevel(riskScore, selectedBlockers), blockers: selectedBlockers, warnings: selectedWarnings }, null, 2));
  console.log('\nConfirmations: no Firestore write, no extraction apply, no AI/OCR, no SAFE_AUTO enablement.');
  console.log('RC_WORKER_TRAINING_3_SAFE_AUTO_DRY_RUN_READY');
}

main().catch(error => {
  console.error('RC_WORKER_TRAINING_3_BLOCKED');
  console.error(error);
  process.exit(1);
});
