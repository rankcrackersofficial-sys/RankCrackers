const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const {
  buildPageBatches,
  PAGE_BATCH_SIZE_DEFAULT,
  PAGE_BATCH_SIZE_LARGE_DOC,
  LARGE_DOCUMENT_PAGE_THRESHOLD,
  MAX_RETRY_PER_BATCH,
  pageBatchSizeFor,
} = require('./extraction_policy');

const PROJECT_ID = 'rankcrackers-55';
const RPSC_MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';
const JEE_MISSION_ID = 'jee_main_2026';
const NEET_MISSION_ID = 'neet_(ug)-2027';
const CONFIRMATION = 'CONFIRM_QUEUE_UNIVERSAL_PAGEWISE_EXTRACTION';

function parseArgs(argv) {
  const applyIndex = argv.indexOf('--apply');
  const isDryRun = argv.includes('--dry-run') || applyIndex === -1;
  const confirmation = applyIndex >= 0 ? argv[applyIndex + 1] : '';
  const isApplyMode = applyIndex >= 0 && confirmation === CONFIRMATION;
  return { isDryRun, isApplyMode, confirmation, applyRequested: applyIndex >= 0 };
}

const cli = parseArgs(process.argv.slice(2));

function getAccessToken() {
  try { return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim(); }
  catch (error) {
    console.error('Authentication Error: Could not get gcloud access token.', error.message);
    process.exit(1);
  }
}

function getField(data, keys, fallback = null) {
  for (const key of keys) if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
  return fallback;
}
function normalize(value) { return String(value || '').trim(); }
function lower(value) { return normalize(value).toLowerCase(); }
function isMissingId(value) { return !value || ['unknown', 'n/a', 'null', 'undefined'].includes(lower(value)); }
function bool(value) { return value === true || lower(value) === 'true'; }

function storagePath(data) {
  return getField(data, ['storagePath', 'storage_path', 'storageRawPath', 'sourcePath', 'source_path', 'sourceUrl', 'downloadUrl', 'filePath', 'url', 'storageUrl'], '');
}

function pageCount(data) {
  const value = Number(getField(data, ['page_count', 'pageCount', 'totalPages', 'total_pages', 'numPages'], NaN));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function docKeys(doc) {
  return [doc.id, doc.documentId, doc.document_id, doc.docId, doc.sourceId, doc.source_id, doc.source_document_id, doc.sourceDocumentId, doc.refineryId, doc.fileHash, doc.hash].map(normalize).filter(Boolean);
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
  const explicit = getField(data, ['document_type', 'documentType', 'type', 'category', 'document_role', 'documentRole', 'intent'], '');
  const hay = [explicit, data.syllabus_role, data.syllabusRole, data.pyq_role, data.pyqRole, data.notification_role, data.notificationRole, data.file_name, data.fileName, data.name, data.title].filter(Boolean).join(' ').toLowerCase();
  if (hay.includes('notification')) return 'notification';
  if (hay.includes('syllabus') || hay.includes('paper 1') || hay.includes('paper 2')) return 'syllabus';
  if (hay.includes('pyq') || hay.includes('previous year question paper') || hay.includes('previous year')) return 'pyq';
  if (hay.includes('study material') || hay.includes('study_material')) return 'study material';
  const normExplicit = lower(explicit);
  if (['notification', 'syllabus', 'pyq', 'study material', 'other official document'].includes(normExplicit)) return normExplicit;
  if (normExplicit === 'previous year question paper') return 'pyq';
  if (normExplicit === 'other_official_document') return 'other official document';
  return 'other official document';
}

function isOfficialLike(data) {
  const hay = [data.document_type, data.documentType, data.document_role, data.documentRole, data.category, data.intent, data.syllabus_role, data.pyq_role, data.notification_role, data.file_name, data.fileName, data.title, data.name].filter(Boolean).join(' ').toLowerCase();
  return /official|notification|notice|syllabus|pyq|study material|paper|document|pdf|book|result|cutoff|answer key/i.test(hay);
}

function pageNumberFromRecord(id, data) {
  const direct = Number(getField(data, ['page_number', 'pageNumber', 'page', 'number', 'source_page_number', 'sourcePageNumber'], NaN));
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const fromId = String(id || '').match(/(\d+)$/);
  return fromId ? Number(fromId[1]) : null;
}

function pageArrays(data) {
  const pages = [];
  for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages', 'pageWiseExtraction']) if (Array.isArray(data[key])) pages.push(...data[key]);
  for (const parent of ['aiResult', 'rawData', 'result', 'extraction']) {
    if (data[parent] && typeof data[parent] === 'object') {
      for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages']) if (Array.isArray(data[parent][key])) pages.push(...data[parent][key]);
    }
  }
  return pages;
}

function getPageCountStatus(records) {
  const status = records.map(record => getField(record, ['page_count_status', 'pageCountStatus'], '')).find(Boolean);
  return status || (records.map(pageCount).find(Boolean) ? 'known' : 'unknown');
}

function getDetectedByTaskId(records) { return records.map(record => getField(record, ['page_count_detected_by_task_id', 'pageCountDetectedByTaskId'], '')).find(Boolean) || ''; }

function getPagePolicy(records) {
  const policy = records.map(record => getField(record, ['page_policy', 'pagePolicy'], null)).find(value => value && typeof value === 'object') || {};
  return {
    all_pages_required: bool(policy.all_pages_required ?? policy.allPagesRequired),
    fixed_page_limit_allowed: bool(policy.fixed_page_limit_allowed ?? policy.fixedPageLimitAllowed),
    batch_size_is_not_page_limit: bool(policy.batch_size_is_not_page_limit ?? policy.batchSizeIsNotPageLimit),
  };
}

function isPublishedOrApproved(records) {
  return records.some(record => {
    const publishStatus = lower(getField(record, ['publish_status', 'publishStatus'], ''));
    const approvalStatus = lower(getField(record, ['approval_status', 'approvalStatus'], ''));
    return bool(record.published) || bool(record.isPublished) || bool(record.approved) || bool(record.isApproved) || publishStatus === 'published' || approvalStatus === 'approved';
  });
}

function taskStatusGroups(tasks) {
  const activeStatuses = new Set(['queued', 'pending', 'processing', 'running']);
  const completedStatuses = new Set(['completed', 'done', 'success']);
  const failedStatuses = new Set(['failed', 'error', 'dead_letter']);
  return {
    active: tasks.filter(task => activeStatuses.has(lower(task.status))),
    completed: tasks.filter(task => completedStatuses.has(lower(task.status))),
    failed: tasks.filter(task => failedStatuses.has(lower(task.status)))
  };
}

function failedStorageReason(tasks) {
  const storageFailure = taskStatusGroups(tasks).failed.find(task => /403|storage|download|permission|forbidden|not authorized/i.test(JSON.stringify(task)));
  return storageFailure ? getField(storageFailure, ['error_message', 'failure_reason', 'error', 'message'], 'storage/download failure') : null;
}

async function scanCollection(db, name) {
  try {
    const snap = await db.collection(name).get();
    const records = [];
    snap.forEach(doc => records.push({ id: doc.id, __source: name, __path: doc.ref.path, ...doc.data() }));
    return records;
  } catch (_) { return []; }
}

async function getPageExtractionPages(ref) {
  if (!ref) return [];
  try {
    const snap = await ref.collection('page_extractions').get();
    const pages = [];
    snap.forEach(doc => { const page = pageNumberFromRecord(doc.id, doc.data()); if (page) pages.push(page); });
    return [...new Set(pages)].sort((a, b) => a - b);
  } catch (_) { return []; }
}

function coverageFor(pageCountValue, batches) {
  const seen = new Map();
  const duplicatePages = [];
  const outOfRangePages = [];
  for (const batch of batches) {
    for (let page = batch.page_start; page <= batch.page_end; page++) {
      if (page < 1 || page > pageCountValue) outOfRangePages.push(page);
      const count = seen.get(page) || 0;
      if (count > 0) duplicatePages.push(page);
      seen.set(page, count + 1);
    }
  }
  const missingPages = [];
  for (let page = 1; page <= pageCountValue; page++) if (!seen.has(page)) missingPages.push(page);
  return {
    expected_pages_count: pageCountValue,
    planned_pages_count: [...seen.keys()].filter(page => page >= 1 && page <= pageCountValue).length,
    all_pages_covered: missingPages.length === 0 && duplicatePages.length === 0 && outOfRangePages.length === 0,
    missing_pages: missingPages,
    duplicate_pages: [...new Set(duplicatePages)],
    out_of_range_pages: [...new Set(outOfRangePages)]
  };
}

function baseSummary() { return { docs_planned: 0, batches_planned: 0, pages_covered: 0, blockers: [] }; }
function addPlanned(summary, docPlan) { summary.docs_planned += 1; summary.batches_planned += docPlan.batches.length; summary.pages_covered += docPlan.coverage.planned_pages_count; }
function addBlocker(summary, blocker) { summary.blockers.push(blocker); }

function selectBlocker({ missionId, sourcePath, pageCountValue, pageStatus, detectedByTaskId, pagePolicy, pagewiseRecordsCount, publishedOrApproved, relatedPageCountTasks, records }) {
  const queueExclusionStatus = lower(records.map(record => getField(record, ['queue_exclusion_status', 'queueExclusionStatus'], '')).find(Boolean));
  const failedReason = failedStorageReason(relatedPageCountTasks);
  if (queueExclusionStatus === 'excluded_until_mission_created') return 'excluded_until_mission_created';
  if (pagewiseRecordsCount > 0) return 'pagewise_extraction_already_started';
  if (failedReason) return `failed_storage_review: ${failedReason}`;
  if (isMissingId(missionId)) return 'mission_id missing or unknown';
  if (!sourcePath) return 'source_path missing';
  if (!pageCountValue) return 'page_count missing';
  if (!(lower(pageStatus) === 'detected' || detectedByTaskId)) return `page_count result not detected: ${pageStatus || 'unknown'}`;
  if (!(pagePolicy.all_pages_required === true && pagePolicy.fixed_page_limit_allowed === false && pagePolicy.batch_size_is_not_page_limit === true)) return `page_policy not ready: ${JSON.stringify(pagePolicy)}`;
  if (publishedOrApproved) return 'already published or approved';
  return null;
}

function makeTask({ doc, batch, totalBatches }) {
  const autoDetect = lower(doc.mission_id) === 'auto_detect';
  return {
    task_type: 'pagewise_text_extraction_batch',
    mission_id: doc.mission_id,
    document_id: doc.document_id,
    source_document_id: doc.source_document_id,
    document_type: doc.document_type,
    source_path: doc.source_path,
    language: doc.language,
    page_start: batch.page_start,
    page_end: batch.page_end,
    page_batch_index: batch.page_batch_index,
    total_batches: totalBatches,
    status: 'queued',
    priority: 'normal',
    retry_count: 0,
    max_retry: MAX_RETRY_PER_BATCH,
    expected_output: 'page_extractions',
    dry_run: false,
    created_by_patch: 'RC-X4A',
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
    page_policy: { all_pages_required: true, fixed_page_limit_allowed: false, batch_size_is_not_page_limit: true },
    ...(autoDetect ? { requires_founder_mission_assignment_before_publish: true, auto_detect_routing_only: true } : {}),
  };
}

function activeDuplicateFor(activePagewiseTasks, task) {
  return activePagewiseTasks.find(existing =>
    existing.mission_id === task.mission_id &&
    existing.document_id === task.document_id &&
    Number(existing.page_start) === Number(task.page_start) &&
    Number(existing.page_end) === Number(task.page_end)
  );
}

function completedDuplicateFor(completedPagewiseTasks, task) {
  return completedPagewiseTasks.find(existing =>
    existing.mission_id === task.mission_id &&
    existing.document_id === task.document_id &&
    Number(existing.page_start) === Number(task.page_start) &&
    Number(existing.page_end) === Number(task.page_end)
  );
}

function summarizeByMission(plans, blockers, missionId) {
  const summary = baseSummary();
  plans.filter(plan => plan.mission_id === missionId).forEach(plan => addPlanned(summary, plan));
  blockers.filter(blocker => blocker.mission_id === missionId).forEach(blocker => addBlocker(summary, blocker));
  return summary;
}

function safeId(id) {
  return String(id || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X4A - APPLY UNIVERSAL PAGEWISE EXTRACTION QUEUE');
  console.log('================================================================================');
  console.log(`Mode: ${cli.isApplyMode ? 'APPLY' : 'DRY-RUN'}`);

  if (cli.applyRequested && !cli.isApplyMode) {
    console.log(`Apply mode locked. Required exact command: node functions/apply_universal_pagewise_extraction_queue.js --apply ${CONFIRMATION}`);
  }

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  const missionsSnap = await db.collection('mission_realms').get();
  const docs = [];
  const missionTitleById = new Map();
  for (const missionDoc of missionsSnap.docs) {
    const missionId = missionDoc.id;
    const missionData = missionDoc.data();
    const missionTitle = getField(missionData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A');
    missionTitleById.set(missionId, missionTitle);
    if (Array.isArray(missionData.officialDocuments)) missionData.officialDocuments.forEach((doc, idx) => docs.push({ id: doc.id || doc.documentId || doc.docId || `root_official_${idx}`, mission_id: missionId, mission_title: missionTitle, __source: 'mission_root.officialDocuments', __ref: null, ...doc }));
    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => docs.push({ id: doc.id, mission_id: missionId, mission_title: missionTitle, __source: 'mission_realms.official_documents', __ref: doc.ref, ...doc.data() }));
  }

  const ingestion = await scanCollection(db, 'ingestion_refinery');
  const sourceDocs = await scanCollection(db, 'source_documents');
  for (const record of [...ingestion, ...sourceDocs]) {
    if (!isOfficialLike(record)) continue;
    const missionId = normalize(getField(record, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], 'unknown')) || 'unknown';
    const keys = docKeys(record);
    const exists = docs.some(doc => keys.length > 0 && docKeys(doc).some(key => keys.includes(key)));
    if (!exists) docs.push({ ...record, mission_id: missionId, mission_title: missionTitleById.get(missionId) || 'N/A', __ref: null });
  }

  const officialDocs = [...new Map(docs.filter(isOfficialLike).map(doc => [`${getField(doc, ['mission_id', 'missionId'], 'unknown')}::${doc.id}`, doc])).values()];

  const pageCountSnap = await db.collection('ai_queue').where('task_type', '==', 'page_count_detection').get();
  const pageCountTasks = [];
  pageCountSnap.forEach(doc => pageCountTasks.push({ id: doc.id, ...doc.data() }));

  const pagewiseSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const pagewiseTasks = [];
  pagewiseSnap.forEach(doc => pagewiseTasks.push({ id: doc.id, ...doc.data() }));

  const { active: activePagewiseTasks, completed: completedPagewiseTasks } = taskStatusGroups(pagewiseTasks);

  const plannedDocs = [];
  const blockedDocs = [];
  const tasksToCreate = [];
  const activeDuplicateFound = [];
  const completedDuplicateFound = [];

  for (const doc of officialDocs) {
    const missionId = getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown');
    const relatedIngestion = ingestion.filter(record => relationMatch(record, doc));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, doc));
    const relatedPageCountTasks = pageCountTasks.filter(task => task.document_id === doc.id && task.mission_id === missionId);
    const records = [doc, ...relatedIngestion, ...relatedSource, ...relatedPageCountTasks];

    const sourcePath = records.map(storagePath).find(Boolean) || '';
    const pageCountValue = records.map(pageCount).find(Boolean) || null;
    const pageStatus = getPageCountStatus(records);
    const detectedByTaskId = getDetectedByTaskId(records);
    const pagePolicy = getPagePolicy(records);

    const subPages = await getPageExtractionPages(doc.__ref);
    const inlinePages = [];
    for (const record of records) for (const page of pageArrays(record)) { const pageNumber = pageNumberFromRecord('', page); if (pageNumber) inlinePages.push(pageNumber); }
    const pagewiseRecordsCount = new Set([...subPages, ...inlinePages]).size;

    const planDoc = { mission_id: missionId, mission_title: getField(doc, ['mission_title', 'missionTitle'], missionTitleById.get(missionId) || 'N/A'), document_id: doc.id, source_document_id: getField(doc, ['source_document_id', 'sourceDocumentId', 'sourceId', 'source_id'], doc.id), file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'), document_type: detectDocumentType(doc), source_path: sourcePath, language: detectLanguage(doc), page_count: pageCountValue, page_count_status: pageStatus, page_count_detected_by_task_id: detectedByTaskId, page_policy: pagePolicy };

    const blocker = selectBlocker({ missionId, sourcePath, pageCountValue, pageStatus, detectedByTaskId, pagePolicy, pagewiseRecordsCount, publishedOrApproved: isPublishedOrApproved(records), relatedPageCountTasks, records });
    if (blocker) { blockedDocs.push({ ...planDoc, blocker_reason: blocker }); continue; }

    const batches = buildPageBatches(pageCountValue);
    const coverage = coverageFor(pageCountValue, batches);

    if (!coverage.all_pages_covered) {
      console.error(`PAGE_COVERAGE_FAILED for ${doc.id}`);
      blockedDocs.push({ ...planDoc, blocker_reason: 'coverage validation failed', coverage });
      continue;
    }

    const docTasks = [];
    for (const batch of batches) {
      const task = makeTask({ doc: planDoc, batch, totalBatches: batches.length });
      const activeDuplicate = activeDuplicateFor(activePagewiseTasks, task);
      const completedDuplicate = completedDuplicateFor(completedPagewiseTasks, task);

      if (activeDuplicate) {
        activeDuplicateFound.push({ task_id: activeDuplicate.id, mission_id: task.mission_id, document_id: task.document_id, page_start: task.page_start, page_end: task.page_end });
      } else if (completedDuplicate) {
        completedDuplicateFound.push({ task_id: completedDuplicate.id, mission_id: task.mission_id, document_id: task.document_id, page_start: task.page_start, page_end: task.page_end });
      } else {
        docTasks.push(task);
      }
    }

    tasksToCreate.push(...docTasks);
    plannedDocs.push({ ...planDoc, batches, coverage, tasks_created: docTasks.length, batch_size_policy_used: pageBatchSizeFor(pageCountValue) });
  }

  // Final Coverage Validation before Apply
  const anyCoverageFailed = plannedDocs.some(doc => !doc.coverage.all_pages_covered);
  if (anyCoverageFailed) {
    console.error('\nRC_X4A_APPLY_BLOCKED_PAGE_COVERAGE_FAILED');
    process.exit(1);
  }

  const byType = { notification: baseSummary(), syllabus: baseSummary(), pyq: baseSummary(), 'study material': baseSummary(), 'other official document': baseSummary() };
  for (const plan of plannedDocs) addPlanned(byType[plan.document_type] || byType['other official document'], plan);
  for (const blocker of blockedDocs) addBlocker(byType[blocker.document_type] || byType['other official document'], { document_id: blocker.document_id, file_name: blocker.file_name, mission_id: blocker.mission_id, reason: blocker.blocker_reason });

  const totalExpectedPages = plannedDocs.reduce((sum, doc) => sum + doc.page_count, 0);
  const totalPlannedPages = plannedDocs.reduce((sum, doc) => sum + doc.coverage.planned_pages_count, 0);
  const missingPagesCount = plannedDocs.reduce((sum, doc) => sum + doc.coverage.missing_pages.length, 0);
  const duplicatePagesCount = plannedDocs.reduce((sum, doc) => sum + doc.coverage.duplicate_pages.length, 0);
  const largestDocPageCount = plannedDocs.reduce((max, doc) => Math.max(max, doc.page_count), 0);

  const rpscSummary = summarizeByMission(plannedDocs, blockedDocs, RPSC_MISSION_ID);
  const jeeSummary = summarizeByMission(plannedDocs, blockedDocs, JEE_MISSION_ID);
  const neetSummary = summarizeByMission(plannedDocs, blockedDocs, NEET_MISSION_ID);
  const autoDetectSummary = summarizeByMission(plannedDocs, blockedDocs, 'AUTO_DETECT');

  if (cli.isApplyMode) {
    console.log('Confirmation phrase accepted.');
    const batch = db.batch();
    const createdTaskIds = [];

    for (const task of tasksToCreate) {
      const taskId = `rc_x4a_pagewise_${safeId(task.mission_id)}_${safeId(task.document_id)}_b${task.page_batch_index}_p${task.page_start}_${task.page_end}`;
      const taskRef = db.collection('ai_queue').doc(taskId);
      batch.set(taskRef, task);
      createdTaskIds.push(taskId);
    }

    if (tasksToCreate.length > 0) {
      await batch.commit();
    }

    console.log(`\n1. Tasks created count: ${tasksToCreate.length}`);
    console.log(`2. Duplicate skipped count: ${activeDuplicateFound.length}`);
    console.log(`3. Completed duplicate skipped count: ${completedDuplicateFound.length}`);
    console.log(`4. Blocked docs count: ${blockedDocs.length}`);
    console.log(`5. Created task IDs:`, createdTaskIds);
    console.log(`6. Count by document type:`, JSON.stringify(byType, null, 2));
    console.log(`7. Expected total pages covered: ${totalExpectedPages}`);
    console.log(`8. Planned total pages covered: ${totalPlannedPages}`);
    console.log(`9. Missing pages count: ${missingPagesCount}`);
    console.log(`10. Duplicate planned pages count: ${duplicatePagesCount}`);
    console.log(`11. RPSC created task summary:`, JSON.stringify(rpscSummary, null, 2));
    console.log(`12. JEE created task summary:`, JSON.stringify(jeeSummary, null, 2));
    console.log(`13. NEET created task summary:`, JSON.stringify(neetSummary, null, 2));
    console.log(`14. AUTO_DETECT/RAS created task summary:`, JSON.stringify(autoDetectSummary, null, 2));
    console.log(`15. Confirmation: Firestore writes only to ai_queue.`);
    console.log('\nRC_X4A_PAGEWISE_BATCH_QUEUE_APPLIED_READY');

  } else {
    console.log(`\n1. Total official docs scanned: ${officialDocs.length}`);
    console.log(`2. Docs ready for pagewise queue: ${plannedDocs.length}`);
    console.log(`3. Docs blocked: ${blockedDocs.length}`);
    console.log(`4. Proposed tasks count: ${plannedDocs.reduce((sum, doc) => sum + doc.batches.length, 0)}`);
    console.log(`5. Duplicate active tasks found: ${activeDuplicateFound.length}`);
    console.log(`6. Tasks that would be created count: ${tasksToCreate.length}`);
    console.log(`7. Expected total pages covered: ${totalExpectedPages}`);
    console.log(`8. Planned total pages covered: ${totalPlannedPages}`);
    console.log(`9. Missing pages count: ${missingPagesCount}`);
    console.log(`10. Duplicate planned pages count: ${duplicatePagesCount}`);
    console.log(`11. Largest document page count: ${largestDocPageCount}`);
    console.log(`12. Count by document type:`, JSON.stringify(byType, null, 2));
    console.log(`13. RPSC summary:`, JSON.stringify(rpscSummary, null, 2));
    console.log(`14. JEE summary:`, JSON.stringify(jeeSummary, null, 2));
    console.log(`15. NEET summary:`, JSON.stringify(neetSummary, null, 2));
    console.log(`16. AUTO_DETECT/RAS summary:`, JSON.stringify(autoDetectSummary, null, 2));
    console.log(`17. Confirmation:`);
    console.log('    - no writes in dry-run');
    console.log('    - no extraction run');
    console.log('    - no AI/OCR');
    console.log('    - no page_extractions created');

    if (tasksToCreate.length > 0 || activeDuplicateFound.length > 0) {
      console.log('\nRC_X4A_DRY_RUN_READY');
    } else {
      console.log('\nRC_X4A_DRY_RUN_BLOCKED: No tasks to create and no active duplicates.');
    }
  }
}

main().catch(error => {
  console.error(cli.isApplyMode ? '\nRC_X4A_APPLY_BLOCKED' : '\nRC_X4A_DRY_RUN_BLOCKED');
  console.error(error);
  process.exit(1);
});
