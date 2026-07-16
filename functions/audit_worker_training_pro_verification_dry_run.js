const admin = require('firebase-admin');
const policy = require('./helpers/proVerificationPolicy');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const DOCUMENT_ID = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';
const WT4_PAGES = [16, 17, 18, 19, 20, 21, 22, 23, 24];
const WT4_TASK_IDS = [
  'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b6_p16_18',
  'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b7_p19_21',
  'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b8_p22_24'
];

function fail(message, details) {
  console.error('RC_WORKER_TRAINING_5_PRO_VERIFICATION_DRY_RUN_BLOCKED');
  console.error(message);
  if (details) console.error(JSON.stringify(details, null, 2));
  process.exit(1);
}

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function assertPolicyConstants() {
  const statuses = policy.PRO_VERIFICATION_STATUSES || {};
  for (const status of ['PENDING', 'PASSED', 'FAILED', 'NEEDS_HUMAN_REVIEW', 'BLOCKED_SOURCE_MISMATCH']) {
    if (statuses[status] !== status) fail(`Missing Pro verification status: ${status}`);
  }

  const decisions = policy.PRO_VERIFICATION_DECISIONS || {};
  for (const decision of ['PASS_TO_FOUNDER_REVIEW', 'SEND_BACK_TO_WORKER', 'BLOCK_PUBLICATION', 'REQUIRE_HUMAN_REVIEW']) {
    if (decisions[decision] !== decision) fail(`Missing Pro verification decision: ${decision}`);
  }

  const categories = policy.PRO_VERIFICATION_REQUIRED_CATEGORIES || [];
  for (const category of ['syllabus', 'PYQ', 'notification', 'answer_key', 'cutoff', 'result', 'exam_rules']) {
    if (!categories.includes(category)) fail(`Mandatory category missing: ${category}`);
  }

  const permissions = policy.PRO_VERIFIER_PERMISSIONS || {};
  if (permissions.canBlock !== true) fail('Pro verifier must be allowed to block');
  if (permissions.canPublish !== false) fail('Pro verifier must not publish');
  if (permissions.founderFinalApprovalRequired !== true) fail('Founder final approval must be required');

  const schemaFields = policy.PRO_VERIFICATION_OUTPUT_SCHEMA?.requiredFields || [];
  for (const field of ['verificationStatus', 'riskScore', 'issues', 'sampledPages', 'sourceAgreement', 'recommendation', 'verifiedAt', 'verifierModel', 'decision', 'founderReviewRequired']) {
    if (!schemaFields.includes(field)) fail(`Output schema field missing: ${field}`);
  }

  const risk = policy.RISK_POLICY || {};
  const expectedRisk = { LOW: [0, 20], MEDIUM: [21, 50], HIGH: [51, 80], CRITICAL: [81, 100] };
  for (const [name, [min, max]] of Object.entries(expectedRisk)) {
    if (risk[name]?.min !== min || risk[name]?.max !== max) fail(`Risk band invalid: ${name}`);
  }

  const rules = policy.PRO_VERIFICATION_TRIGGER_RULES || {};
  if (rules.officialDocumentsRequireProVerificationBeforePublish !== true) fail('Official documents must require Pro verification before publish');
  if (rules.randomSampleRequiredPerExtractionRun !== true) fail('Random sample per extraction run must be required');
  if (rules.lowConfidenceRequiresProVerification !== true) fail('Low confidence output must require Pro verification');
  if (rules.sourceMismatchBlocksPublication !== true) fail('Source mismatch must block publication');
  if (rules.proVerifierCannotWriteStudentDelivery !== true) fail('Pro verifier must not write student delivery');
}

async function collectionExists(db, name) {
  const snap = await db.collection(name).limit(1).get();
  return !snap.empty;
}

function hasSourceProof(data, page) {
  const proof = data.source_proof || data.sourceProof || {};
  return !!proof.task_id && (proof.page_number === page || proof.pageNumber === page);
}

function hasReviewLock(data) {
  return lower(data.review_status || data.reviewStatus) === 'pending_founder_verification';
}

async function verifyWt4Pages(db) {
  const docRef = db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOCUMENT_ID);
  const records = [];
  for (const page of WT4_PAGES) {
    const snap = await docRef.collection('page_extractions').doc(String(page)).get();
    if (!snap.exists) fail(`WT4 page extraction missing: ${page}`);
    const data = snap.data();
    const text = data.extraction_text || data.markdown_content || data.markdownContent || '';
    const taskId = data.extracted_by_task_id || data.taskId;
    records.push({ page, taskId, textLength: String(text).length, sourceProof: hasSourceProof(data, page), reviewLock: hasReviewLock(data) });
  }

  const blockers = records.filter(row => row.textLength <= 100 || row.sourceProof !== true || row.reviewLock !== true || !WT4_TASK_IDS.includes(row.taskId));
  if (blockers.length > 0) fail('WT4 page records are not ready for Pro verification dry-run', blockers);
  return records;
}

async function verifyNoStudentDeliveryWrites(db) {
  const shell = await db.collection('student_mission_catalog').doc(MISSION_ID).get();
  const topicNodes = await db.collection('student_mission_catalog').doc(MISSION_ID).collection('topic_nodes').limit(1).get();
  const counts = shell.exists ? shell.data().counts || {} : {};
  if (!topicNodes.empty || Number(counts.topicNodes || 0) !== 0) {
    fail('Student delivery/topic_nodes must remain untouched for WT5 dry-run', { topicNodesEmpty: topicNodes.empty, counts });
  }
}

async function main() {
  console.log('==============================================');
  console.log('RC-WORKER-TRAINING-5 PRO VERIFICATION DRY-RUN AUDIT');
  console.log('==============================================');

  assertPolicyConstants();

  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const pageExtractionsCount = (await db.collectionGroup('page_extractions').get()).size;
  if (pageExtractionsCount < WT4_PAGES.length) fail('No usable page_extractions found');

  const wt4Records = await verifyWt4Pages(db);
  await verifyNoStudentDeliveryWrites(db);

  const readiness = {
    pageExtractionsAvailable: pageExtractionsCount > 0,
    wt4PagesSourceProof: wt4Records.every(row => row.sourceProof),
    wt4PagesReviewLock: wt4Records.every(row => row.reviewLock),
    proVerificationQueueExists: await collectionExists(db, 'pro_verification_queue'),
    verificationRunsExists: await collectionExists(db, 'verification_runs'),
    founderReviewQueueExists: await collectionExists(db, 'founder_review_queue')
  };
  readiness.missingPieces = Object.entries({
    pro_verification_queue: readiness.proVerificationQueueExists,
    verification_runs: readiness.verificationRunsExists,
    founder_review_queue: readiness.founderReviewQueueExists
  }).filter(([, exists]) => !exists).map(([name]) => name);

  const dryRunQueueItem = {
    dryRun: true,
    wouldCreateQueueItems: true,
    documentId: DOCUMENT_ID,
    sourceRun: 'WT4',
    sampledPages: WT4_PAGES,
    requiredCategory: 'notification',
    reason: ['official_document', 'random_sample_per_run', 'new_extraction_batch'],
    canPublish: false,
    founderReviewRequired: true,
    firestoreWrites: false
  };

  console.log('Policy statuses:', Object.keys(policy.PRO_VERIFICATION_STATUSES).join(', '));
  console.log('Policy decisions:', Object.keys(policy.PRO_VERIFICATION_DECISIONS).join(', '));
  console.log('Mandatory categories:', policy.PRO_VERIFICATION_REQUIRED_CATEGORIES.join(', '));
  console.log('Permissions:', JSON.stringify(policy.PRO_VERIFIER_PERMISSIONS, null, 2));
  console.log('Required output schema:', policy.PRO_VERIFICATION_OUTPUT_SCHEMA.requiredFields.join(', '));
  console.log('Risk policy:', JSON.stringify(policy.RISK_POLICY, null, 2));
  console.log('Current readiness:', JSON.stringify(readiness, null, 2));
  console.log('WT4 records:', JSON.stringify(wt4Records, null, 2));
  console.log('Dry-run simulated queue item:', JSON.stringify(dryRunQueueItem, null, 2));
  console.log('Confirmations: no Firestore write, no Pro AI call, no AI/OCR, no extraction apply.');
  console.log('RC_WORKER_TRAINING_5_PRO_VERIFICATION_DRY_RUN_READY');
}

main().catch(error => {
  console.error('RC_WORKER_TRAINING_5_PRO_VERIFICATION_DRY_RUN_BLOCKED');
  console.error(error);
  process.exit(1);
});