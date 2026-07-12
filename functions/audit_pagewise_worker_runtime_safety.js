const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');

const PROJECT_ID = 'rankcrackers-55';

function getAccessToken() {
  try { return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim(); }
  catch (error) {
    console.error('Authentication Error: Could not get gcloud access token.', error.message);
    process.exit(1);
  }
}

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-P1 - PAGEWISE WORKER RUNTIME SAFETY');
  console.log('==============================================');

  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  if (!fs.existsSync(workerPath)) {
    console.error('BLOCKER: process_pagewise_extraction_batches.js missing');
    process.exit(1);
  }

  const workerContent = fs.readFileSync(workerPath, 'utf8');
  const blockers = [];
  const warnings = [];

  // A. Static Worker Safety
  if (!workerContent.includes('--dry-run')) blockers.push('Worker missing --dry-run');
  if (!workerContent.includes('--limit')) blockers.push('Worker missing --limit');
  if (!workerContent.includes('CONFIRM_PROCESS_PAGEWISE_EXTRACTION')) blockers.push('Worker missing apply confirmation phrase');

  const writeSigs = ['.set(', '.update(', '.add(', 'batch.commit()'];
  for (const sig of writeSigs) {
    if (workerContent.includes(sig)) {
        const lines = workerContent.split('\n');
        const badLines = lines.filter(l => {
            if (!l.includes(sig) || l.trim().startsWith('//')) return false;
            // Exclude Set.add
            if (sig === '.add(' && (l.includes('Represented.add') || l.includes('Set'))) return false;
            // Allowed writes in RC-X4E-P1
            if (l.includes('db.collection(\'ai_queue\').doc(task.id).update')) return false;
            if (l.includes('batch.set(extractionRef')) return false;
            if (l.includes('batch.update(taskRef')) return false;
            if (l.includes('await batch.commit()')) return false;
            return true;
        });
        if (badLines.length > 0) blockers.push(`Potentially dangerous write signature found: ${sig}`);
    }
  }

  const aiSigs = ['VertexAI', 'GenerativeModel', 'Gemini', 'documentai', 'vision', 'OCR', 'processDocument'];
  for (const sig of aiSigs) {
     if (workerContent.includes(sig)) {
         const lines = workerContent.split('\n');
         const badLines = lines.filter(l => {
             if (!l.includes(sig)) return false;
             if (l.trim().startsWith('//') || l.includes('/*') || l.includes('*/')) return false;
             if (l.includes(`no ${sig}`)) return false;
             return true;
         });
         if (badLines.length > 0) blockers.push(`AI/OCR signature found: ${sig}`);
     }
  }

  // B. Runtime Queue Safety
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  const tasksSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const tasks = tasksSnap.docs.map(d => d.data());
  const totalActive = tasks.filter(t => ['queued', 'pending'].includes(t.status?.toLowerCase())).length;
  const totalProcessing = tasks.filter(t => ['processing', 'running'].includes(t.status?.toLowerCase())).length;
  const totalCompleted = tasks.filter(t => ['completed', 'done', 'success'].includes(t.status?.toLowerCase())).length;
  const totalFailed = tasks.filter(t => ['failed', 'error', 'dead_letter'].includes(t.status?.toLowerCase())).length;

  console.log('Runtime Queue State:');
  console.log(`- Total pagewise tasks: ${tasks.length}`);
  console.log(`- Queued/Pending: ${totalActive}`);
  console.log(`- Processing/Running: ${totalProcessing}`);
  console.log(`- Completed: ${totalCompleted}`);
  console.log(`- Failed: ${totalFailed}`);

  // C. Dry-Run Behavior
  console.log('\nRunning Worker Dry-Run Check...');
  try {
    const dryRunOutput = cp.execSync(`node "${workerPath}" --dry-run --limit 1`, { encoding: 'utf8' });
    console.log('--- Dry-Run Output Start ---');
    console.log(dryRunOutput);
    console.log('--- Dry-Run Output End ---');

    if (!dryRunOutput.includes('RC_X4W_PAGEWISE_WORKER_DRY_RUN_READY')) blockers.push('Dry-run output missing success verdict');

    // Check for fixed logging
    if (!dryRunOutput.includes('Total active pagewise tasks found:')) {
        blockers.push('Dry-run output missing total active tasks count.');
    }
    if (!dryRunOutput.includes('Tasks selected by limit: 1')) {
        blockers.push('Dry-run output missing tasks selected by limit (1).');
    }

    // D. Source Access Sample
    if (dryRunOutput.includes('FAILED')) {
        blockers.push('Dry-run reported source access failure.');
    } else {
        console.log('Source access sample: PASSED');
    }

  } catch (e) {
    console.error('Error running worker dry-run:', e.message);
    blockers.push('Worker dry-run execution failed.');
  }

  if (blockers.length === 0) {
    console.log('\nRC_X4E_P1_RUNTIME_SAFETY_AUDIT_READY');
    console.log('Recommended next patch: RC-X4E-P1 — Pagewise Extraction Apply Implementation, Batch 1 Safety');
  } else {
    console.error('\nRC_X4E_P1_RUNTIME_SAFETY_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit();
