const admin = require('firebase-admin');
const cp = require('child_process');
const axios = require('axios');
const { PDFParse } = require('pdf-parse');

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

  const taskIdArg = argv.find(a => a.startsWith('--task-id='));
  const taskIdIdx = argv.indexOf('--task-id');
  let taskId = '';
  if (taskIdArg) taskId = taskIdArg.split('=')[1];
  else if (taskIdIdx >= 0) taskId = argv[taskIdIdx + 1];

  return {
    isDryRun, isApplyMode, confirmation, applyRequested: applyIndex >= 0,
    limit: isNaN(limit) ? 3 : limit,
    taskId
  };
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

async function extractPagesNatively(bytes, start, end) {
  const parser = new PDFParse({ data: bytes });
  try {
    const pages = [];
    for (let p = start; p <= end; p++) pages.push(p);

    const result = await parser.getText({ partial: pages });
    const totalPagesInDoc = result.total;

    if (end > totalPagesInDoc) {
      throw new Error(`TASK_PAGE_END_OUT_OF_RANGE: ${end} > ${totalPagesInDoc}`);
    }

    const pageMap = {};
    if (result.pages && result.pages.length > 0) {
      result.pages.forEach(pData => {
        const pageNum = Number(pData.num);
        if (Number.isFinite(pageNum) && pageNum >= start && pageNum <= end) {
           pageMap[pageNum] = String(pData.text || '').trim();
        }
      });
    } else if (pages.length === 1 && result.text) {
      // Fallback for single page if pages array is missing but text exists
      pageMap[start] = String(result.text).trim();
    }

    return { result: pageMap, totalPagesInDoc };
  } finally {
    await parser.destroy();
  }
}

async function main() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-P1-FIX2 - PAGEWISE EXTRACTION WORKER');
  console.log('==============================================');
  console.log(`Mode: ${cli.isApplyMode ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Limit: ${cli.limit} tasks`);

  if (cli.isApplyMode && cli.limit !== 3) {
    console.error('RC_X4E_P4_L3_BLOCKED_LIMIT_MUST_BE_3');
    process.exit(1);
  }

  const token = getAccessToken();

  // Initialize firebase-admin consistently
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  const queueSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'pagewise_text_extraction_batch')
    .where('status', 'in', ['queued', 'pending'])
    .get();

  const allActiveTasks = queueSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  allActiveTasks.sort((a, b) => {
    const timeA = a.created_at?.toMillis?.() || 0;
    const timeB = b.created_at?.toMillis?.() || 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });

  let selectedTasks = allActiveTasks;
  if (cli.taskId) {
    selectedTasks = allActiveTasks.filter(t => t.id === cli.taskId);
    console.log(`\nFiltering by task-id: ${cli.taskId} (Found: ${selectedTasks.length})`);
  } else {
    selectedTasks = allActiveTasks.slice(0, cli.limit);
  }

  console.log(`\n1. Total active pagewise tasks found: ${allActiveTasks.length}`);

  if (selectedTasks.length === 0) {
    console.log('\nRC_X4W_PAGEWISE_WORKER_DRY_RUN_READY (No tasks to process)');
    return;
  }

  console.log(`2. Tasks selected by limit/filter: ${selectedTasks.length}`);

  for (const task of selectedTasks) {
    console.log(`\nProcessing task: ${task.id}`);

    const shape = validateTaskShape(task);
    if (!shape.valid) {
      console.log(`   - Shape check: INVALID (${shape.reason})`);
      if (cli.isApplyMode) {
        await db.collection('ai_queue').doc(task.id).update({
          status: 'failed',
          failure_reason: 'INVALID_TASK_SHAPE',
          error_message: shape.reason,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          created_by_patch_failed: 'RC-X4E-P1-FIX2'
        });
      }
      continue;
    }
    console.log('   - Shape check: VALID');

    let bytes;
    try {
      bytes = await resolveSourceBytes(task.source_path, token);
      console.log(`   - Source access: SUCCESS (${bytes.length} bytes)`);
    } catch (e) {
      console.log(`   - Source access: FAILED (${e.message})`);
      if (cli.isApplyMode) {
        await db.collection('ai_queue').doc(task.id).update({
          status: 'failed',
          failure_reason: 'SOURCE_ACCESS_FAILED',
          error_message: e.message,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          created_by_patch_failed: 'RC-X4E-P1-FIX2'
        });
      }
      continue;
    }

    const rangeValid = task.page_start >= 1 && task.page_end >= task.page_start;
    if (!rangeValid) {
      console.log('   - Page range check: INVALID');
      if (cli.isApplyMode) {
        await db.collection('ai_queue').doc(task.id).update({
          status: 'failed',
          failure_reason: 'INVALID_PAGE_RANGE',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          created_by_patch_failed: 'RC-X4E-P1-FIX2'
        });
      }
      continue;
    }
    console.log(`   - Page range check: VALID (${task.page_start}-${task.page_end})`);

    if (cli.isApplyMode) {
      try {
        console.log('   - Extracting text natively...');
        const { result: extractedTexts } = await extractPagesNatively(bytes, task.page_start, task.page_end);

        // Empty Text Safety
        const emptyPages = [];
        for (let p = task.page_start; p <= task.page_end; p++) {
          if (!extractedTexts[p] || extractedTexts[p].trim().length === 0) {
            emptyPages.push(p);
          }
        }

        if (emptyPages.length > 0) {
          console.log(`   - RC_X4E_P1_SAFE_FAILURE_EMPTY_NATIVE_TEXT (Pages: ${emptyPages.join(', ')})`);
          await db.collection('ai_queue').doc(task.id).update({
            status: 'failed',
            failure_reason: 'NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED',
            error_message: `Empty text on pages: ${emptyPages.join(', ')}`,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            created_by_patch_failed: 'RC-X4E-P1-FIX2'
          });
          continue;
        }

        // Duplicate Page Extraction Safety
        const docRef = db.collection('mission_realms').doc(task.mission_id)
          .collection('official_documents').doc(task.document_id);

        const duplicatePages = [];
        for (let p = task.page_start; p <= task.page_end; p++) {
          const existing = await docRef.collection('page_extractions').doc(String(p)).get();
          if (existing.exists) duplicatePages.push(p);
        }

        if (duplicatePages.length > 0) {
          console.log(`   - Duplicate pages found: ${duplicatePages.join(', ')}`);
          await db.collection('ai_queue').doc(task.id).update({
            status: 'failed',
            failure_reason: 'PAGE_EXTRACTION_ALREADY_EXISTS',
            error_message: `Duplicate page records: ${duplicatePages.join(', ')}`,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            created_by_patch_failed: 'RC-X4E-P1-FIX2'
          });
          continue;
        }

        const batch = db.batch();
        let pagesInBatch = 0;
        for (let p = task.page_start; p <= task.page_end; p++) {
          const text = extractedTexts[p];
          const extractionRef = docRef.collection('page_extractions').doc(String(p));
          const payload = {
            mission_id: task.mission_id,
            document_id: task.document_id,
            source_document_id: task.source_document_id,
            source_path: task.source_path,
            document_type: task.document_type,
            language: task.language,
            page_number: p,
            page_start: task.page_start,
            page_end: task.page_end,
            page_batch_index: task.page_batch_index,
            total_batches: task.total_batches,
            extraction_text: text,
            extraction_status: 'extracted_draft',
            review_status: 'pending_founder_verification',
            extracted_by_task_id: task.id,
            extraction_method: 'native_pdf_text',
            source_proof: {
              source_path: task.source_path,
              page_number: p,
              task_id: task.id
            },
            page_policy: {
              all_pages_required: true,
              fixed_page_limit_allowed: false,
              batch_size_is_not_page_limit: true
            },
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            created_by_patch: 'RC-X4E-P1-FIX2'
          };

          if (task.mission_id === 'AUTO_DETECT') {
            payload.requires_founder_mission_assignment_before_publish = true;
            payload.auto_detect_routing_only = true;
            payload.publish_blocked_until_founder_mission_assignment = true;
          }

          batch.set(extractionRef, payload);
          pagesInBatch++;
        }

        const taskRef = db.collection('ai_queue').doc(task.id);
        batch.update(taskRef, {
          status: 'completed',
          completed_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          extraction_method: 'native_pdf_text',
          page_extractions_created: pagesInBatch,
          page_range_processed: {
            page_start: task.page_start,
            page_end: task.page_end
          },
          created_by_patch_completed: 'RC-X4E-P1-FIX2'
        });

        console.log(`   - Committing ${pagesInBatch} page extractions...`);
        await batch.commit();
        console.log('   - Task COMPLETED successfully.');

      } catch (e) {
        console.error(`   - Extraction failed: ${e.message}`);
        await db.collection('ai_queue').doc(task.id).update({
          status: 'failed',
          failure_reason: 'NATIVE_TEXT_EXTRACTION_ERROR',
          error_message: e.message,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          created_by_patch_failed: 'RC-X4E-P1-FIX2'
        });
      }
    } else {
      console.log('   - Mode: DRY-RUN (Skipping extraction and writes)');
    }
  }

  console.log('\nConfirmation:');
  console.log(`    - no Firestore write: ${cli.isApplyMode ? 'NO (Writes enabled for apply)' : 'YES'}`);
  console.log(`    - no queue status update: ${cli.isApplyMode ? 'NO (Updated for apply)' : 'YES'}`);
  console.log('    - no AI extraction: YES');
  console.log('    - no OCR: YES');
  console.log('    - no text extraction: NO (Native extraction enabled in apply)');
  console.log('    - task limit is not page limit: YES');

  if (cli.isApplyMode) {
    console.log('\nRC_X4E_P1_FIX2_APPLY_FINISHED');
  } else {
    console.log('\nRC_X4W_PAGEWISE_WORKER_DRY_RUN_READY');
  }
}

main().catch(error => {
  console.error('\nRC_X4E_P1_BLOCKED');
  console.error(error);
  process.exit(1);
});
