const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const axios = require('axios');

const PROJECT_ID = 'rankcrackers-55';
const APPLY_CONFIRMATION = 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION';

function parseArgs(argv) {
  const applyIndex = argv.indexOf('--apply');
  const isDryRun = argv.includes('--dry-run') || applyIndex === -1;
  const confirmation = applyIndex >= 0 ? argv[applyIndex + 1] : '';
  const isApplyMode = applyIndex >= 0 && confirmation === APPLY_CONFIRMATION;
  const limitArg = argv.find(a => a.startsWith('--limit='));
  const limitIdx = argv.indexOf('--limit');
  let limit = 3;
  if (limitArg) limit = parseInt(limitArg.split('=')[1], 10);
  else if (limitIdx >= 0) limit = parseInt(argv[limitIdx + 1], 10);
  return { isDryRun, isApplyMode, confirmation, applyRequested: applyIndex >= 0, limit: isNaN(limit) ? 3 : limit };
}

const cli = parseArgs(process.argv.slice(2));

function getAccessToken() {
  try { return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim(); }
  catch (error) {
    console.error('Authentication Error: Could not get gcloud access token.', error.message);
    process.exit(1);
  }
}

async function resolveSourceBytes(path, token) {
  if (!path) throw new Error('EMPTY_SOURCE_PATH');
  const headers = { 'Authorization': `Bearer ${token}` };

  if (path.startsWith('gs://')) {
    const bucket = path.split('/')[2];
    const object = path.split('/').slice(3).join('/');
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(object)}?alt=media`;
    const response = await axios.get(url, { headers, responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  if (path.startsWith('https://')) {
    const response = await axios.get(path, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  // Assume relative path in default bucket
  const bucket = `${PROJECT_ID}.firebasestorage.app`;
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
  const response = await axios.get(url, { headers, responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

function validateTaskShape(task) {
  const required = [
    'task_type', 'mission_id', 'document_id', 'source_document_id', 'document_type',
    'source_path', 'page_start', 'page_end', 'page_batch_index', 'total_batches',
    'status', 'expected_output'
  ];
  const missing = required.filter(k => task[k] === undefined || task[k] === null || task[k] === '');
  if (task.task_type !== 'pagewise_text_extraction_batch') return { valid: false, reason: 'INVALID_TASK_TYPE' };
  if (task.expected_output !== 'page_extractions') return { valid: false, reason: 'INVALID_EXPECTED_OUTPUT' };
  if (missing.length > 0) return { valid: false, reason: `MISSING_FIELDS: ${missing.join(', ')}` };
  return { valid: true };
}

async function main() {
  console.log('==============================================');
  console.log('PATCH RC-X4W - PAGEWISE EXTRACTION WORKER (DRY-RUN)');
  console.log('==============================================');
  console.log(`Mode: ${cli.isApplyMode ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Limit: ${cli.limit} tasks`);

  if (cli.isApplyMode) {
    console.error('APPLY_BLOCKED_NOT_ENABLED_FOR_RC_X4W');
    process.exit(1);
  }

  const token = getAccessToken();
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }

  const queueSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .where('status', 'in', ['queued', 'pending'])
    .limit(cli.limit)
    .get();

  console.log(`\n1. Active pagewise tasks found: ${queueSnap.size} (matching criteria)`);
  if (queueSnap.empty) {
    console.log('\nRC_X4W_PAGEWISE_WORKER_DRY_RUN_READY (No tasks to process)');
    return;
  }

  const selectedTaskIds = [];
  const documentsRepresented = new Set();
  const pageRanges = [];
  let totalPagesInRange = 0;
  const taskAccessResults = [];
  const shapeResults = [];
  const rangeResults = [];
  let expectedPageExtractionsCount = 0;

  for (const doc of queueSnap.docs) {
    const task = { id: doc.id, ...doc.data() };
    selectedTaskIds.push(task.id);
    documentsRepresented.add(task.document_id);
    pageRanges.push(`${task.page_start}-${task.page_end}`);
    totalPagesInRange += (task.page_end - task.page_start + 1);

    // 1. Shape Validation
    const shape = validateTaskShape(task);
    shapeResults.push({ id: task.id, ...shape });

    // 2. Source Access Result
    try {
      const bytes = await resolveSourceBytes(task.source_path, token);
      taskAccessResults.push({ id: task.id, success: true, size: bytes.length });
    } catch (e) {
      taskAccessResults.push({ id: task.id, success: false, error: e.message });
    }

    // 3. Page Range Validation
    const rangeValid = task.page_start >= 1 && task.page_end >= task.page_start;
    rangeResults.push({ id: task.id, valid: rangeValid });

    // 4. Expected Output Preview (Virtual)
    for (let p = task.page_start; p <= task.page_end; p++) {
       expectedPageExtractionsCount++;
       // Future shape preview (Internal Function Only)
       // function buildRecord(p) { return { mission_id: task.mission_id, page_number: p, ... } }
    }
  }

  console.log(`2. Tasks selected by limit: ${selectedTaskIds.length}`);
  console.log(`3. Selected task IDs: ${selectedTaskIds.join(', ')}`);
  console.log(`4. Documents represented: ${[...documentsRepresented].join(', ')}`);
  console.log(`5. Page ranges selected: ${pageRanges.join(', ')}`);
  console.log(`6. Total pages in selected tasks: ${totalPagesInRange}`);

  console.log('\n7. Source access result per task:');
  taskAccessResults.forEach(r => console.log(`   - ${r.id}: ${r.success ? `SUCCESS (${r.size} bytes)` : `FAILED (${r.error})`}`));

  console.log('\n8. Shape validation result per task:');
  shapeResults.forEach(r => console.log(`   - ${r.id}: ${r.valid ? 'VALID' : `INVALID (${r.reason})`}`));

  console.log('\n9. Page range validation result per task:');
  rangeResults.forEach(r => console.log(`   - ${r.id}: ${r.valid ? 'VALID' : 'INVALID'}`));

  console.log(`\n10. Expected page_extraction preview count: ${expectedPageExtractionsCount}`);

  console.log('\n11. Confirmation:');
  console.log('    - no Firestore write: YES');
  console.log('    - no queue status update: YES');
  console.log('    - no page_extractions created: YES');
  console.log('    - no AI extraction: YES');
  console.log('    - no OCR: YES');
  console.log('    - no text extraction: YES');
  console.log('    - task limit is not page limit: YES');

  const allAccess = taskAccessResults.every(r => r.success);
  const allShape = shapeResults.every(r => r.valid);
  const allRange = rangeResults.every(r => r.valid);

  if (allAccess && allShape && allRange) {
    console.log('\nRC_X4W_PAGEWISE_WORKER_DRY_RUN_READY');
  } else {
    console.error('\nRC_X4W_PAGEWISE_WORKER_DRY_RUN_BLOCKED');
    if (!allAccess) console.error('   - Some source files could not be accessed.');
    if (!allShape) console.error('   - Some tasks have invalid shape.');
    if (!allRange) console.error('   - Some page ranges are invalid.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\nRC_X4W_PAGEWISE_WORKER_DRY_RUN_BLOCKED');
  console.error(error);
  process.exit(1);
});
