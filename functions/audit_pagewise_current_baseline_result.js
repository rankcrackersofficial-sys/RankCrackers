const admin = require('firebase-admin');
const fs = require('fs');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const EXPECTED = {
  total: 104,
  active: 61,
  completed: 40,
  failed: 3,
  processing: 0,
  pageExtractions: 133,
};

if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function isActive(status) {
  return ['queued', 'pending', 'processing', 'running'].includes(lower(status));
}

function isCompleted(status) {
  return ['completed', 'done', 'success'].includes(lower(status));
}

function isFailed(status) {
  return ['failed', 'error', 'dead_letter'].includes(lower(status));
}

function hasPublishSideEffect(data) {
  const fields = [
    'published', 'approved', 'verified', 'founder_approved', 'topic_nodes_created',
    'atom_count', 'fact_count', 'question_count', 'crucible_generated',
    'digibook_generated', 'notification_form_generated',
  ];
  return fields.some((field) => data[field] === true || data[field] > 0 || String(data[field] || '').toLowerCase() === 'published');
}

async function main() {
  const taskSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .get();
  const tasks = taskSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const pageSnap = await db.collectionGroup('page_extractions').get();
  const seenPageKeys = new Set();
  let duplicatePageExtractionRecords = 0;
  let missingSourceProofCount = 0;
  let reviewLockCount = 0;
  for (const pageDoc of pageSnap.docs) {
    const data = pageDoc.data() || {};
    const key = pageDoc.ref.path;
    if (seenPageKeys.has(key)) duplicatePageExtractionRecords += 1;
    seenPageKeys.add(key);
    const proof = data.source_proof || data.sourceProof || {};
    if (!proof.task_id && !proof.taskId && !data.extracted_by_task_id && !data.taskId) missingSourceProofCount += 1;
    if (data.review_status === 'pending_founder_verification' || data.reviewStatus === 'pending_founder_verification') reviewLockCount += 1;
  }

  const officialDocs = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').get();
  let parentPublishSideEffects = 0;
  for (const doc of officialDocs.docs) {
    if (hasPublishSideEffect(doc.data() || {})) parentPublishSideEffects += 1;
  }

  const catalogRef = db.collection('student_mission_catalog').doc(MISSION_ID);
  const topicNodes = await catalogRef.collection('topic_nodes').limit(1).get();
  const studentDeliverySideEffects = topicNodes.empty ? 0 : topicNodes.size;

  const actual = {
    total: tasks.length,
    active: tasks.filter((task) => isActive(task.status)).length,
    completed: tasks.filter((task) => isCompleted(task.status)).length,
    failed: tasks.filter((task) => isFailed(task.status)).length,
    processing: tasks.filter((task) => ['processing', 'running'].includes(lower(task.status))).length,
    pageExtractions: pageSnap.size,
  };

  const mismatches = Object.keys(EXPECTED).filter((key) => actual[key] !== EXPECTED[key]);
  const sideEffectBlocked = parentPublishSideEffects !== 0 || studentDeliverySideEffects !== 0;
  const verdict = mismatches.length === 0 && !sideEffectBlocked
    ? 'CURRENT_PAGEWISE_BASELINE_PASS'
    : 'CURRENT_PAGEWISE_BASELINE_BLOCKED';

  const out = {
    phase: 'FUP-2C-BASELINE1',
    missionId: MISSION_ID,
    expected: EXPECTED,
    actual,
    mismatches,
    evidence: {
      duplicatePageExtractionRecords,
      missingSourceProofCount,
      reviewLockCount,
      parentPublishSideEffects,
      studentDeliverySideEffects,
    },
    confirmations: {
      noFirestoreWrite: true,
      noExtractionApply: true,
      noPageExtractionsWrite: true,
      noAiOrOcr: true,
      noStudentDeliveryChange: true,
    },
    verdict,
  };

  fs.mkdirSync('docs/patch_safety', { recursive: true });
  fs.writeFileSync('docs/patch_safety/FUP_2C_BASELINE1_current_pagewise_result.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  console.log(verdict);
  if (verdict !== 'CURRENT_PAGEWISE_BASELINE_PASS') process.exit(1);
}

main().catch((error) => {
  console.error('CURRENT_PAGEWISE_BASELINE_BLOCKED');
  console.error(error);
  process.exit(1);
});
