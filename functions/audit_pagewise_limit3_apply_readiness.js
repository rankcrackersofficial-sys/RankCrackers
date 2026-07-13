const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-P4-L3 - LIMIT 3 APPLY READINESS AUDIT');
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
      failed: allTasks.filter(t => t.status === 'failed').length
  };

  console.log('Queue State:');
  console.log(`- total: ${counts.total}`);
  console.log(`- active: ${counts.active}`);
  console.log(`- completed: ${counts.completed}`);
  console.log(`- failed: ${counts.failed}`);

  const extractionsSnap = await db.collectionGroup('page_extractions').get();
  console.log(`- global page_extractions count: ${extractionsSnap.size}`);

  if (counts.completed !== 2 || extractionsSnap.size !== 10) {
      console.error('BLOCKER: Queue/Records mismatch expected baseline (C:2, PE:10)');
      process.exit(1);
  }

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
      console.error('RC_X4E_P4_L3_BLOCKED_WORKER_UNSAFE');
      process.exit(1);
  }

  console.log('\nRC_X4E_P4_L3_APPLY_READINESS_READY');
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
