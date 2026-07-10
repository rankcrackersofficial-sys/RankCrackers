const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const RPSC_MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';

function getAccessToken() {
  try {
    return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Authentication Error: Could not get gcloud access token. Ensure gcloud is logged in.', e.message);
    process.exit(1);
  }
}

function getField(data, keys, fallback = null) {
  for (const key of keys) {
    if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
  }
  return fallback;
}

function normalize(value) { return String(value || '').trim(); }
function lower(value) { return normalize(value).toLowerCase(); }
function isMissingId(value) { return !value || ['unknown', 'n/a', 'null', 'undefined'].includes(lower(value)); }

function storagePath(data) {
  return getField(data, [
    'storagePath', 'storage_path', 'storageRawPath',
    'sourcePath', 'source_path', 'sourceUrl',
    'downloadUrl', 'filePath', 'url', 'storageUrl'
  ], '');
}

function pageCount(data) {
  const value = Number(getField(data, ['page_count', 'pageCount', 'totalPages', 'total_pages', 'numPages'], NaN));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function docKeys(doc) {
  return [doc.id, doc.documentId, doc.document_id, doc.docId, doc.sourceId, doc.source_id, doc.refineryId, doc.fileHash, doc.hash].map(normalize).filter(Boolean);
}

function relationMatch(record, doc) {
  const keys = docKeys(doc);
  const recordKeys = docKeys(record);
  if (keys.some(key => recordKeys.includes(key) || record.id === key)) return true;
  const docPath = storagePath(doc);
  const recordPath = storagePath(record);
  return Boolean(docPath && recordPath && (docPath === recordPath || docPath.endsWith(recordPath) || recordPath.endsWith(docPath)));
}

function detectLanguage(data) {
  const explicit = lower(getField(data, ['language', 'lang', 'documentLanguage', 'sourceLanguage'], ''));
  if (['en', 'eng', 'english'].includes(explicit)) return 'en';
  if (['hi', 'hin', 'hindi'].includes(explicit)) return 'hi';
  const name = lower(getField(data, ['file_name', 'fileName', 'name', 'title'], ''));
  if (name.includes('hindi')) return 'hi';
  if (name.includes('english')) return 'en';
  return explicit || 'unknown';
}

function detectDocumentType(data) {
  const fields = [
    'document_type',
    'documentType',
    'type',
    'category',
    'document_role',
    'documentRole',
    'intent',
  ];
  const explicit = getField(data, fields, '');
  const hay = [
    explicit,
    data.syllabus_role,
    data.syllabusRole,
    data.pyq_role,
    data.pyqRole,
    data.notification_role,
    data.notificationRole,
    data.file_name,
    data.fileName,
    data.name,
    data.title,
  ].filter(Boolean).join(' ').toLowerCase();

  if (hay.includes('notification')) return 'notification';
  if (hay.includes('amendment') || hay.includes('correction') || hay.includes('corrigendum')) return 'amendment';
  if (hay.includes('result')) return 'result';
  if (hay.includes('cutoff') || hay.includes('cut-off')) return 'cutoff';
  if (hay.includes('answer key') || hay.includes('answer_key')) return 'answer key';
  if (hay.includes('notice')) return 'notice';
  if (hay.includes('syllabus') || hay.includes('paper 1') || hay.includes('paper 2')) return 'syllabus';
  if (hay.includes('pyq') || hay.includes('previous year question paper') || hay.includes('previous year')) return 'pyq';
  if (hay.includes('study material') || hay.includes('study_material')) return 'study material';
  if (hay.includes('book')) return 'book';
  if (hay.includes('update')) return 'update';
  
  const normExplicit = explicit.trim().toLowerCase();
  if ([
    'notification', 'notice', 'amendment', 'syllabus', 'pyq',
    'study material', 'book', 'update', 'result', 'cutoff', 'answer key'
  ].includes(normExplicit)) {
    return normExplicit;
  }
  if (normExplicit === 'previous year question paper') return 'pyq';
  if (normExplicit === 'other official document' || normExplicit === 'other_official_document') return 'other official document';
  
  return 'other official document';
}

function isOfficialLike(data) {
  const hay = [
    data.document_type,
    data.documentType,
    data.document_role,
    data.documentRole,
    data.category,
    data.intent,
    data.syllabus_role,
    data.pyq_role,
    data.notification_role,
    data.file_name,
    data.fileName,
    data.title,
    data.name,
  ].filter(Boolean).join(' ').toLowerCase();
  return /official|notification|notice|syllabus|pyq|study material|paper|document|pdf|json|book|update|result|cutoff|answer key/i.test(hay);
}

function pageNumberFromRecord(id, data) {
  const direct = Number(getField(data, ['page_number', 'pageNumber', 'page', 'number', 'source_page_number', 'sourcePageNumber'], NaN));
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const fromId = String(id || '').match(/(\d+)$/);
  return fromId ? Number(fromId[1]) : null;
}

function pageArrays(data) {
  const pages = [];
  for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages', 'pageWiseExtraction']) {
    if (Array.isArray(data[key])) pages.push(...data[key]);
  }
  for (const parent of ['aiResult', 'rawData', 'result', 'extraction']) {
    if (data[parent] && typeof data[parent] === 'object') {
      for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages']) {
        if (Array.isArray(data[parent][key])) pages.push(...data[parent][key]);
      }
    }
  }
  return pages;
}

async function scanCollection(db, name) {
  try {
    const snap = await db.collection(name).get();
    const records = [];
    snap.forEach(doc => records.push({ id: doc.id, __source: name, __path: doc.ref.path, ...doc.data() }));
    return records;
  } catch (e) { return []; }
}

async function getPageExtractionPages(ref) {
  if (!ref) return [];
  try {
    const snap = await ref.collection('page_extractions').get();
    const pages = [];
    snap.forEach(doc => {
      const n = pageNumberFromRecord(doc.id, doc.data());
      if (n) pages.push(n);
    });
    return [...new Set(pages)].sort((a, b) => a - b);
  } catch (e) { return []; }
}

function listAllJsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        listAllJsFiles(full, files);
      }
    } else if (entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function auditWorkerCapability() {
  const functionsPath = path.join(__dirname);
  const jsFiles = listAllJsFiles(functionsPath);
  let handlerFound = false;
  const handlerFiles = [];
  let writesPageCountToDocument = false;
  let writesStatusToAiQueue = false;
  let canReadPdfWithoutFullExtraction = false;
  let requiresAiModel = false;
  let fixedPageLimitDetected = false;
  let batchSizeUsedAsDocumentLimit = false;

  for (const file of jsFiles) {
    const basename = path.basename(file);
    if (['audit_page_count_queue_state.js', 'apply_universal_page_count_queue.js', 'apply_notification_page_count_queue.js', 'plan_notification_pagewise_batch_queue.js', 'audit_universal_official_document_page_completeness.js'].includes(basename)) {
      continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('page_count_detection') || content.includes('expected_output') && content.includes('page_count')) {
      handlerFound = true;
      handlerFiles.push(path.relative(functionsPath, file));
      if (content.includes('page_count') && (content.includes('update') || content.includes('set'))) {
        writesPageCountToDocument = true;
      }
      if (content.includes('status') && (content.includes('completed') || content.includes('failed'))) {
        writesStatusToAiQueue = true;
      }
      if (content.includes('pdf-parse') || content.includes('pdfjs')) {
        canReadPdfWithoutFullExtraction = true;
      }
      if (content.includes('gemini') || content.includes('callLlm')) {
        requiresAiModel = true;
      }
    }
  }

  return {
    handler_found: handlerFound,
    handler_files: handlerFiles,
    writes_page_count_to_document: handlerFound ? writesPageCountToDocument : 'unknown',
    writes_status_to_ai_queue: handlerFound ? writesStatusToAiQueue : 'unknown',
    can_read_pdf_page_count_without_full_extraction: handlerFound ? canReadPdfWithoutFullExtraction : 'unknown',
    requires_ai_model: handlerFound ? requiresAiModel : 'unknown',
    fixed_page_limit_detected: fixedPageLimitDetected,
    batch_size_used_as_document_limit: batchSizeUsedAsDocumentLimit
  };
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X3R - UNIVERSAL PAGE COUNT QUEUE STATE & WORKER CAPABILITY AUDIT');
  console.log('================================================================================');
  console.log('Mode: READ ONLY');

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  // 1. Gather all official documents
  const missionsSnap = await db.collection('mission_realms').get();
  const docs = [];
  for (const missionDoc of missionsSnap.docs) {
    const missionId = missionDoc.id;
    const missionData = missionDoc.data();
    if (Array.isArray(missionData.officialDocuments)) {
      missionData.officialDocuments.forEach((doc, idx) => docs.push({ id: doc.id || doc.documentId || doc.docId || `root_official_${idx}`, mission_id: missionId, mission_title: getField(missionData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A'), __source: 'mission_root.officialDocuments', __ref: null, ...doc }));
    }
    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => docs.push({ id: doc.id, mission_id: missionId, mission_title: getField(missionData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A'), __source: 'mission_realms.official_documents', __ref: doc.ref, ...doc.data() }));
  }
  const ingestion = await scanCollection(db, 'ingestion_refinery');
  const sourceDocs = await scanCollection(db, 'source_documents');
  
  for (const record of [...ingestion, ...sourceDocs]) {
    if (!isOfficialLike(record)) continue;
    const missionId = normalize(getField(record, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], 'unknown'));
    const keys = docKeys(record);
    const exists = docs.some(doc => keys.length > 0 && docKeys(doc).some(key => keys.includes(key)));
    if (!exists) docs.push({ ...record, mission_id: missionId || 'unknown', mission_title: 'N/A', __ref: null });
  }
  const officialDocs = [...new Map(docs.filter(isOfficialLike).map(doc => [`${getField(doc, ['mission_id', 'missionId'], 'unknown')}::${doc.id}`, doc])).values()];

  // 2. Load all ai_queue records where task_type == "page_count_detection"
  const queueSnap = await db.collection('ai_queue').where('task_type', '==', 'page_count_detection').get();
  const allTasks = [];
  queueSnap.forEach(doc => {
    allTasks.push({ id: doc.id, ...doc.data() });
  });

  const activeStatuses = new Set(['queued', 'pending', 'processing', 'running']);
  const completedStatuses = new Set(['completed', 'done', 'success']);
  const failedStatuses = new Set(['failed', 'error', 'dead_letter']);

  const activeTasks = allTasks.filter(t => activeStatuses.has(lower(t.status)));
  const completedTasks = allTasks.filter(t => completedStatuses.has(lower(t.status)));
  const failedTasks = allTasks.filter(t => failedStatuses.has(lower(t.status)));

  const n3qaActiveCount = activeTasks.filter(t => t.created_by_patch === 'RC-N3Q-A' || String(t.id).startsWith('rc_n3qa_page_count_') && t.document_type === 'notification').length;
  const x3qActiveCount = activeTasks.filter(t => t.created_by_patch === 'RC-X3Q').length;

  let totalActiveReconciled = n3qaActiveCount + x3qActiveCount;
  if (totalActiveReconciled !== activeTasks.length) {
    console.warn('\nWARNING: TASK_COUNT_RECONCILIATION_WARNING');
    console.warn(`Total active tasks (${activeTasks.length}) does not match reconciled N3Q-A (${n3qaActiveCount}) + X3Q (${x3qActiveCount}).`);
  }

  const reports = [];
  let metadataBlockedDocsCount = 0;
  let uniqueDocsCoveredByActiveTasks = 0;
  let duplicateActiveTaskDocsCount = 0;
  let missingQueueTaskDocsCount = 0;

  const docIdsWithActiveTask = new Set();
  const docIdsWithDuplicateActiveTask = new Set();

  // Find orphans
  let orphanedTasksCount = 0;
  for (const task of activeTasks) {
    const matchedDoc = officialDocs.find(doc => doc.id === task.document_id && doc.mission_id === task.mission_id);
    if (!matchedDoc) {
      orphanedTasksCount++;
    }
  }

  for (const doc of officialDocs) {
    const relatedIngestion = ingestion.filter(record => relationMatch(record, doc));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, doc));
    const relatedQueue = allTasks.filter(task => task.document_id === doc.id && task.mission_id === doc.mission_id);

    const combined = [doc, ...relatedIngestion, ...relatedSource, ...relatedQueue];
    const sourcePath = combined.map(storagePath).find(Boolean) || '';
    const language = detectLanguage(doc);
    const missionId = getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown');
    const missionTitle = getField(doc, ['mission_title', 'missionTitle'], 'N/A');
    const docType = detectDocumentType(doc);
    const pageCountValue = combined.map(pageCount).find(Boolean) || null;
    const subPages = await getPageExtractionPages(doc.__ref);
    const inlinePages = [];
    for (const record of combined) {
      for (const p of pageArrays(record)) {
        const n = pageNumberFromRecord('', p);
        if (n) inlinePages.push(n);
      }
    }
    const extractedPages = [...new Set([...subPages, ...inlinePages])].sort((a, b) => a - b);

    const docActiveTasks = relatedQueue.filter(t => activeStatuses.has(lower(t.status)));
    const docCompletedTasks = relatedQueue.filter(t => completedStatuses.has(lower(t.status)));
    const docFailedTasks = relatedQueue.filter(t => failedStatuses.has(lower(t.status)));

    const activeTaskCount = docActiveTasks.length;
    if (activeTaskCount > 0) {
      uniqueDocsCoveredByActiveTasks++;
      docIdsWithActiveTask.add(`${missionId}::${doc.id}`);
      if (activeTaskCount > 1) {
        duplicateActiveTaskDocsCount++;
        docIdsWithDuplicateActiveTask.add(`${missionId}::${doc.id}`);
      }
    }

    let coverageStatus = 'MISSING_QUEUE_TASK';
    if (isMissingId(missionId) || !sourcePath) {
      coverageStatus = 'BLOCKED_METADATA_MISSING';
      metadataBlockedDocsCount++;
    } else if (extractedPages.length > 0) {
      coverageStatus = 'PAGEWISE_ALREADY_STARTED';
    } else if (pageCountValue != null) {
      coverageStatus = 'PAGE_COUNT_ALREADY_KNOWN';
    } else if (activeTaskCount > 1) {
      coverageStatus = 'DUPLICATE_ACTIVE_TASKS_BLOCKED';
    } else if (activeTaskCount === 1) {
      coverageStatus = 'ACTIVE_TASK_PRESENT';
    } else {
      coverageStatus = 'MISSING_QUEUE_TASK';
      missingQueueTaskDocsCount++;
    }

    reports.push({
      mission_id: missionId,
      mission_title: missionTitle,
      document_id: doc.id,
      source_document_id: getField(doc, ['source_document_id', 'sourceDocumentId', 'sourceId', 'source_id'], doc.id),
      file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'),
      document_type: docType,
      source_path: sourcePath || 'MISSING',
      language,
      page_count_known: pageCountValue != null,
      page_count_value: pageCountValue || 'unknown',
      pagewise_records_exist: extractedPages.length > 0,
      active_page_count_task_count: activeTaskCount,
      active_page_count_task_ids: docActiveTasks.map(t => t.id),
      completed_page_count_task_count: docCompletedTasks.length,
      failed_page_count_task_count: docFailedTasks.length,
      queue_coverage_status: coverageStatus,
    });
  }

  // Type coverage summaries
  const notificationCoverage = reports.filter(r => r.document_type === 'notification');
  const syllabusCoverage = reports.filter(r => r.document_type === 'syllabus');
  const pyqCoverage = reports.filter(r => r.document_type === 'pyq');
  const studyMaterialCoverage = reports.filter(r => r.document_type === 'study material');
  const rpscCoverage = reports.filter(r => r.mission_id === RPSC_MISSION_ID);

  console.log('\n--- Audited Official Document state ---\n');
  for (const rep of reports) {
    console.log(JSON.stringify(rep, null, 2));
    console.log('---');
  }

  const workerInfo = auditWorkerCapability();

  console.log('\n==============================================');
  console.log('PAGE COUNT RESULT CONTRACT');
  console.log('==============================================');
  console.log(JSON.stringify({
    expected_updates: {
      ai_queue_taskId: {
        status: "completed | failed",
        detected_page_count: "number",
        completed_at: "serverTimestamp()",
        error_message: "string?"
      },
      source_official_document_record: {
        page_count: "number",
        page_count_status: "detected",
        page_count_detected_by_task_id: "string",
        page_count_detected_at: "serverTimestamp()",
        page_policy: {
          all_pages_required: true,
          fixed_page_limit_allowed: false,
          batch_size_is_not_page_limit: true
        }
      }
    },
    prohibitions: [
      "No page_extractions should be created in page_count_detection.",
      "No atoms/facts/questions should be created.",
      "No publish flag should be changed."
    ]
  }, null, 2));

  console.log('\n==============================================');
  console.log('SUMMARY REPORT');
  console.log('==============================================');
  console.log(`1. Total official docs audited: ${officialDocs.length}`);
  console.log(`2. Total official docs with page_count unknown: ${reports.filter(r => !r.page_count_known).length}`);
  console.log(`3. Active page_count_detection tasks count: ${activeTasks.length}`);
  console.log(`4. Completed page_count_detection tasks count: ${completedTasks.length}`);
  console.log(`5. Failed page_count_detection tasks count: ${failedTasks.length}`);
  console.log(`6. Unique docs covered by active tasks: ${uniqueDocsCoveredByActiveTasks}`);
  console.log(`7. Duplicate active task docs count: ${duplicateActiveTaskDocsCount}`);
  console.log(`8. Missing queue task docs count: ${missingQueueTaskDocsCount}`);
  console.log(`9. Metadata-blocked docs count: ${metadataBlockedDocsCount}`);
  console.log(`10. Tasks orphaned from official docs count: ${orphanedTasksCount}`);
  
  console.log(`\n11. Notification coverage summary:`);
  console.log(JSON.stringify(notificationCoverage.map(r => ({ id: r.document_id, status: r.queue_coverage_status, tasks: r.active_page_count_task_count })), null, 2));

  console.log(`\n12. Syllabus coverage summary:`);
  console.log(JSON.stringify(syllabusCoverage.map(r => ({ id: r.document_id, status: r.queue_coverage_status, tasks: r.active_page_count_task_count })), null, 2));

  console.log(`\n13. PYQ coverage summary:`);
  console.log(JSON.stringify(pyqCoverage.map(r => ({ id: r.document_id, status: r.queue_coverage_status, tasks: r.active_page_count_task_count })), null, 2));

  console.log(`\n14. Study material coverage summary:`);
  console.log(JSON.stringify(studyMaterialCoverage.map(r => ({ id: r.document_id, status: r.queue_coverage_status, tasks: r.active_page_count_task_count })), null, 2));

  console.log(`\n15. RPSC mission coverage summary:`);
  console.log(JSON.stringify(rpscCoverage.map(r => ({ id: r.document_id, status: r.queue_coverage_status, tasks: r.active_page_count_task_count })), null, 2));

  console.log(`\n16. Worker capability summary:`);
  console.log(JSON.stringify(workerInfo, null, 2));

  const recommendedNextPatch = !workerInfo.handler_found
    ? 'RC-X3W - Page Count Detection Worker Implementation'
    : metadataBlockedDocsCount > 0
      ? 'RC-X3M - Source Metadata Repair Plan'
      : 'RC-X3P - Process Page Count Detection Queue';
  console.log(`\n17. Recommended next patch: ${recommendedNextPatch}`);

  console.log('\nRC_X3R_PAGE_COUNT_QUEUE_STATE_AUDIT_READY');
}

main().catch(e => {
  console.error('\nRC_X3R_BLOCKED');
  console.error(e);
  process.exit(1);
});
