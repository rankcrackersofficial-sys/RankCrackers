const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const RPSC_MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';

const args = process.argv.slice(2);
const applyIndex = args.indexOf('--apply');
const isApplyMode = applyIndex !== -1 && args[applyIndex + 1] === 'CONFIRM_QUEUE_REPAIRED_DOCS_PAGE_COUNT';

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

function safeId(val) {
  return String(val || '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

function buildTaskId(missionId, documentId) {
  return `rc_n3qa_page_count_${safeId(missionId)}_${safeId(documentId)}`;
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X3Q-R2 - QUEUE PAGE COUNT TASKS FOR NEWLY REPAIRED OFFICIAL DOCS');
  console.log('================================================================================');
  console.log(`Execution Mode: ${isApplyMode ? 'WRITE/APPLY' : 'DRY RUN (READ ONLY)'}`);

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  // Load all missions
  const missionsSnap = await db.collection('mission_realms').get();
  const missions = [];
  missionsSnap.forEach(doc => {
    missions.push({ id: doc.id, ...doc.data() });
  });

  // Load all official docs
  const docs = [];
  for (const mDoc of missionsSnap.docs) {
    const missionId = mDoc.id;
    const mData = mDoc.data();
    if (Array.isArray(mData.officialDocuments)) {
      mData.officialDocuments.forEach((doc, idx) => {
        const id = doc.id || doc.documentId || doc.docId || `root_official_${idx}`;
        docs.push({ id, mission_id: missionId, mission_title: getField(mData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A'), __source: 'mission_root.officialDocuments', __ref: null, ...doc });
      });
    }
    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => {
      docs.push({ id: doc.id, mission_id: missionId, mission_title: getField(mData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A'), __source: 'mission_realms.official_documents', __ref: doc.ref, ...doc.data() });
    });
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

  // Load all page_count_detection tasks
  const queueSnap = await db.collection('ai_queue').where('task_type', '==', 'page_count_detection').get();
  const allTasks = [];
  queueSnap.forEach(doc => {
    allTasks.push({ id: doc.id, ...doc.data() });
  });

  const activeStatuses = new Set(['queued', 'pending', 'processing', 'running']);
  const activeTasks = allTasks.filter(t => activeStatuses.has(lower(t.status)));

  const skippedDocs = [];
  const planTasks = [];

  let duplicateSkippedCount = 0;
  let excludedDocsSkippedCount = 0;
  let lowConfidenceDocsSkippedCount = 0;

  for (const doc of officialDocs) {
    const relatedIngestion = ingestion.filter(record => relationMatch(record, doc));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, doc));
    const combined = [doc, ...relatedIngestion, ...relatedSource];
    const sourcePath = combined.map(storagePath).find(Boolean) || '';
    const missionId = getField(doc, ['mission_id', 'missionId'], 'unknown');
    const docType = detectDocumentType(doc);
    const fileName = getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A');

    // 1st skip checks: exclude / low-confidence
    const isExcluded = combined.some(r => r.queue_exclusion_status === 'excluded_until_mission_created');
    if (isExcluded) {
      excludedDocsSkippedCount++;
      skippedDocs.push({ id: doc.id, file_name: fileName, reason: 'EXCLUDED_UNTIL_MISSION_CREATED' });
      continue;
    }

    const isLowConfidence = isMissingId(missionId) || !sourcePath;
    if (isLowConfidence) {
      lowConfidenceDocsSkippedCount++;
      skippedDocs.push({ id: doc.id, file_name: fileName, reason: 'FOUNDER_DECISION_REQUIRED_LOW_CONFIDENCE' });
      continue;
    }

    // Filter: only select safe_repaired docs by RC-X3M-A
    const isRepaired = combined.some(r => r.metadata_repair_status === 'safe_repaired' && r.metadata_repaired_by_patch === 'RC-X3M-A');
    if (!isRepaired) {
      continue;
    }

    // Active duplicate check
    const activeDuplicate = activeTasks.find(t => t.mission_id === missionId && t.document_id === doc.id);
    if (activeDuplicate) {
      duplicateSkippedCount++;
      skippedDocs.push({ id: doc.id, file_name: fileName, reason: 'ACTIVE_DUPLICATE_PAGE_COUNT_TASK_EXISTS', duplicate_task_id: activeDuplicate.id });
      continue;
    }

    // Document is eligible!
    const language = detectLanguage(doc);
    const taskId = buildTaskId(missionId, doc.id);

    const taskPayload = {
      task_type: 'page_count_detection',
      mission_id: missionId,
      document_id: doc.id,
      source_document_id: getField(doc, ['source_document_id', 'sourceDocumentId', 'sourceId', 'source_id'], doc.id),
      document_type: docType,
      source_path: sourcePath,
      language,
      status: 'queued',
      priority: 'normal',
      expected_output: 'page_count',
      next_after_page_count: 'pagewise_text_extraction_batch',
      dry_run: false,
      created_by_patch: 'RC-X3Q-R2',
      metadata_repair_source_patch: 'RC-X3M-A',
      created_at: Firestore.FieldValue.serverTimestamp(),
      updated_at: Firestore.FieldValue.serverTimestamp(),
      page_policy: {
        all_pages_required: true,
        fixed_page_limit_allowed: false,
        batch_size_is_not_page_limit: true
      }
    };

    if (missionId === 'AUTO_DETECT') {
      taskPayload.requires_founder_mission_assignment_before_publish = true;
      taskPayload.auto_detect_routing_only = true;
    }

    planTasks.push({ task_id: taskId, payload: taskPayload, file_name: fileName });
  }

  // Orphaned task review
  const orphanedTask = activeTasks.find(t => t.id === 'rc_n3qa_page_count_RPSC_FIRST_GRADE2026_2026_1782713222215_mission_RPSC_FIRST_GRADE2026_2026_1782713222215_notification_3f230660dc55c863');
  const orphanedTaskFound = Boolean(orphanedTask);

  const rpscHindiTask = planTasks.find(t => t.file_name.toLowerCase().includes('hindi'));
  const rasAutoDetectTask = planTasks.find(t => t.file_name.toLowerCase().includes('ras'));

  if (isApplyMode) {
    console.log('\nCreating tasks in Firestore ai_queue...');
    const batch = db.batch();
    for (const task of planTasks) {
      console.log(`- Queueing Task: ${task.task_id} (File: ${task.file_name})`);
      const ref = db.collection('ai_queue').doc(task.task_id);
      batch.set(ref, task.payload, { merge: true });
    }
    await batch.commit();

    console.log('\n==============================================');
    console.log('APPLY OUTPUT');
    console.log('==============================================');
    console.log('1. Confirmation phrase accepted: yes');
    console.log(`2. Tasks created count: ${planTasks.length}`);
    console.log(`3. Duplicate skipped count: ${duplicateSkippedCount}`);
    console.log(`4. Excluded skipped count: ${excludedDocsSkippedCount}`);
    console.log(`5. Low-confidence skipped count: ${lowConfidenceDocsSkippedCount}`);
    console.log('6. Created task IDs:');
    planTasks.forEach(t => console.log(`   - ${t.task_id}`));
    console.log(`7. RPSC Hindi task ID: ${rpscHindiTask ? rpscHindiTask.task_id : 'N/A'}`);
    console.log(`8. RAS AUTO_DETECT task ID: ${rasAutoDetectTask ? rasAutoDetectTask.task_id : 'N/A'}`);
    console.log('9. Confirm writes only to ai_queue: confirmed');
    console.log('\nRC_X3Q_R2_REPAIRED_DOCS_PAGE_COUNT_QUEUE_READY');
  } else {
    console.log('\n==============================================');
    console.log('DRY-RUN OUTPUT');
    console.log('==============================================');
    console.log(`1. Total repaired docs scanned: ${planTasks.length + skippedDocs.length}`);
    console.log(`2. Eligible repaired docs: ${planTasks.length}`);
    console.log('3. Tasks that would be created:');
    planTasks.forEach(t => console.log(`   - ID: ${t.task_id} (File: ${t.file_name})`));
    console.log(`4. Duplicate skipped count: ${duplicateSkippedCount}`);
    console.log(`5. Excluded docs skipped count: ${excludedDocsSkippedCount}`);
    console.log(`6. Low-confidence docs skipped count: ${lowConfidenceDocsSkippedCount}`);
    console.log(`7. Orphaned task unchanged confirmation: confirmed (orphanedTaskFound=${orphanedTaskFound ? 'YES' : 'NO'})`);
    console.log(`8. RPSC Hindi task would be created: ${rpscHindiTask ? 'YES' : 'NO'}`);
    console.log(`9. RAS AUTO_DETECT task would be created: ${rasAutoDetectTask ? 'YES' : 'NO'}`);
    console.log('\nRC_X3Q_R2_DRY_RUN_READY');
  }
}

main().catch(e => {
  if (isApplyMode) {
    console.error('\nRC_X3Q_R2_APPLY_BLOCKED');
  } else {
    console.error('\nRC_X3Q_R2_DRY_RUN_BLOCKED');
  }
  console.error(e);
  process.exit(1);
});
