const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const { buildPageBatches, pageBatchSizeFor } = require('./extraction_policy');

const PROJECT_ID = 'rankcrackers-55';
const RPSC_MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';
const JEE_MISSION_ID = 'jee_main_2026';
const NEET_MISSION_ID = 'neet_(ug)-2027';

function getAccessToken() {
  try {
    return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error('Authentication Error: Could not get gcloud access token.', error.message);
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
function bool(value) { return value === true || lower(value) === 'true'; }

function storagePath(data) {
  return getField(data, [
    'storagePath', 'storage_path', 'storageRawPath', 'sourcePath', 'source_path',
    'sourceUrl', 'downloadUrl', 'filePath', 'url', 'storageUrl'
  ], '');
}

function pageCount(data) {
  const value = Number(getField(data, ['page_count', 'pageCount', 'totalPages', 'total_pages', 'numPages'], NaN));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function docKeys(doc) {
  return [
    doc.id, doc.documentId, doc.document_id, doc.docId, doc.sourceId, doc.source_id,
    doc.source_document_id, doc.sourceDocumentId, doc.refineryId, doc.fileHash, doc.hash
  ].map(normalize).filter(Boolean);
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
  const hay = [
    explicit, data.syllabus_role, data.syllabusRole, data.pyq_role, data.pyqRole,
    data.notification_role, data.notificationRole, data.file_name, data.fileName, data.name, data.title,
  ].filter(Boolean).join(' ').toLowerCase();

  if (hay.includes('notification')) return 'notification';
  if (hay.includes('syllabus') || hay.includes('paper 1') || hay.includes('paper 2')) return 'syllabus';
  if (hay.includes('pyq') || hay.includes('previous year question paper') || hay.includes('previous year')) return 'pyq';
  if (hay.includes('study material') || hay.includes('study_material')) return 'study material';
  if (hay.includes('amendment') || hay.includes('correction') || hay.includes('corrigendum')) return 'other official document';
  if (hay.includes('notice') || hay.includes('result') || hay.includes('cutoff') || hay.includes('answer key')) return 'other official document';

  const normExplicit = lower(explicit);
  if (['notification', 'syllabus', 'pyq', 'study material', 'other official document'].includes(normExplicit)) return normExplicit;
  if (normExplicit === 'previous year question paper') return 'pyq';
  if (normExplicit === 'other_official_document') return 'other official document';
  return 'other official document';
}

function isOfficialLike(data) {
  const hay = [
    data.document_type, data.documentType, data.document_role, data.documentRole, data.category,
    data.intent, data.syllabus_role, data.pyq_role, data.notification_role, data.file_name,
    data.fileName, data.title, data.name,
  ].filter(Boolean).join(' ').toLowerCase();
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

function getPageCountStatus(records) {
  const status = records.map(record => getField(record, ['page_count_status', 'pageCountStatus'], '')).find(Boolean);
  return status || (records.map(pageCount).find(Boolean) ? 'known' : 'unknown');
}

function getDetectedByTaskId(records) {
  return records.map(record => getField(record, ['page_count_detected_by_task_id', 'pageCountDetectedByTaskId'], '')).find(Boolean) || '';
}

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
    return bool(record.published) || bool(record.isPublished) || bool(record.approved) || bool(record.isApproved) ||
      publishStatus === 'published' || approvalStatus === 'approved';
  });
}

function taskStatusGroups(tasks) {
  const activeStatuses = new Set(['queued', 'pending', 'processing', 'running']);
  const completedStatuses = new Set(['completed', 'done', 'success']);
  const failedStatuses = new Set(['failed', 'error', 'dead_letter']);
  return {
    active: tasks.filter(task => activeStatuses.has(lower(task.status))),
    completed: tasks.filter(task => completedStatuses.has(lower(task.status))),
    failed: tasks.filter(task => failedStatuses.has(lower(task.status))),
  };
}

function failedStorageReason(tasks) {
  const failed = taskStatusGroups(tasks).failed;
  const storageFailure = failed.find(task => /403|storage|download|permission|forbidden|not authorized/i.test(JSON.stringify(task)));
  if (!storageFailure) return null;
  return getField(storageFailure, ['error_message', 'failure_reason', 'error', 'message'], 'storage/download failure');
}

async function scanCollection(db, name) {
  try {
    const snap = await db.collection(name).get();
    const records = [];
    snap.forEach(doc => records.push({ id: doc.id, __source: name, __path: doc.ref.path, ...doc.data() }));
    return records;
  } catch (_) {
    return [];
  }
}

async function getPageExtractionPages(ref) {
  if (!ref) return [];
  try {
    const snap = await ref.collection('page_extractions').get();
    const pages = [];
    snap.forEach(doc => {
      const page = pageNumberFromRecord(doc.id, doc.data());
      if (page) pages.push(page);
    });
    return [...new Set(pages)].sort((a, b) => a - b);
  } catch (_) {
    return [];
  }
}

function missingPagesFromPlan(pageCountValue, batches) {
  const covered = new Set();
  for (const batch of batches) {
    for (let page = batch.page_start; page <= batch.page_end; page++) covered.add(page);
  }
  const missing = [];
  for (let page = 1; page <= pageCountValue; page++) {
    if (!covered.has(page)) missing.push(page);
  }
  return missing;
}

function classify({ missionId, sourcePath, pageCountValue, pageStatus, detectedByTaskId, pagePolicy, pagewiseRecordsCount, publishedOrApproved, relatedTasks, records }) {
  const failedReason = failedStorageReason(relatedTasks);
  const queueExclusionStatus = lower(records.map(record => getField(record, ['queue_exclusion_status', 'queueExclusionStatus'], '')).find(Boolean));
  const missionMissing = isMissingId(missionId);
  const autoDetect = lower(missionId) === 'auto_detect';

  if (queueExclusionStatus === 'excluded_until_mission_created') {
    return { classification: 'EXCLUDED_UNTIL_MISSION_CREATED', blocker_reason: 'excluded_until_mission_created', next_action: 'Founder must create/assign mission before extraction.' };
  }
  if (pagewiseRecordsCount > 0) {
    return { classification: 'ALREADY_PAGEWISE_STARTED', blocker_reason: null, next_action: 'Do not create duplicate pagewise queue tasks.' };
  }
  if (failedReason) {
    return { classification: 'PAGE_COUNT_FAILED_STORAGE_REVIEW', blocker_reason: failedReason, next_action: 'Repair storage access/source path before retrying page count.' };
  }
  if (missionMissing) {
    return { classification: 'METADATA_BLOCKED_FOUNDER_DECISION', blocker_reason: 'mission_id missing or unknown', next_action: 'Founder must assign mission metadata before publish/fact-lock.' };
  }
  if (!sourcePath) {
    return { classification: 'METADATA_BLOCKED_FOUNDER_DECISION', blocker_reason: 'source_path missing', next_action: 'Repair source metadata before extraction.' };
  }
  if (!pageCountValue) {
    return { classification: 'PAGE_COUNT_UNKNOWN_NO_TASK', blocker_reason: 'page_count unknown and no failed storage task found', next_action: 'Queue or repair page count detection first.' };
  }
  if ((taskStatusGroups(relatedTasks).active.length > 1) || (taskStatusGroups(relatedTasks).completed.length > 1 && !detectedByTaskId)) {
    return { classification: 'DUPLICATE_OR_ORPHAN_TASK_REVIEW', blocker_reason: 'multiple related page_count_detection tasks need review', next_action: 'Review duplicate/orphaned task history before extraction.' };
  }
  const pageCountAccepted = lower(pageStatus) === 'detected' || Boolean(detectedByTaskId);
  const policyOk = pagePolicy.all_pages_required === true && pagePolicy.fixed_page_limit_allowed === false && pagePolicy.batch_size_is_not_page_limit === true;
  if (pageCountAccepted && policyOk && pagewiseRecordsCount === 0 && !publishedOrApproved) {
    return {
      classification: 'READY_FOR_PAGEWISE_BATCH_QUEUE',
      blocker_reason: null,
      next_action: autoDetect ? 'Queue pagewise text extraction for visibility only; Founder mission assignment required before publish/fact-lock.' : 'Queue pagewise text extraction batches.',
    };
  }
  return {
    classification: 'PAGE_COUNT_UNKNOWN_NO_TASK',
    blocker_reason: `page_count_status=${pageStatus || 'unknown'}, detected_task=${detectedByTaskId || 'missing'}, policy=${JSON.stringify(pagePolicy)}`,
    next_action: 'Repair page count result metadata before pagewise extraction.',
  };
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X3R2 - FINAL PAGE COUNT RESULT AUDIT & PAGEWISE READINESS CLASSIFICATION');
  console.log('================================================================================');
  console.log('Mode: READ ONLY');

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
    if (Array.isArray(missionData.officialDocuments)) {
      missionData.officialDocuments.forEach((doc, idx) => docs.push({ id: doc.id || doc.documentId || doc.docId || `root_official_${idx}`, mission_id: missionId, mission_title: missionTitle, __source: 'mission_root.officialDocuments', __ref: null, ...doc }));
    }
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
  const queueSnap = await db.collection('ai_queue').where('task_type', '==', 'page_count_detection').get();
  const allTasks = [];
  queueSnap.forEach(doc => allTasks.push({ id: doc.id, ...doc.data() }));
  const globalTaskGroups = taskStatusGroups(allTasks);

  const reports = [];
  const readyBatchPlans = [];
  for (const doc of officialDocs) {
    const relatedIngestion = ingestion.filter(record => relationMatch(record, doc));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, doc));
    const missionId = getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown');
    const relatedQueue = allTasks.filter(task => task.document_id === doc.id && task.mission_id === missionId);
    const records = [doc, ...relatedIngestion, ...relatedSource, ...relatedQueue];
    const sourcePath = records.map(storagePath).find(Boolean) || '';
    const pageCountValue = records.map(pageCount).find(Boolean) || null;
    const pageStatus = getPageCountStatus(records);
    const detectedByTaskId = getDetectedByTaskId(records);
    const pagePolicy = getPagePolicy(records);
    const subPages = await getPageExtractionPages(doc.__ref);
    const inlinePages = [];
    for (const record of records) {
      for (const page of pageArrays(record)) {
        const pageNumber = pageNumberFromRecord('', page);
        if (pageNumber) inlinePages.push(pageNumber);
      }
    }
    const pagewiseRecordsCount = new Set([...subPages, ...inlinePages]).size;
    const taskGroups = taskStatusGroups(relatedQueue);
    const failedTask = taskGroups.failed[0] || null;
    const classification = classify({
      missionId,
      sourcePath,
      pageCountValue,
      pageStatus,
      detectedByTaskId,
      pagePolicy,
      pagewiseRecordsCount,
      publishedOrApproved: isPublishedOrApproved(records),
      relatedTasks: relatedQueue,
      records,
    });

    let batchPreview = null;
    if (classification.classification === 'READY_FOR_PAGEWISE_BATCH_QUEUE' && pageCountValue) {
      const batches = buildPageBatches(pageCountValue);
      const missingPages = missingPagesFromPlan(pageCountValue, batches);
      batchPreview = {
        page_count: pageCountValue,
        proposed_pagewise_batch_count: batches.length,
        batch_ranges: batches.map(batch => `${batch.page_start}-${batch.page_end}`),
        batch_size_policy_used: pageBatchSizeFor(pageCountValue),
        all_pages_covered: missingPages.length === 0,
        missing_page_numbers_in_plan: missingPages,
      };
      readyBatchPlans.push(batchPreview);
    }

    reports.push({
      mission_id: missionId,
      mission_title: getField(doc, ['mission_title', 'missionTitle'], missionTitleById.get(missionId) || 'N/A'),
      document_id: doc.id,
      source_document_id: getField(doc, ['source_document_id', 'sourceDocumentId', 'sourceId', 'source_id'], doc.id),
      file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'),
      document_type: detectDocumentType(doc),
      source_path: sourcePath || 'MISSING',
      language: detectLanguage(doc),
      page_count: pageCountValue || 'unknown',
      page_count_status: pageStatus,
      page_count_detected_by_task_id: detectedByTaskId || 'missing',
      page_policy: pagePolicy,
      active_page_count_task_count: taskGroups.active.length,
      completed_page_count_task_count: taskGroups.completed.length,
      failed_page_count_task_count: taskGroups.failed.length,
      failed_task_id: failedTask ? failedTask.id : null,
      failed_reason: failedTask ? getField(failedTask, ['error_message', 'failure_reason', 'error', 'message'], null) : null,
      pagewise_records_count: pagewiseRecordsCount,
      ready_for_pagewise_batch_queue: classification.classification === 'READY_FOR_PAGEWISE_BATCH_QUEUE',
      classification: classification.classification,
      blocker_reason: classification.blocker_reason,
      next_action: classification.next_action,
      requires_founder_mission_assignment_before_publish: lower(missionId) === 'auto_detect',
      pagewise_batch_preview: batchPreview,
    });
  }

  const officialKeys = new Set(officialDocs.map(doc => `${getField(doc, ['mission_id', 'missionId'], 'unknown')}::${doc.id}`));
  const orphanedTasks = allTasks.filter(task => !officialKeys.has(`${task.mission_id}::${task.document_id}`));
  const byType = reports.reduce((acc, report) => {
    acc[report.document_type] = (acc[report.document_type] || 0) + 1;
    return acc;
  }, {});
  const countClass = name => reports.filter(report => report.classification === name).length;
  const docsByMission = missionId => reports.filter(report => report.mission_id === missionId).map(report => ({
    document_id: report.document_id,
    file_name: report.file_name,
    type: report.document_type,
    page_count: report.page_count,
    classification: report.classification,
  }));
  const totalExpectedPagesCovered = readyBatchPlans.reduce((sum, plan) => sum + plan.page_count, 0);
  const largestDocPageCount = readyBatchPlans.reduce((max, plan) => Math.max(max, plan.page_count), 0);
  const anyMissingPages = readyBatchPlans.some(plan => plan.missing_page_numbers_in_plan.length > 0);
  const readyCount = countClass('READY_FOR_PAGEWISE_BATCH_QUEUE');
  const failedStorageCount = countClass('PAGE_COUNT_FAILED_STORAGE_REVIEW');
  const metadataBlockedCount = countClass('METADATA_BLOCKED_FOUNDER_DECISION');
  const recommendedNextPatch = readyCount > 0 ? 'RC-X4Q - Queue Pagewise Text Extraction Batches' : failedStorageCount > 0 ? 'RC-X3S - Failed Storage Repair' : metadataBlockedCount > 0 ? 'RC-X3D - Founder Metadata Decisions' : 'NO_PAGEWISE_QUEUE_ACTION_REQUIRED';

  console.log('\n--- Per document final audit ---');
  for (const report of reports) {
    console.log(JSON.stringify(report, null, 2));
    console.log('---');
  }

  console.log('\n==============================================');
  console.log('FINAL PAGE COUNT SUMMARY');
  console.log('==============================================');
  console.log(`1. Total docs audited: ${reports.length}`);
  console.log(`2. Page count known: ${reports.filter(report => report.page_count !== 'unknown').length}`);
  console.log(`3. Page count unknown: ${reports.filter(report => report.page_count === 'unknown').length}`);
  console.log(`4. Completed tasks: ${globalTaskGroups.completed.length}`);
  console.log(`5. Failed tasks: ${globalTaskGroups.failed.length}`);
  console.log(`6. Active tasks: ${globalTaskGroups.active.length}`);
  console.log(`7. Orphaned tasks: ${orphanedTasks.length}`);
  console.log(`8. Ready for pagewise batch queue count: ${readyCount}`);
  console.log(`9. Page count failed storage review count: ${failedStorageCount}`);
  console.log(`10. Metadata blocked founder decision count: ${metadataBlockedCount}`);
  console.log(`11. Excluded until mission created: ${countClass('EXCLUDED_UNTIL_MISSION_CREATED')}`);
  console.log(`12. Pagewise already started count: ${countClass('ALREADY_PAGEWISE_STARTED')}`);
  console.log(`13. Count by doc type: ${JSON.stringify(byType)}`);
  console.log(`14. RPSC summary: ${JSON.stringify(docsByMission(RPSC_MISSION_ID), null, 2)}`);
  console.log(`15. JEE summary: ${JSON.stringify(docsByMission(JEE_MISSION_ID), null, 2)}`);
  console.log(`16. NEET summary: ${JSON.stringify(docsByMission(NEET_MISSION_ID), null, 2)}`);
  console.log(`17. AUTO_DETECT/RAS summary: ${JSON.stringify(reports.filter(report => lower(report.mission_id) === 'auto_detect' || /ras/i.test(report.file_name)), null, 2)}`);
  console.log(`18. Pagewise batch preview summary: ${JSON.stringify({ total_proposed_tasks: readyBatchPlans.reduce((sum, plan) => sum + plan.proposed_pagewise_batch_count, 0), total_expected_pages_covered: totalExpectedPagesCovered, largest_doc_page_count: largestDocPageCount, any_missing_pages: anyMissingPages }, null, 2)}`);
  console.log(`19. Recommended next patch: ${recommendedNextPatch}`);
  console.log('20. Final verdict: RC_X3R2_FINAL_PAGE_COUNT_RESULT_AUDIT_READY');
  console.log('\nRC_X3R2_FINAL_PAGE_COUNT_RESULT_AUDIT_READY');
}

main().catch(error => {
  console.error('\nRC_X3R2_BLOCKED');
  console.error(error);
  process.exit(1);
});
