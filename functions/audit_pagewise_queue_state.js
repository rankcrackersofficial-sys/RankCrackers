const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';

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
function lower(value) { return String(value || '').trim().toLowerCase(); }
function bool(value) { return value === true || lower(value) === 'true'; }

function pageCount(data) {
  const value = Number(getField(data, ['page_count', 'pageCount', 'totalPages', 'total_pages', 'numPages'], NaN));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function storagePath(data) {
  return getField(data, ['storagePath', 'storage_path', 'storageRawPath', 'sourcePath', 'source_path', 'sourceUrl', 'downloadUrl', 'filePath', 'url', 'storageUrl'], '');
}

function docKeys(doc) {
  return [doc.id, doc.documentId, doc.document_id, doc.docId, doc.sourceId, doc.source_id, doc.source_document_id, doc.sourceDocumentId, doc.refineryId, doc.fileHash, doc.hash].map(v => String(v || '').trim()).filter(Boolean);
}

function relationMatch(record, doc) {
  const keys = docKeys(doc);
  const recordKeys = docKeys(record);
  if (keys.some(key => recordKeys.includes(key) || record.id === key)) return true;
  const docPath = storagePath(doc);
  const recordPath = storagePath(record);
  return Boolean(docPath && recordPath && (docPath === recordPath || docPath.endsWith(recordPath) || recordPath.endsWith(docPath)));
}

function detectDocumentType(data) {
  const explicit = getField(data, ['document_type', 'documentType', 'type', 'category', 'document_role', 'documentRole', 'intent'], '');
  const hay = [explicit, data.syllabus_role, data.syllabusRole, data.pyq_role, data.pyqRole, data.notification_role, data.notificationRole, data.file_name, data.fileName, data.name, data.title].filter(Boolean).join(' ').toLowerCase();
  if (hay.includes('notification')) return 'notification';
  if (hay.includes('syllabus') || hay.includes('paper 1') || hay.includes('paper 2')) return 'syllabus';
  if (hay.includes('pyq') || hay.includes('previous year question paper') || hay.includes('previous year')) return 'pyq';
  if (hay.includes('study material') || hay.includes('study_material')) return 'study material';
  return 'other official document';
}

function isOfficialLike(data) {
  const hay = [data.document_type, data.documentType, data.document_role, data.documentRole, data.category, data.intent, data.syllabus_role, data.pyq_role, data.notification_role, data.file_name, data.fileName, data.title, data.name].filter(Boolean).join(' ').toLowerCase();
  return /official|notification|notice|syllabus|pyq|study material|paper|document|pdf|book|result|cutoff|answer key/i.test(hay);
}

function isPublishedOrApproved(records) {
  return records.some(record => {
    const publishStatus = lower(getField(record, ['publish_status', 'publishStatus'], ''));
    const approvalStatus = lower(getField(record, ['approval_status', 'approvalStatus'], ''));
    return bool(record.published) || bool(record.isPublished) || bool(record.approved) || bool(record.isApproved) || publishStatus === 'published' || approvalStatus === 'approved';
  });
}

async function scanCollection(db, name) {
  try {
    const snap = await db.collection(name).get();
    const records = [];
    snap.forEach(doc => records.push({ id: doc.id, __source: name, __path: doc.ref.path, ...doc.data() }));
    return records;
  } catch (_) { return []; }
}

function validateTaskShape(task) {
  const required = [
    'task_type', 'mission_id', 'document_id', 'source_document_id', 'document_type',
    'source_path', 'language', 'page_start', 'page_end', 'page_batch_index',
    'total_batches', 'status', 'priority', 'retry_count', 'max_retry', 'expected_output'
  ];
  const missing = required.filter(k => task[k] === undefined || task[k] === null || task[k] === '');

  const shapeBlockers = [];
  if (task.task_type !== 'pagewise_text_extraction_batch') shapeBlockers.push('invalid task_type');
  if (task.expected_output !== 'page_extractions') shapeBlockers.push('invalid expected_output');
  if (task.created_by_patch !== 'RC-X4A') shapeBlockers.push('missing or invalid created_by_patch');

  const policy = task.page_policy || {};
  if (!bool(policy.all_pages_required)) shapeBlockers.push('page_policy.all_pages_required must be true');
  if (bool(policy.fixed_page_limit_allowed)) shapeBlockers.push('page_policy.fixed_page_limit_allowed must be false');
  if (!bool(policy.batch_size_is_not_page_limit)) shapeBlockers.push('page_policy.batch_size_is_not_page_limit must be true');

  if (lower(task.mission_id) === 'auto_detect') {
    if (!bool(task.requires_founder_mission_assignment_before_publish)) shapeBlockers.push('AUTO_DETECT requires_founder_mission_assignment_before_publish must be true');
    if (!bool(task.auto_detect_routing_only)) shapeBlockers.push('AUTO_DETECT auto_detect_routing_only must be true');
  }

  return { valid: missing.length === 0 && shapeBlockers.length === 0, missing, shapeBlockers };
}

async function main() {
  console.log('==============================================');
  console.log('PATCH RC-X4R - PAGEWISE QUEUE STATE AUDIT');
  console.log('==============================================');
  console.log('Mode: READ ONLY');

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  // 1. Fetch Pagewise Tasks
  const pagewiseSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const pagewiseTasks = [];
  pagewiseSnap.forEach(doc => pagewiseTasks.push({ id: doc.id, ...doc.data() }));

  // 2. Classify by Status
  const statusGroups = {
    active: pagewiseTasks.filter(t => ['queued', 'pending', 'processing', 'running'].includes(lower(t.status))),
    queued: pagewiseTasks.filter(t => lower(t.status) === 'queued'),
    processing: pagewiseTasks.filter(t => ['processing', 'running'].includes(lower(t.status))),
    completed: pagewiseTasks.filter(t => ['completed', 'done', 'success'].includes(lower(t.status))),
    failed: pagewiseTasks.filter(t => ['failed', 'error', 'dead_letter'].includes(lower(t.status))),
    unexpected: pagewiseTasks.filter(t => !['queued', 'pending', 'processing', 'running', 'completed', 'done', 'success', 'failed', 'error', 'dead_letter'].includes(lower(t.status)))
  };

  // 3. Document Discovery
  const missionsSnap = await db.collection('mission_realms').get();
  const missionTitleById = new Map();
  const allDocs = [];

  for (const missionDoc of missionsSnap.docs) {
    const missionId = missionDoc.id;
    const missionData = missionDoc.data();
    missionTitleById.set(missionId, getField(missionData, ['title', 'name', 'examTitle'], 'N/A'));

    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => allDocs.push({ id: doc.id, mission_id: missionId, __ref: doc.ref, ...doc.data() }));
  }

  const ingestion = await scanCollection(db, 'ingestion_refinery');
  const sourceDocs = await scanCollection(db, 'source_documents');

  // 4. Page Extraction Records Check
  let totalPageExtractions = 0;
  for (const doc of allDocs) {
     const pSnap = await doc.__ref.collection('page_extractions').limit(1).get();
     if (!pSnap.empty) totalPageExtractions++;
  }

  // 5. Validation per Document
  const docGroups = new Map();
  for (const task of pagewiseTasks) {
    const key = `${task.mission_id}::${task.document_id}`;
    if (!docGroups.has(key)) docGroups.set(key, []);
    docGroups.get(key).push(task);
  }

  const coverageReports = [];
  const invalidTasks = [];
  let wronglyQueuedBlocked = [];

  for (const [key, tasks] of docGroups) {
    const [missionId, documentId] = key.split('::');

    // Find official doc to get page count
    const relatedDocs = [
      ...allDocs.filter(d => d.id === documentId && d.mission_id === missionId),
      ...ingestion.filter(r => docKeys(r).includes(documentId)),
      ...sourceDocs.filter(r => docKeys(r).includes(documentId))
    ];

    const pageCountValue = relatedDocs.map(pageCount).find(Boolean) || 0;
    const fileName = relatedDocs.map(d => getField(d, ['file_name', 'fileName', 'name', 'title'])).find(Boolean) || 'N/A';
    const docType = relatedDocs.map(detectDocumentType).find(Boolean) || 'other official document';

    const seenPages = new Set();
    const duplicatePages = [];
    const outOfRangePages = [];

    for (const task of tasks) {
      const taskVal = validateTaskShape(task);
      if (!taskVal.valid) invalidTasks.push({ id: task.id, ...taskVal });

      for (let p = task.page_start; p <= task.page_end; p++) {
        if (p < 1 || p > pageCountValue) outOfRangePages.push(p);
        if (seenPages.has(p)) duplicatePages.push(p);
        seenPages.add(p);
      }
    }

    const missingPages = [];
    for (let p = 1; p <= pageCountValue; p++) if (!seenPages.has(p)) missingPages.push(p);

    const allPagesCovered = missingPages.length === 0 && duplicatePages.length === 0 && outOfRangePages.length === 0;
    const expectedBatches = tasks[0]?.total_batches || 0;

    coverageReports.push({
      mission_id: missionId,
      document_id: documentId,
      file_name: fileName,
      document_type: docType,
      page_count: pageCountValue,
      actual_batches_count: tasks.length,
      total_batches_expected: expectedBatches,
      planned_pages_count: seenPages.size,
      missing_pages_count: missingPages.length,
      duplicate_pages_count: [...new Set(duplicatePages)].length,
      out_of_range_pages_count: [...new Set(outOfRangePages)].length,
      all_pages_covered: allPagesCovered && tasks.length === expectedBatches,
      tasks: tasks.map(t => t.id)
    });

    // Blocked check
    if (fileName === 'RAS 2026.pdf' || lower(missionId) === 'unknown' || !pageCountValue || !tasks[0]?.source_path) {
       wronglyQueuedBlocked.push({ missionId, documentId, fileName });
    }
  }

  const byType = { notification: baseSummary(), syllabus: baseSummary(), pyq: baseSummary(), 'study material': baseSummary(), 'other official document': baseSummary() };
  function baseSummary() { return { docs: 0, tasks: 0, pages: 0, blockers: 0 }; }

  for (const report of coverageReports) {
    const s = byType[report.document_type] || byType['other official document'];
    s.docs++;
    s.tasks += report.actual_batches_count;
    s.pages += report.planned_pages_count;
    if (!report.all_pages_covered) s.blockers++;
  }

  const rpscReport = { docs: 0, tasks: 0, pages: 0, blockers: 0 };
  const jeeReport = { docs: 0, tasks: 0, pages: 0, blockers: 0 };
  const neetReport = { docs: 0, tasks: 0, pages: 0, blockers: 0 };
  const autoDetectReport = { docs: 0, tasks: 0, pages: 0, blockers: 0 };

  for (const report of coverageReports) {
    let target = null;
    if (report.mission_id === 'RPSC_FIRST_GRADE2026_2026_1782713222215') target = rpscReport;
    else if (report.mission_id === 'jee_main_2026') target = jeeReport;
    else if (report.mission_id === 'neet_(ug)-2027') target = neetReport;
    else if (report.mission_id === 'AUTO_DETECT') target = autoDetectReport;

    if (target) {
      target.docs++;
      target.tasks += report.actual_batches_count;
      target.pages += report.planned_pages_count;
      if (!report.all_pages_covered) target.blockers++;
    }
  }

  console.log('\nGlobal Reconciliation:');
  console.log(`1. Total pagewise tasks found: ${pagewiseTasks.length}`);
  console.log(`2. Active pagewise tasks: ${statusGroups.active.length}`);
  console.log(`3. Queued tasks: ${statusGroups.queued.length}`);
  console.log(`4. Processing/running tasks: ${statusGroups.processing.length}`);
  console.log(`5. Completed tasks: ${statusGroups.completed.length}`);
  console.log(`6. Failed tasks: ${statusGroups.failed.length}`);
  console.log(`7. Unexpected status tasks: ${statusGroups.unexpected.length}`);
  console.log(`8. Unique documents represented: ${docGroups.size}`);
  console.log(`9. Total planned pages from queue: ${coverageReports.reduce((sum, r) => sum + r.planned_pages_count, 0)}`);
  console.log(`10. Missing pages total: ${coverageReports.reduce((sum, r) => sum + r.missing_pages_count, 0)}`);
  console.log(`11. Duplicate pages total: ${coverageReports.reduce((sum, r) => sum + r.duplicate_pages_count, 0)}`);
  console.log(`12. Out-of-range pages total: ${coverageReports.reduce((sum, r) => sum + r.out_of_range_pages_count, 0)}`);
  console.log(`13. Invalid task shape count: ${invalidTasks.length}`);
  console.log(`14. Documents with coverage complete: ${coverageReports.filter(r => r.all_pages_covered).length}`);
  console.log(`15. Documents with coverage blockers: ${coverageReports.filter(r => !r.all_pages_covered).length}`);
  console.log(`16. Page extraction records existing count: ${totalPageExtractions}`);
  console.log(`17. Extraction already started: ${statusGroups.processing.length > 0 || statusGroups.completed.length > 0}`);
  console.log(`18. Blocked docs wrongly queued count: ${wronglyQueuedBlocked.length}`);

  console.log('\nDocument Type Summary:');
  console.log('Notification:', byType.notification);
  console.log('Syllabus:', byType.syllabus);
  console.log('PYQ:', byType.pyq);
  console.log('Study Material:', byType['study material']);
  console.log('Other Official:', byType['other official document']);

  console.log('\nMission Summary:');
  console.log('RPSC:', rpscReport);
  console.log('JEE:', jeeReport);
  console.log('NEET:', neetReport);
  console.log('AUTO_DETECT/RAS:', autoDetectReport);

  const perfectCoverage = coverageReports.every(r => r.all_pages_covered) && coverageReports.length === 16;
  const noStarted = statusGroups.processing.length === 0 && statusGroups.completed.length === 0;
  const noWrong = wronglyQueuedBlocked.length === 0;
  const noInvalid = invalidTasks.length === 0;
  const totalCorrect = pagewiseTasks.length === 104;

  if (wronglyQueuedBlocked.length > 0) {
    console.error('\nRC_X4R_BLOCKED_WRONG_DOC_QUEUED');
    process.exit(1);
  }

  if (perfectCoverage && noStarted && noWrong && noInvalid && totalCorrect) {
    console.log('\nRC_X4R_PAGEWISE_QUEUE_STATE_AUDIT_READY');
  } else {
    console.error('\nRC_X4R_BLOCKED');
    if (!totalCorrect) console.error(`- Expected 104 tasks, found ${pagewiseTasks.length}`);
    if (!perfectCoverage) console.error('- Coverage incomplete or duplicate for some documents.');
    if (!noInvalid) console.error(`- ${invalidTasks.length} tasks have invalid shape.`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\nRC_X4R_BLOCKED');
  console.error(error);
  process.exit(1);
});
