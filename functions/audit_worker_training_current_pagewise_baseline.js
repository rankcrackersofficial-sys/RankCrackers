const admin = require('firebase-admin');
const fs = require('fs');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'rankcrackers-55';
const PREVIOUS = { total: 104, active: 64, completed: 37, failed: 3, processing: 0, pageExtractions: 118 };
const EXPECTED_CURRENT = { total: 104, active: 61, completed: 40, failed: 3, processing: 0, pageExtractions: 133 };

if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

async function main() {
  const taskSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .get();
  const tasks = taskSnap.docs.map((doc) => doc.data() || {});
  const pageSnap = await db.collectionGroup('page_extractions').get();

  const currentActualBaseline = {
    total: tasks.length,
    active: tasks.filter((task) => ['queued', 'pending', 'processing', 'running'].includes(lower(task.status))).length,
    completed: tasks.filter((task) => ['completed', 'done', 'success'].includes(lower(task.status))).length,
    failed: tasks.filter((task) => ['failed', 'error', 'dead_letter'].includes(lower(task.status))).length,
    processing: tasks.filter((task) => ['processing', 'running'].includes(lower(task.status))).length,
    pageExtractions: pageSnap.size,
  };

  const drift = {
    active: currentActualBaseline.active - PREVIOUS.active,
    completed: currentActualBaseline.completed - PREVIOUS.completed,
    failed: currentActualBaseline.failed - PREVIOUS.failed,
    processing: currentActualBaseline.processing - PREVIOUS.processing,
    pageExtractions: currentActualBaseline.pageExtractions - PREVIOUS.pageExtractions,
  };

  const mismatches = Object.keys(EXPECTED_CURRENT).filter((key) => currentActualBaseline[key] !== EXPECTED_CURRENT[key]);
  const expectedDrift = { active: -3, completed: 3, failed: 0, processing: 0, pageExtractions: 15 };
  const driftMismatches = Object.keys(expectedDrift).filter((key) => drift[key] !== expectedDrift[key]);
  const verdict = mismatches.length === 0 && driftMismatches.length === 0
    ? 'WORKER_CURRENT_BASELINE_PASS'
    : 'WORKER_CURRENT_BASELINE_BLOCKED';

  const out = {
    phase: 'FUP-2C-BASELINE1',
    previousAcceptedBaseline: PREVIOUS,
    expectedCurrentBaseline: EXPECTED_CURRENT,
    currentActualBaseline,
    drift,
    expectedDrift,
    mismatches,
    driftMismatches,
    qcellCausedDrift: false,
    extractionApplyInThisPhase: false,
    firestoreWritesInThisPhase: false,
    recommendation: 'Use audit:pagewise:current-baseline-result and audit:worker-training:current-pagewise-baseline for QCELL2 and later validation gates.',
    verdict,
  };

  fs.mkdirSync('docs/patch_safety', { recursive: true });
  fs.writeFileSync('docs/patch_safety/FUP_2C_BASELINE1_worker_current_baseline.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  console.log(verdict);
  if (verdict !== 'WORKER_CURRENT_BASELINE_PASS') process.exit(1);
}

main().catch((error) => {
  console.error('WORKER_CURRENT_BASELINE_BLOCKED');
  console.error(error);
  process.exit(1);
});
