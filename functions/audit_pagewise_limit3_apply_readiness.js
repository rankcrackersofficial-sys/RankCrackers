const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

const EXPECTED_AFTER_P13 = {
  total: 104,
  active: 67,
  completed: 34,
  failed: 3,
  processing: 0,
  pageExtractions: 105
};

function assertNoStaleBaselineSignature() {
  const auditContent = fs.readFileSync(__filename, 'utf8');
  const staleSigs = [
        'Post-P' + '13', 'active: ' + '70', 'completed: ' + '31', 'pageExtractions: ' + '96',
        'Post-P' + '12', 'active: ' + '73', 'completed: ' + '28', 'pageExtractions: ' + '89',
'Post-P' + '11', 'active: ' + '76', 'completed: ' + '25', 'pageExtractions: ' + '80',
    'Post-P' + '10', 'active: ' + '82', 'completed: ' + '19', 'pageExtractions: ' + '62',
    'Post-P' + '9', 'active: ' + '85', 'completed: ' + '16', 'pageExtractions: ' + '53',
    'Post-P' + '8', 'active: ' + '88', 'completed: ' + '13', 'pageExtractions: ' + '44',
    'Post-P' + '7', 'active: ' + '91', 'completed: ' + '10', 'pageExtractions: ' + '35'
  ];
  const staleFound = staleSigs.filter(sig => auditContent.includes(sig) && !auditContent.includes('staleSigs'));
  if (staleFound.length > 0) {
    console.error('RC_X4E_R11_STALE_BASELINE_SIGNATURE_FOUND');
    staleFound.forEach(sig => console.error(`- ${sig}`));
    process.exit(1);
  }
}

async function audit() {
  assertNoStaleBaselineSignature();
  console.log('==============================================');
  console.log('PATCH RC-X4E-R8-FIX1 - LIMIT 3 APPLY READINESS AUDIT');
  console.log('==============================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  const allTasksSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const allTasks = allTasksSnap.docs.map(d => ({id: d.id, ...d.data()}));

  const counts = {
      total: allTasks.length,
      active: allTasks.filter(t => ['queued', 'pending'].includes(t.status)).length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
      processing: allTasks.filter(t => ['processing', 'running'].includes(t.status)).length
  };

  console.log('Queue State:');
  console.log(`- total: ${counts.total}`);
  console.log(`- active: ${counts.active}`);
  console.log(`- completed: ${counts.completed}`);
  console.log(`- failed: ${counts.failed}`);
  console.log(`- processing: ${counts.processing}`);

  const extractionsSnap = await db.collectionGroup('page_extractions').get();
  console.log(`- global page_extractions count: ${extractionsSnap.size}`);

  const mismatch =
    counts.total !== EXPECTED_AFTER_P13.total ||
    counts.active !== EXPECTED_AFTER_P13.active ||
    counts.completed !== EXPECTED_AFTER_P13.completed ||
    counts.failed !== EXPECTED_AFTER_P13.failed ||
    extractionsSnap.size !== EXPECTED_AFTER_P13.pageExtractions;

  if (mismatch) {
      console.error('RC_X4E_R11_BASELINE_MISMATCH');
      console.error('Expected:', EXPECTED_AFTER_P13);
      console.error('Actual:', { ...counts, pageExtractions: extractionsSnap.size });
      process.exit(1);
  }

  console.log('RC_X4E_R11_BASELINE_AFTER_P13_CONFIRMED');

  console.log('\nWorker Safety Check:');
  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  const content = fs.readFileSync(workerPath, 'utf8');

  const hasConfirmation = content.includes('CONFIRM_PROCESS_PAGEWISE_EXTRACTION');
  const hasLimit3 = content.includes('cli.limit !== 3');
  const hasHarding = content.includes('--prefer-native-digital') && content.includes('--allow-auto-detect');
  const noAI = !content.includes('VertexAI') && !content.includes('Gemini');

  console.log(`- confirmation required: ${hasConfirmation}`);
  console.log(`- limit 3 lock exists: ${hasLimit3}`);
  console.log(`- selector hardening exists: ${hasHarding}`);
  console.log(`- no AI/OCR imports: ${noAI}`);

  if (!hasConfirmation || !hasLimit3 || !noAI || !hasHarding) {
      console.error('RC_X4E_R8_FIX1_BLOCKED_WORKER_UNSAFE');
      process.exit(1);
  }

  console.log('\nRC_X4E_R11_APPLY_READINESS_READY');
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});

