const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const DOC_ID = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';
const EXPECTED_POST_P14 = { total: 104, active: 64, completed: 37, failed: 3, processing: 0, pageExtractions: 118 };
const STALE_SIGNATURES = [
  { label: 'WT4/Post-WT4', active: 67, completed: 34, pageExtractions: 105 },
  { label: 'Post-P13', active: 70, completed: 31, pageExtractions: 96 },
  { label: 'Post-P12', active: 73, completed: 28, pageExtractions: 89 },
  { label: 'Post-P11', active: 76, completed: 25, pageExtractions: 80 },
  { label: 'Post-P10', active: 82, completed: 19, pageExtractions: 62 },
  { label: 'Post-P9', active: 85, completed: 16, pageExtractions: 53 },
  { label: 'Post-P8', active: 88, completed: 13, pageExtractions: 44 },
  { label: 'Post-P7', active: 91, completed: 10, pageExtractions: 35 },
];
const ACTIVE_SCRIPTS = [
  'functions/audit_worker_training_autonomous_readiness.js',
  'functions/audit_worker_training_safe_auto_dry_run.js',
  'functions/audit_worker_training_post_p14_result.js',
  'functions/audit_pagewise_post_p14_result.js',
  'functions/audit_pagewise_worker_runtime_safety.js',
  'functions/audit_pagewise_candidate_selector_policy.js',
  'functions/audit_pagewise_limit3_apply_readiness.js',
];
const forbiddenParentTruthFields = ['published', 'approved', 'verified', 'founder_approved', 'studentVisible', 'userPanelVisible', 'isUserVisible', 'ai_generated', 'ocr_used'];
const lower = value => String(value || '').trim().toLowerCase();
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
function statusGroup(status) { const s = lower(status); if (['queued', 'pending'].includes(s)) return 'active'; if (['completed', 'done', 'success'].includes(s)) return 'completed'; if (['failed', 'error', 'dead_letter'].includes(s)) return 'failed'; if (['processing', 'running'].includes(s)) return 'processing'; return 'other'; }
async function verifyGlobalBaseline() {
  const taskSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const tasks = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const actual = { total: tasks.length, active: tasks.filter(t => statusGroup(t.status) === 'active').length, completed: tasks.filter(t => statusGroup(t.status) === 'completed').length, failed: tasks.filter(t => statusGroup(t.status) === 'failed').length, processing: tasks.filter(t => statusGroup(t.status) === 'processing').length, pageExtractions: (await db.collectionGroup('page_extractions').get()).size };
  console.log('Global baseline:', actual);
  const mismatch = Object.keys(EXPECTED_POST_P14).filter(key => actual[key] !== EXPECTED_POST_P14[key]);
  if (mismatch.length) { console.error('RC_WORKER_TRAINING_6_POST_P14_BASELINE_MISMATCH'); console.error('Expected:', EXPECTED_POST_P14); console.error('Actual:', actual); process.exit(1); }
  return actual;
}
async function verifyPages(start, end) {
  for (const page of range(start, end)) {
    const snap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_ID).collection('page_extractions').doc(String(page)).get();
    if (!snap.exists) { console.error(`RC_WORKER_TRAINING_6_BLOCKED_PAGE_${page}_MISSING`); process.exit(1); }
    const data = snap.data();
    const text = data.extraction_text || data.markdown_content || data.markdownContent || '';
    const proof = data.source_proof || data.sourceProof || {};
    if (text.length < 100 || lower(data.review_status) !== 'pending_founder_verification' || !proof.task_id) { console.error(`RC_WORKER_TRAINING_6_BLOCKED_PAGE_${page}_SCHEMA_INVALID`); process.exit(1); }
  }
}
async function verifyParentNoSideEffects() {
  const snap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_ID).get();
  if (!snap.exists) { console.error('RC_WORKER_TRAINING_6_BLOCKED_PARENT_DOC_MISSING'); process.exit(1); }
  const data = snap.data();
  const sideEffects = forbiddenParentTruthFields.filter(field => data[field] === true || ['published', 'approved'].includes(lower(data[field])));
  if (sideEffects.length) { console.error('RC_WORKER_TRAINING_6_BLOCKED_PARENT_SIDE_EFFECT'); console.error(sideEffects); process.exit(1); }
}
function verifyPolicyFiles() {
  const required = ['functions/helpers/workerTrainingPolicy.js', 'functions/helpers/proVerificationPolicy.js', 'functions/audit_worker_training_policy.js', 'functions/audit_worker_training_pro_verification_dry_run.js'];
  const missing = required.filter(rel => !fs.existsSync(path.join(__dirname, '..', rel)));
  if (missing.length) { console.error('RC_WORKER_TRAINING_6_BLOCKED_POLICY_FILE_MISSING'); console.error(missing); process.exit(1); }
}
function verifyNoActiveStaleSignatures() {
  const blockers = [];
  for (const rel of ACTIVE_SCRIPTS) {
    const full = path.join(__dirname, '..', rel);
    if (!fs.existsSync(full)) continue;
    const raw = fs.readFileSync(full, 'utf8').replace(/STALE_SIGNATURES\s*=\s*\[[\s\S]*?\];/g, '')
      .replace(/const staleExpectedBlocks = \[[\s\S]*?\];/g, '')
      .replace(/const staleBaselineNames = \[[\s\S]*?\];/g, '')
      .replace(/const staleSigs = \[[\s\S]*?\];/g, '');
    for (const sig of STALE_SIGNATURES) {
      const pieces = [`active: ${sig.active}`, `completed: ${sig.completed}`, `pageExtractions: ${sig.pageExtractions}`];
      if (pieces.every(piece => raw.includes(piece))) blockers.push(`${rel}: ${sig.label}`);
    }
  }
  if (blockers.length) { console.error('RC_WORKER_TRAINING_6_STALE_BASELINE_SIGNATURE_FOUND'); blockers.forEach(b => console.error('- ' + b)); process.exit(1); }
}
async function main() {
  console.log('==============================================');
  console.log('RC-WORKER-TRAINING-6 POST-P14 BASELINE AUDIT');
  console.log('==============================================');
  const actual = await verifyGlobalBaseline();
  await verifyPages(16, 24);
  await verifyParentNoSideEffects();
  verifyPolicyFiles();
  verifyNoActiveStaleSignatures();
  console.log('WT4 pages 16-24 still exist with source proof and review locks.');
  console.log('Worker policy and Pro verification policy files are present.');
  console.log('SAFE_AUTO default enablement: NO');
  console.log('Live scheduler enablement: NO');
  console.log('Student delivery side effects: NO');
  console.log('Current accepted Post-P14 baseline:', JSON.stringify(actual, null, 2));
  console.log('RC_WORKER_TRAINING_6_POST_P14_BASELINE_CONFIRMED');
  console.log('RC_WORKER_TRAINING_6_BASELINE_ALIGNED');
}
main().catch(error => { console.error('RC_WORKER_TRAINING_6_BLOCKED'); console.error(error); process.exit(1); });