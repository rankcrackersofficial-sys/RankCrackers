const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const DEFAULT_BUCKET = 'rankcrackers-55.firebasestorage.app';
const CONFIRMATION = 'CONFIRM_PROCESS_PAGE_COUNT_DETECTION';
const ACTIVE_STATUSES = new Set(['queued', 'pending']);

function smartRequire(name) {
  try {
    return require(name);
  } catch (e) {
    try {
      return require(path.join(__dirname, 'node_modules', name));
    } catch (e2) {
      try {
        return require(path.join(process.cwd(), 'node_modules', name));
      } catch (e3) {
        console.error(`Module ${name} not found. Error: ${e.message}`);
        return null;
      }
    }
  }
}

const axios = smartRequire('axios');
const pdfParse = smartRequire('pdf-parse');
const pdfLib = smartRequire('pdf-lib');

function parseArgs(argv) {
  const applyIndex = argv.indexOf('--apply');
  const limitIndex = argv.indexOf('--limit');
  const isDryRun = argv.includes('--dry-run') || applyIndex === -1;
  const confirmation = applyIndex >= 0 ? argv[applyIndex + 1] : '';
  const parsedLimit = limitIndex >= 0 ? Number(argv[limitIndex + 1]) : 5;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 5;
  const exactApply = argv.length === 4
    && argv[0] === '--apply'
    && argv[1] === CONFIRMATION
    && argv[2] === '--limit'
    && Number(argv[3]) === 5;
  const isApplyMode = applyIndex >= 0 && confirmation === CONFIRMATION && exactApply;
  return { isDryRun, isApplyMode, limit, confirmation, applyRequested: applyIndex >= 0, exactApply };
}

const cli = parseArgs(process.argv.slice(2));
const isApplyMode = cli.isApplyMode;
const limit = cli.limit;

function getAccessToken() {
  try {
    return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Authentication Error: Could not get gcloud access token. Ensure gcloud is logged in.', e.message);
    process.exit(1);
  }
}

function normalize(value) { return String(value || '').trim(); }
function lower(value) { return normalize(value).toLowerCase(); }
function isMissingId(value) { return !value || ['unknown', 'n/a', 'null', 'undefined'].includes(lower(value)); }

function getField(data, keys, fallback = null) {
  for (const key of keys) {
    if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
  }
  return fallback;
}

function pageCount(data) {
  const value = Number(getField(data, ['page_count', 'pageCount', 'totalPages', 'total_pages', 'numPages'], NaN));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function encodeObjectPath(objectPath) {
  return encodeURIComponent(objectPath).replace(/%2F/g, '%2F');
}

async function httpGetBuffer(url, accessToken, authRequired = false) {
  if (!axios) throw new Error('AXIOS_NOT_AVAILABLE_FOR_DOWNLOAD');
  const headers = authRequired && accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    headers,
    maxContentLength: 80 * 1024 * 1024,
    maxBodyLength: 80 * 1024 * 1024,
    validateStatus: status => status >= 200 && status < 300,
  });
  return Buffer.from(response.data);
}

function parseGsPath(sourcePath) {
  const withoutScheme = sourcePath.slice('gs://'.length);
  const slash = withoutScheme.indexOf('/');
  if (slash <= 0) throw new Error('INVALID_GS_PATH');
  return {
    bucket: withoutScheme.slice(0, slash),
    objectPath: withoutScheme.slice(slash + 1),
  };
}

async function downloadFileBuffer(sourcePath, accessToken) {
  const source = normalize(sourcePath);
  if (!source) throw new Error('SOURCE_PATH_MISSING');

  if (source.startsWith('gs://')) {
    const { bucket, objectPath } = parseGsPath(source);
    const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeObjectPath(objectPath)}?alt=media`;
    return httpGetBuffer(url, accessToken, true);
  }

  if (/^https?:\/\//i.test(source)) {
    const authRequired = /storage\.googleapis\.com|firebasestorage\.googleapis\.com/i.test(source) && !/[?&]token=/.test(source);
    return httpGetBuffer(source, accessToken, authRequired);
  }

  if (/\.pdf($|\?)|\.json($|\?)/i.test(source)) {
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${DEFAULT_BUCKET}/o/${encodeObjectPath(source)}?alt=media`;
    try {
      return await httpGetBuffer(firebaseUrl, accessToken, true);
    } catch (firstError) {
      const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(DEFAULT_BUCKET)}/o/${encodeObjectPath(source)}?alt=media`;
      try {
        return await httpGetBuffer(gcsUrl, accessToken, true);
      } catch (secondError) {
        throw new Error(`DOWNLOAD_FAILED_FOR_STORAGE_OBJECT: ${firstError.message}; ${secondError.message}`);
      }
    }
  }

  throw new Error('UNSUPPORTED_SOURCE_PATH_FOR_PAGE_COUNT_DOWNLOAD');
}

async function getPdfPageCount(buffer) {
  if (pdfLib) {
    try {
      const { PDFDocument } = pdfLib;
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });
      return pdfDoc.getPageCount();
    } catch (e) {
      console.warn('pdf-lib failed, falling back to pdf-parse:', e.message);
    }
  }

  if (pdfParse) {
    if (pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse({ data: buffer });
      const info = await parser.getInfo();
      return info.total;
    }
    const parse = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
    if (typeof parse === 'function') {
      const data = await parse(buffer, { pagerender: () => '' });
      return data.numpages;
    }
  }

  throw new Error('NO_CAPABLE_PDF_PAGE_COUNT_PARSER_FOUND');
}

function getJsonPageCount(buffer) {
  try {
    const data = JSON.parse(buffer.toString('utf8'));
    const count = pageCount(data);
    if (count != null) return count;
    if (Array.isArray(data.pages)) return data.pages.length;
    return 1;
  } catch (err) {
    return null;
  }
}

function taskDocumentMatchStatus(task, candidateData) {
  if (!candidateData) return 'SOURCE_RECORD_NOT_RESOLVED';
  const candidateMission = getField(candidateData, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], task.mission_id);
  const candidateDocIds = [candidateData.id, candidateData.document_id, candidateData.documentId, candidateData.source_id, candidateData.sourceId].map(normalize).filter(Boolean);
  if (!isMissingId(task.mission_id) && candidateMission && normalize(candidateMission) !== normalize(task.mission_id)) {
    return 'MISSION_ID_MISMATCH';
  }
  if (candidateDocIds.length > 0 && !candidateDocIds.includes(task.document_id)) {
    return 'DOCUMENT_ID_NOT_EXACT_BUT_RECORD_RESOLVED';
  }
  return 'MATCHED';
}

async function buildSourceIndexes(db) {
  const sourceRefs = new Map();
  const missionSourceRefs = new Map();

  const addRef = (missionId, docId, ref, data) => {
    if (docId) sourceRefs.set(docId, { ref, data: { id: docId, ...data } });
    if (missionId && docId) missionSourceRefs.set(`${missionId}::${docId}`, { ref, data: { id: docId, ...data } });
  };

  const missionsSnap = await db.collection('mission_realms').get();
  for (const missionDoc of missionsSnap.docs) {
    const missionId = missionDoc.id;
    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => addRef(missionId, doc.id, doc.ref, doc.data()));
  }

  const ingSnap = await db.collection('ingestion_refinery').get();
  ingSnap.forEach(doc => {
    const data = doc.data();
    const missionId = getField(data, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], null);
    addRef(missionId, doc.id, doc.ref, data);
  });

  const srcSnap = await db.collection('source_documents').get();
  srcSnap.forEach(doc => {
    const data = doc.data();
    const missionId = getField(data, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], null);
    addRef(missionId, doc.id, doc.ref, data);
  });

  return { sourceRefs, missionSourceRefs };
}

function resolveSource(task, indexes) {
  const warnings = [];
  let resolved = null;
  let sourceRecordPath = null;

  if (!isMissingId(task.mission_id)) {
    resolved = indexes.missionSourceRefs.get(`${task.mission_id}::${task.document_id}`) || null;
  }
  if (!resolved) {
    resolved = indexes.sourceRefs.get(task.document_id) || null;
    if (resolved) warnings.push('RESOLVED_BY_DOCUMENT_ID_ONLY');
  }
  if (resolved && resolved.ref) sourceRecordPath = resolved.ref.path;

  const sourceResolution = {
    task_id: task.id,
    mission_id: task.mission_id,
    document_id: task.document_id,
    source_path_found: Boolean(task.source_path),
    canonical_record_path: resolved && resolved.ref ? resolved.ref.path : null,
    source_record_path: sourceRecordPath,
    task_document_match_status: taskDocumentMatchStatus(task, resolved ? resolved.data : null),
    warnings,
  };

  return { resolved, sourceResolution };
}

function buildTaskUpdates(status, extra = {}) {
  return {
    status,
    updated_at: FieldValue.serverTimestamp(),
    ...extra,
  };
}

function buildDocUpdates(task, detectedPageCount) {
  return {
    page_count: detectedPageCount,
    pageCount: detectedPageCount,
    page_count_status: 'detected',
    page_count_detected_by_task_id: task.id,
    page_count_detected_at: FieldValue.serverTimestamp(),
    page_policy: {
      all_pages_required: true,
      fixed_page_limit_allowed: false,
      batch_size_is_not_page_limit: true,
    },
  };
}

async function main() {
  if (cli.applyRequested && !cli.isApplyMode) {
    console.log(`Apply mode locked. Required exact command: node functions/process_page_count_detection_tasks.js --apply ${CONFIRMATION} --limit 5`);
    console.log('No Firestore writes performed. Falling back to dry-run behavior.');
  }

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  console.log('================================================================================');
  console.log('PATCH RC-X3W-FIX - PROCESS PAGE COUNT DETECTION TASKS');
  console.log('================================================================================');
  console.log(`Mode: ${isApplyMode ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Task limit: ${limit}`);

  const queueSnap = await db.collection('ai_queue')
    .where('task_type', '==', 'page_count_detection')
    .get();

  const allTasks = [];
  queueSnap.forEach(doc => allTasks.push({ id: doc.id, ...doc.data() }));
  const activeTasks = allTasks.filter(task => ACTIVE_STATUSES.has(lower(task.status)));
  const selectedTasks = activeTasks.slice(0, limit);
  const indexes = await buildSourceIndexes(db);
  const batch = db.batch();

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const results = [];

  for (const task of selectedTasks) {
    const { resolved, sourceResolution } = resolveSource(task, indexes);
    if (!resolved) {
      skippedCount++;
      results.push({
        task_id: task.id,
        mission_id: task.mission_id,
        document_id: task.document_id,
        source_path: task.source_path || 'MISSING',
        source_resolution: {
          ...sourceResolution,
          warnings: [...sourceResolution.warnings, 'SOURCE_RECORD_NOT_RESOLVED'],
        },
        detected_page_count: 'SKIPPED',
        detection_method: 'NONE',
        skip_reason: 'SOURCE_RECORD_NOT_RESOLVED',
      });
      continue;
    }

    try {
      if (!task.source_path) throw new Error('SOURCE_PATH_MISSING');
      const accessToken = getAccessToken();
      const fileBuffer = await downloadFileBuffer(task.source_path, accessToken);
      let detectedPageCount;
      let detectionMethod;

      if (lower(task.source_path).includes('.json')) {
        detectedPageCount = getJsonPageCount(fileBuffer);
        detectionMethod = 'json_metadata';
      } else {
        detectedPageCount = await getPdfPageCount(fileBuffer);
        detectionMethod = 'pdf_metadata';
      }

      if (!detectedPageCount || detectedPageCount <= 0) {
        throw new Error('PAGE_COUNT_DETECTION_FAILED_NEEDS_MANUAL_REVIEW');
      }

      successCount++;
      const taskUpdates = buildTaskUpdates('completed', {
        detected_page_count: detectedPageCount,
        page_count_detection_method: detectionMethod,
        completed_at: FieldValue.serverTimestamp(),
      });
      const docUpdates = buildDocUpdates(task, detectedPageCount);

      results.push({
        task_id: task.id,
        mission_id: task.mission_id,
        document_id: task.document_id,
        source_path: task.source_path,
        source_resolution: sourceResolution,
        detected_page_count: detectedPageCount,
        detection_method: detectionMethod,
        would_update_task_fields: Object.keys(taskUpdates),
        would_update_document_fields: Object.keys(docUpdates),
      });

      if (isApplyMode) {
        batch.set(db.collection('ai_queue').doc(task.id), taskUpdates, { merge: true });
        batch.set(resolved.ref, docUpdates, { merge: true });
      }
    } catch (err) {
      failedCount++;
      const taskUpdates = buildTaskUpdates('failed', {
        error_message: err.message,
        failure_reason: 'PAGE_COUNT_DETECTION_FAILED_NEEDS_MANUAL_REVIEW',
      });
      results.push({
        task_id: task.id,
        mission_id: task.mission_id,
        document_id: task.document_id,
        source_path: task.source_path || 'MISSING',
        source_resolution: sourceResolution,
        detected_page_count: 'FAILED',
        detection_method: 'NONE',
        error_message: err.message,
        would_update_task_fields: Object.keys(taskUpdates),
      });

      if (isApplyMode) {
        batch.set(db.collection('ai_queue').doc(task.id), taskUpdates, { merge: true });
      }
    }
  }

  if (isApplyMode && selectedTasks.length > 0) {
    await batch.commit();
  }

  const summary = {
    active_queued_page_count_detection_tasks_found: activeTasks.length,
    tasks_selected_by_limit: selectedTasks.length,
    successful_detections_count: successCount,
    failed_detections_count: failedCount,
    skipped_count: skippedCount,
    no_writes_in_dry_run: !isApplyMode,
    no_page_text_extraction: true,
    no_ai_extraction: true,
    no_ocr: true,
    task_limit_is_not_page_limit: true,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
  console.log(isApplyMode ? '\nRC_X3W_PAGE_COUNT_WORKER_IMPL_APPLIED' : '\nRC_X3W_FIX_DRY_RUN_READY');
}

main().catch(e => {
  console.error(isApplyMode ? '\nRC_X3W_APPLY_BLOCKED' : '\nRC_X3W_FIX_DRY_RUN_BLOCKED');
  console.error(e);
  process.exit(1);
});

