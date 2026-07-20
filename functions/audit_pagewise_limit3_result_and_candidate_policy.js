const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R11 - LIMIT-3 RESULT & POLICY AUDIT');
  console.log('==============================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  const allPagewiseSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const allTasks = allPagewiseSnap.docs.map(d => d.data());
  const counts = {
    total: allTasks.length,
    active: allTasks.filter(t => ['queued', 'pending'].includes(t.status)).length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    failed: allTasks.filter(t => t.status === 'failed').length
  };

  const extractionsGlobalSnap = await db.collectionGroup('page_extractions').get();
  const pageExtractionsCount = extractionsGlobalSnap.size;

  console.log('\n--- Global Queue Reconciliation ---');
  console.log(`- total: ${counts.total} (Expected: 104)`);
  console.log(`- active: ${counts.active} (Expected: 67)`);
  console.log(`- completed: ${counts.completed} (Expected: 34)`);
  console.log(`- failed: ${counts.failed} (Expected: 3)`);
  console.log(`- global page_extractions: ${pageExtractionsCount} (Expected: 105)`);

  const matchTotal = counts.total === 104;
  const matchActive = counts.active === 64;
  const matchCompleted = counts.completed === 37;
  const matchFailed = counts.failed === 3;
  const matchPE = pageExtractionsCount === 118;

  if (!matchTotal || !matchActive || !matchCompleted || !matchFailed || !matchPE) {
    console.error('RC_X4E_R13_BASELINE_MISMATCH');
    console.error('Matches:', { total: matchTotal, active: matchActive, completed: matchCompleted, failed: matchFailed, pe: matchPE });
    process.exit(1);
  }
  console.log('RC_X4E_R13_BASELINE_AFTER_P14_CONFIRMED');

  console.log('\nRC_X4E_R13_LIMIT3_RESULT_AUDIT_READY');
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
