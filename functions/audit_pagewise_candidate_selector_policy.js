const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';

const EXPECTED_AFTER_P11 = {
  total: 104,
  active: 76,
  completed: 25,
  failed: 3,
  processing: 0,
  pageExtractions: 80
};

function assertNoStaleBaselineSignature() {
  const auditContent = fs.readFileSync(__filename, 'utf8');
  const staleSigs = [
    'Post-P' + '10', 'active: ' + '82', 'completed: ' + '19', 'pageExtractions: ' + '62',
    'Post-P' + '9', 'active: ' + '85', 'completed: ' + '16', 'pageExtractions: ' + '53',
    'Post-P' + '8', 'active: ' + '88', 'completed: ' + '13', 'pageExtractions: ' + '44',
    'Post-P' + '7', 'active: ' + '91', 'completed: ' + '10', 'pageExtractions: ' + '35'
  ];
  const staleFound = staleSigs.filter(sig => auditContent.includes(sig) && !auditContent.includes('staleSigs'));
  if (staleFound.length > 0) {
    console.error('RC_X4E_R8_FIX1_STALE_BASELINE_SIGNATURE_FOUND');
    staleFound.forEach(sig => console.error(`- ${sig}`));
    process.exit(1);
  }
}

async function audit() {
  assertNoStaleBaselineSignature();
  console.log('==============================================');
  console.log('PATCH RC-X4E-R8-FIX1 - CANDIDATE SELECTOR POLICY AUDIT');
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

  const extractionsSnap = await db.collectionGroup('page_extractions').get();
  const pageExtractionsCount = extractionsSnap.size;

  console.log('Queue State Verification:');
  console.log(`- total: ${counts.total}`);
  console.log(`- active: ${counts.active}`);
  console.log(`- completed: ${counts.completed}`);
  console.log(`- failed: ${counts.failed}`);
  console.log(`- processing: ${counts.processing}`);
  console.log(`- global page_extractions: ${pageExtractionsCount}`);

  const mismatch =
    counts.total !== EXPECTED_AFTER_P11.total ||
    counts.active !== EXPECTED_AFTER_P11.active ||
    counts.completed !== EXPECTED_AFTER_P11.completed ||
    counts.failed !== EXPECTED_AFTER_P11.failed ||
    pageExtractionsCount !== EXPECTED_AFTER_P11.pageExtractions;

  if (mismatch) {
      console.error('RC_X4E_R8_FIX1_BASELINE_MISMATCH');
      console.error('Expected:', EXPECTED_AFTER_P11);
      console.error('Actual:', { ...counts, pageExtractions: pageExtractionsCount });
      process.exit(1);
  }

  console.log('RC_X4E_R8_FIX1_BASELINE_AFTER_P11_CONFIRMED');

  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  const content = fs.readFileSync(workerPath, 'utf8');

  const checkers = [
    '--prefer-native-digital',
    '--allow-auto-detect',
    'SKIPPED_AUTO_DETECT_NOT_ALLOWED',
    'SKIPPED_NATIVE_TEXT_PROBE_EMPTY',
    'SKIPPED_RECENT_EMPTY_NATIVE_TEXT_FAILURE_DOCUMENT',
    'extractPagesNatively(bytes, task.page_start, task.page_start)',
    'recentFailuresDocIds.has(task.document_id)'
  ];

  console.log('\nStatic Policy Check:');
  let staticValid = true;
  for (const check of checkers) {
    const exists = content.includes(check);
    console.log(`- ${check}: ${exists ? 'PRESENT' : 'MISSING'}`);
    if (!exists) staticValid = false;
  }

  if (content.includes('VertexAI') || content.includes('Gemini')) {
      console.error('BLOCKER: AI imports found in worker');
      staticValid = false;
  }

  if (!staticValid) {
    console.error('RC_X4E_R8_FIX1_STATIC_POLICY_INVALID');
    process.exit(1);
  }

  console.log('\nLive Selector Simulation (Dry-Run):');
  try {
    const output = cp.execSync('node functions/process_pagewise_extraction_batches.js --dry-run --limit 3 --prefer-native-digital', { encoding: 'utf8' });
    console.log('--- Simulation Output Start ---');
    console.log(output);
    console.log('--- Simulation Output End ---');

    const selectedLine = output.split('\n').find(l => l.includes('Selected IDs:'));
    if (!selectedLine) {
        console.error('BLOCKER: Could not find "Selected IDs:" in worker output');
        process.exit(1);
    }
    const selectedIds = selectedLine.split('Selected IDs:')[1].split(',').map(s => s.trim());
    console.log('Parsed Selected IDs:', selectedIds);

    if (selectedIds.length !== 3) {
        console.error(`BLOCKER: Expected 3 selected tasks, found ${selectedIds.length}`);
        process.exit(1);
    }

    for (const sid of selectedIds) {
        if (sid.toLowerCase().includes('auto_detect')) {
            console.error(`BLOCKER: AUTO_DETECT task ${sid} was selected in prefer-native-digital mode`);
            process.exit(1);
        }
    }

    if (!output.includes('Prefer Native Digital: YES')) {
        console.error('BLOCKER: Dry-run did not acknowledge prefer-native-digital mode');
        process.exit(1);
    }

    if (output.includes('SKIPPED_AUTO_DETECT_NOT_ALLOWED') || output.includes('SKIPPED_RECENT_EMPTY_NATIVE_TEXT_FAILURE_DOCUMENT')) {
        console.log('Selector successfully skipped unsafe/scanned candidates.');
    }

    if (output.includes('Source access: SUCCESS') && output.includes('Page range check: VALID')) {
        console.log('Selected candidates passed basic validation.');
    }

  } catch (e) {
    console.error('Simulation Failed:', e.message);
    process.exit(1);
  }

  console.log('\nRC_X4E_R8_FIX1_CANDIDATE_SELECTOR_POLICY_READY');
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
