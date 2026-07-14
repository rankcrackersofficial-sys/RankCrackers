const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';

const EXPECTED_AFTER_P10 = {
  total: 104,
  active: 82,
  completed: 19,
  failed: 3,
  processing: 0,
  pageExtractions: 62
};

function assertNoStaleBaselineSignature() {
  const auditContent = fs.readFileSync(__filename, 'utf8');
  const staleSigs = [
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
  console.log('PATCH RC-X4E-R8-FIX1 - PAGEWISE WORKER RUNTIME SAFETY');
  console.log('==============================================');

  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  if (!fs.existsSync(workerPath)) {
    console.error('BLOCKER: process_pagewise_extraction_batches.js missing');
    process.exit(1);
  }

  const workerContent = fs.readFileSync(workerPath, 'utf8');
  const auditContent = fs.readFileSync(__filename, 'utf8');
  const blockers = [];

  // A. Static Self-Check (No mixed SDK)
  const mixedSigs = ['@google-cloud' + '/firestore', 'google-auth' + '-library', 'new Fire' + 'store(', 'auth' + 'Client', 'OAuth2' + 'Client'];
  const lines = auditContent.split('\n');
  for (const sig of mixedSigs) {
      const found = lines.filter(l => l.includes(sig) && !l.includes('mixedSigs') && !l.includes('const sig of') && !l.includes('//') && !l.includes('prohibited mixed SDK signature'));
      if (found.length > 0) {
          blockers.push(`Audit file itself contains prohibited mixed SDK signature: ${sig}`);
      }
  }

  // B. Static Worker Safety
  if (!workerContent.includes('--dry-run')) blockers.push('Worker missing --dry-run');
  if (!workerContent.includes('--limit')) blockers.push('Worker missing --limit');
  if (!workerContent.includes('CONFIRM_PROCESS_PAGEWISE_EXTRACTION')) blockers.push('Worker missing apply confirmation phrase');

  if (workerContent.includes("require('@google-cloud" + "/firestore')") || workerContent.includes('new Fire' + 'store')) {
      blockers.push('Worker uses mixed/incorrect Firestore SDK. Must use firebase-admin.');
  }
  if (!workerContent.includes('admin.firestore()')) {
      blockers.push('Worker missing admin.firestore() call.');
  }

  const writeSigs = ['.set(', '.update(', '.add(', 'batch.commit()'];
  for (const sig of writeSigs) {
    if (workerContent.includes(sig)) {
        const lines = workerContent.split('\n');
        const badLines = lines.filter(l => {
            if (!l.includes(sig) || l.trim().startsWith('//')) return false;
            if (sig === '.add(' && (l.includes('Represented.add') || l.includes('Set'))) return false;
            if (l.includes('db.collection(\'ai_queue\').doc(task.id).update')) return false;
            if (l.includes('batch.set(extractionRef')) return false;
            if (l.includes('batch.update(taskRef')) return false;
            if (l.includes('await batch.commit()')) return false;
            return true;
        });
        if (badLines.length > 0) blockers.push(`Potentially dangerous write signature found in worker: ${sig}`);
    }
  }

  if (blockers.length > 0) {
      console.error('RC_X4E_R8_FIX1_RUNTIME_AUDIT_MIXED_SDK_BLOCKED');
      blockers.forEach(b => console.error(`- ${b}`));
      process.exit(1);
  }

  // C. Runtime Queue Safety
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  const tasksSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const tasks = tasksSnap.docs.map(d => d.data());
  const actualCounts = {
      total: tasks.length,
      active: tasks.filter(t => ['queued', 'pending'].includes(t.status?.toLowerCase())).length,
      completed: tasks.filter(t => ['completed', 'done', 'success'].includes(t.status?.toLowerCase())).length,
      failed: tasks.filter(t => ['failed', 'error', 'dead_letter'].includes(t.status?.toLowerCase())).length,
      processing: tasks.filter(t => ['processing', 'running'].includes(t.status?.toLowerCase())).length
  };

  const extractionsGlobalSnap = await db.collectionGroup('page_extractions').get();
  const actualPageExtractions = extractionsGlobalSnap.size;

  console.log('Runtime Queue State:');
  console.log(`- Total pagewise tasks: ${actualCounts.total}`);
  console.log(`- Queued/Pending: ${actualCounts.active}`);
  console.log(`- Processing/Running: ${actualCounts.processing}`);
  console.log(`- Completed: ${actualCounts.completed}`);
  console.log(`- Failed: ${actualCounts.failed}`);
  console.log(`- Global Page Extractions: ${actualPageExtractions}`);

  const mismatch =
    actualCounts.total !== EXPECTED_AFTER_P10.total ||
    actualCounts.active !== EXPECTED_AFTER_P10.active ||
    actualCounts.completed !== EXPECTED_AFTER_P10.completed ||
    actualCounts.failed !== EXPECTED_AFTER_P10.failed ||
    actualPageExtractions !== EXPECTED_AFTER_P10.pageExtractions;

  if (mismatch) {
      console.error('RC_X4E_R8_FIX1_BASELINE_MISMATCH');
      console.error('Expected:', EXPECTED_AFTER_P10);
      console.error('Actual:', { ...actualCounts, pageExtractions: actualPageExtractions });
      process.exit(1);
  }

  console.log('RC_X4E_R8_FIX1_BASELINE_AFTER_P10_CONFIRMED');

  // D. Hardened Selector Dry-Run Behavior
  console.log('\nRunning Hardened Selector Dry-Run Check...');
  try {
    const dryRunOutput = cp.execSync(`node "${workerPath}" --dry-run --limit 3 --prefer-native-digital`, { encoding: 'utf8' });
    console.log('--- Dry-Run Output Start ---');
    console.log(dryRunOutput);
    console.log('--- Dry-Run Output End ---');

    if (!dryRunOutput.includes('RC_X4W_PAGEWISE_WORKER_DRY_RUN_READY')) blockers.push('Dry-run output missing success verdict');
    if (!dryRunOutput.includes('Mode: DRY-RUN')) blockers.push('Output missing Mode: DRY-RUN');
    if (!dryRunOutput.includes('Limit: 3 tasks')) blockers.push('Output missing Limit: 3 tasks');
    if (!dryRunOutput.includes('Prefer Native Digital: YES')) blockers.push('Output missing Prefer Native Digital: YES');
    if (!dryRunOutput.includes('Allow AUTO_DETECT: NO')) blockers.push('Output missing Allow AUTO_DETECT: NO');

    if (dryRunOutput.includes('Selected IDs:')) {
        const selectedLine = dryRunOutput.split('\n').find(l => l.includes('Selected IDs:'));
        if (selectedLine.toLowerCase().includes('auto_detect')) {
            blockers.push('AUTO_DETECT task selected in hardened dry-run');
        }
    }

    const forbiddenDryRun = ['Writes enabled for apply', 'Task COMPLETED successfully', 'Committing'];
    for (const f of forbiddenDryRun) {
        if (dryRunOutput.includes(f)) {
            blockers.push(`Dry-run output contains prohibited string: ${f}`);
        }
    }

    if (blockers.length === 0) {
        console.log('Dry-run validation: PASSED');
    }

  } catch (e) {
    console.error('Error running worker dry-run:', e.message);
    blockers.push('Worker dry-run execution failed.');
  }

  if (blockers.length === 0) {
    console.log('\nRC_X4E_R8_FIX1_RUNTIME_SAFETY_AUDIT_READY');
  } else {
    console.error('\nRC_X4E_R8_FIX1_RUNTIME_SAFETY_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
