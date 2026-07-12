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
  console.log('PATCH RC-X4W-AUDIT - PAGEWISE WORKER RUNTIME SAFETY');
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
  if (!workerContent.includes('APPLY_BLOCKED_NOT_ENABLED_FOR_RC_X4W')) blockers.push('Worker apply mode not blocked for RC-X4W');

  const writeSigs = ['.set(', '.update(', '.add(', 'batch.commit()'];
  for (const sig of writeSigs) {
    if (workerContent.includes(sig)) {
        const lines = workerContent.split('\n');
        const badLines = lines.filter(l => {
            if (!l.includes(sig) || l.trim().startsWith('//')) return false;
            // Exclude Set.add
            if (sig === '.add(' && (l.includes('Represented.add') || l.includes('Set'))) return false;
            return true;
        });
        if (badLines.length > 0) blockers.push(`Potentially dangerous write signature found: ${sig} in lines: ${badLines.map(l => l.trim()).join(', ')}`);
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
         if (badLines.length > 0) blockers.push(`AI/OCR signature found: ${sig} in lines: ${badLines.map(l => l.trim()).join(', ')}`);
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

  if (totalActive !== 104) blockers.push(`Expected 104 active tasks, found ${totalActive}`);
  if (totalProcessing > 0) blockers.push('Extraction already started (processing tasks found)');
  if (totalCompleted > 0) blockers.push('Extraction already started (completed tasks found)');

  // Check page_extractions
  const missionsSnap = await db.collection('mission_realms').get();
  let totalPageExtractions = 0;
  for (const missionDoc of missionsSnap.docs) {
    const pSnap = await db.collection('mission_realms').doc(missionDoc.id).collection('official_documents').get();
    for (const doc of pSnap.docs) {
        const eSnap = await doc.ref.collection('page_extractions').limit(1).get();
        if (!eSnap.empty) totalPageExtractions++;
    }
  }
  console.log(`- Unique docs with page extractions: ${totalPageExtractions}`);
  if (totalPageExtractions > 0) blockers.push('Page extraction records already exist');

  // C. Dry-Run Behavior
  console.log('\nRunning Worker Dry-Run Check...');
  try {
    const dryRunOutput = cp.execSync(`node "${workerPath}" --dry-run --limit 3`, { encoding: 'utf8' });
    console.log('--- Dry-Run Output Start ---');
    console.log(dryRunOutput);
    console.log('--- Dry-Run Output End ---');

    if (!dryRunOutput.includes('RC_X4W_PAGEWISE_WORKER_DRY_RUN_READY')) blockers.push('Dry-run output missing success verdict');
    if (!dryRunOutput.includes('no Firestore write: YES')) blockers.push('Dry-run output missing no-write confirmation');
    if (!dryRunOutput.includes('no AI extraction: YES')) blockers.push('Dry-run output missing no-AI confirmation');

    // Check for fixed logging
    if (!dryRunOutput.includes('Total active pagewise tasks found: 104')) {
        blockers.push('Dry-run output missing correct total active tasks count (104).');
    }
    if (!dryRunOutput.includes('Tasks selected by limit: 3')) {
        blockers.push('Dry-run output missing tasks selected by limit (3).');
    }
    if (!dryRunOutput.includes('task limit is not page limit: YES')) {
        blockers.push('Dry-run output missing task limit policy confirmation.');
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

  console.log('\nAudit Results:');
  console.log(`- Static safety: ${blockers.filter(b => b.includes('signature') || b.includes('apply')).length === 0 ? 'PASSED' : 'FAILED'}`);
  console.log(`- Runtime safety: ${blockers.filter(b => b.includes('Extraction') || b.includes('tasks') || b.includes('records')).length === 0 ? 'PASSED' : 'FAILED'}`);
  console.log(`- Dry-run behavior: ${blockers.filter(b => b.includes('Dry-run')).length === 0 ? 'PASSED' : 'FAILED'}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.warn(`- ${w}`));
  }

  if (blockers.length === 0) {
    console.log('\nRC_X4W_RUNTIME_SAFETY_AUDIT_READY');
    console.log('Recommended next patch: RC-X4W-FIX (to address warnings) or RC-X4E-P1 (to implement apply)');
  } else {
    console.error('\nRC_X4W_RUNTIME_SAFETY_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit();
