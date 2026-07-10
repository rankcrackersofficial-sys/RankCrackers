const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';
const CONFIRMATION = 'CONFIRM_QUEUE_UNIVERSAL_OFFICIAL_PAGE_COUNT';
const RPSC_MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';
const ACTIVE_DUPLICATE_STATUSES = new Set(['queued', 'processing', 'running', 'pending']);

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

async function collectOfficialDocs(db) {
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
  const aiQueue = await scanCollection(db, 'ai_queue');
  for (const record of [...ingestion, ...sourceDocs]) {
    if (!isOfficialLike(record)) continue;
    const missionId = normalize(getField(record, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], 'unknown'));
    const keys = docKeys(record);
    const exists = docs.some(doc => keys.length > 0 && docKeys(doc).some(key => keys.includes(key)));
    if (!exists) docs.push({ ...record, mission_id: missionId || 'unknown', mission_title: 'N/A', __ref: null });
  }
  const unique = [...new Map(docs.filter(isOfficialLike).map(doc => [`${getField(doc, ['mission_id', 'missionId'], 'unknown')}::${doc.id}`, doc])).values()];
  return { docs: unique, ingestion, sourceDocs, aiQueue };
}

function activeDuplicateTask(aiQueue, missionId, documentId) {
  return aiQueue.find(task => task.task_type === 'page_count_detection'
    && task.mission_id === missionId
    && task.document_id === documentId
    && ACTIVE_DUPLICATE_STATUSES.has(lower(task.status)));
}

function safeId(value) {
  return normalize(value).replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 600);
}

function taskIdFor(missionId, documentId) {
  return `rc_n3qa_page_count_${safeId(missionId)}_${safeId(documentId)}`;
}

function buildTask({ missionId, doc, sourcePath, documentType, language, languagePolicyStatus }) {
  return {
    task_type: 'page_count_detection',
    mission_id: missionId,
    document_id: doc.id,
    source_document_id: getField(doc, ['sourceId', 'source_id', 'documentId', 'document_id'], doc.id),
    document_type: documentType,
    source_path: sourcePath,
    language,
    language_policy_status: languagePolicyStatus,
    status: 'queued',
    priority: 'normal',
    expected_output: 'page_count',
    next_after_page_count: 'pagewise_text_extraction_batch',
    dry_run: false,
    created_by_patch: 'RC-X3Q',
    document_scope: 'official_document',
    page_policy: {
      all_pages_required: true,
      fixed_page_limit_allowed: false,
      batch_size_is_not_page_limit: true
    }
  };
}

async function buildPlan(db) {
  const { docs, ingestion, sourceDocs, aiQueue } = await collectOfficialDocs(db);
  const ready = [];
  const skipped = [];
  const duplicates = [];

  for (const doc of docs) {
    const relatedIngestion = ingestion.filter(record => relationMatch(record, doc));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, doc));
    const relatedAi = aiQueue.filter(record => relationMatch(record, doc));
    const combined = [doc, ...relatedIngestion, ...relatedSource, ...relatedAi];
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

    const reasons = [];
    if (isMissingId(missionId)) reasons.push('MISSION_ID_MISSING');
    if (isMissingId(doc.id)) reasons.push('DOCUMENT_ID_MISSING');
    if (!sourcePath) reasons.push('STORAGE_PATH_MISSING');
    
    // Check Hindi future-policy vs existing legacy document
    let languagePolicyStatus = 'primary_extraction_allowed';
    if (language === 'hi') {
      languagePolicyStatus = 'legacy_hindi_document_warning';
      // Allowed legacy hindi, warning only
    } else if (language !== 'en' && language !== 'unknown') {
      languagePolicyStatus = 'language_unknown_review_required';
    }

    if (pageCountValue) reasons.push('PAGE_COUNT_ALREADY_KNOWN');
    if (extractedPages.length > 0) reasons.push('PAGEWISE_EXTRACTION_RECORDS_ALREADY_EXIST');
    
    const duplicate = activeDuplicateTask(aiQueue, missionId, doc.id);
    if (duplicate) reasons.push('ACTIVE_DUPLICATE_PAGE_COUNT_TASK_EXISTS');

    const base = {
      mission_id: missionId,
      mission_title: missionTitle,
      document_id: doc.id,
      file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'),
      source_path: sourcePath || 'MISSING',
      document_type: docType,
      page_count: pageCountValue || 'unknown',
      extracted_pages_count: extractedPages.length,
      language,
      language_policy_status: languagePolicyStatus,
    };

    if (duplicate) {
      duplicates.push({ ...base, duplicate_task_id: duplicate.id, duplicate_status: duplicate.status });
    }
    if (reasons.length > 0) {
      skipped.push({ ...base, skip_reasons: reasons, duplicate_task_id: duplicate ? duplicate.id : null });
      continue;
    }

    const taskId = taskIdFor(missionId, doc.id);
    ready.push({
      ...base,
      ready_for_page_count_queue: true,
      task_id: taskId,
      task: buildTask({ missionId, doc, sourcePath, documentType: docType, language, languagePolicyStatus }),
    });
  }

  return { totalDocs: docs.length, ready, skipped, duplicates };
}

function printSummary({ mode, plan, created = [], applyConfirmationAccepted = false }) {
  const rpscReady = plan.ready.filter(item => item.mission_id === RPSC_MISSION_ID);
  const rpscCreated = created.filter(item => item.mission_id === RPSC_MISSION_ID);
  const rpscSkipped = plan.skipped.filter(item => item.mission_id === RPSC_MISSION_ID);

  const docTypePlannedCounts = {};
  plan.ready.forEach(item => {
    docTypePlannedCounts[item.document_type] = (docTypePlannedCounts[item.document_type] || 0) + 1;
  });

  const docTypeAuditedCounts = {};
  plan.ready.concat(plan.skipped).concat(plan.duplicates).forEach(item => {
    docTypeAuditedCounts[item.document_type] = (docTypeAuditedCounts[item.document_type] || 0) + 1;
  });

  const summary = {
    mode,
    total_official_docs_scanned: plan.totalDocs,
    doc_types_scanned: docTypeAuditedCounts,
    docs_selected_for_page_count_queue: plan.ready.length,
    skipped_docs_count: plan.skipped.length,
    active_duplicates_found: plan.duplicates.length,
    tasks_that_would_be_created: mode === 'dry-run' ? plan.ready.map(item => ({ task_id: item.task_id, mission_id: item.mission_id, document_id: item.document_id, source_path: item.source_path })) : [],
    tasks_created_count: created.length,
    created_task_ids: created.map(item => item.task_id),
    notification_duplicates_skipped_count: plan.duplicates.filter(item => item.document_type === 'notification').length + plan.skipped.filter(item => item.document_type === 'notification' && item.skip_reasons.includes('ACTIVE_DUPLICATE_PAGE_COUNT_TASK_EXISTS')).length,
    syllabus_tasks_planned_count: docTypePlannedCounts['syllabus'] || 0,
    pyq_tasks_planned_count: docTypePlannedCounts['pyq'] || 0,
    study_material_tasks_planned_count: docTypePlannedCounts['study material'] || 0,
    other_official_doc_tasks_planned_count: docTypePlannedCounts['other official document'] || 0,
    rpsc_mission_task_summary: {
      ready_tasks: rpscReady.map(item => ({ id: item.document_id, file_name: item.file_name, document_type: item.document_type })),
      created_tasks: rpscCreated.map(item => ({ id: item.document_id, task_id: item.task_id })),
      skipped_tasks: rpscSkipped.map(item => ({ id: item.document_id, file_name: item.file_name, reasons: item.skip_reasons })),
    },
    skipped_docs_reasons: plan.skipped.map(item => ({ mission_id: item.mission_id, document_id: item.document_id, file_name: item.file_name, skip_reasons: item.skip_reasons })),
    duplicates: plan.duplicates.map(item => ({ mission_id: item.mission_id, document_id: item.document_id, file_name: item.file_name, duplicate_task_id: item.duplicate_task_id })),
    firestore_write_limit: 'ai_queue only',
    no_writes_in_dry_run: mode === 'dry-run',
    no_ai_extraction: true,
    no_pagewise_extraction: true,
    apply_confirmation_accepted: applyConfirmationAccepted,
  };
  
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const applyIndex = process.argv.indexOf('--apply');
  const wantsApply = applyIndex !== -1;
  const confirmation = wantsApply ? process.argv[applyIndex + 1] : '';
  const applyConfirmed = wantsApply && confirmation === CONFIRMATION;

  console.log('================================================================================');
  console.log('RC-X3Q UNIVERSAL PAGE COUNT QUEUE APPLY');
  console.log('================================================================================');
  console.log('Allowed write collection: ai_queue only');
  console.log('No AI extraction, no pagewise extraction, no publish, no approval');

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });
  const plan = await buildPlan(db);

  if (!wantsApply || isDryRun || !applyConfirmed) {
    if (wantsApply && !applyConfirmed) {
      console.log(`Apply confirmation missing or invalid. Required: ${CONFIRMATION}`);
      console.log('No Firestore writes performed. Printing dry-run summary only.');
    }
    printSummary({ mode: 'dry-run', plan, applyConfirmationAccepted: false });
    const verdict = plan.ready.length > 0 || plan.duplicates.length > 0 ? 'RC_X3Q_DRY_RUN_READY' : 'RC_X3Q_DRY_RUN_BLOCKED';
    console.log(`\nFinal dry-run verdict: ${verdict}`);
    return;
  }

  const created = [];
  for (const item of plan.ready) {
    const task = {
      ...item.task,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };
    await db.collection('ai_queue').doc(item.task_id).set(task, { merge: false });
    created.push({ task_id: item.task_id, mission_id: item.mission_id, document_id: item.document_id });
  }

  console.log('Confirmation phrase accepted.');
  printSummary({ mode: 'apply', plan, created, applyConfirmationAccepted: true });
  const verdict = created.length > 0 || plan.duplicates.length > 0
    ? 'RC_X3Q_UNIVERSAL_PAGE_COUNT_QUEUE_APPLIED_READY'
    : 'RC_X3Q_APPLY_BLOCKED';
  console.log(`\nFinal apply verdict: ${verdict}`);
}

main().catch((e) => {
  console.error('RC_X3Q_BLOCKED');
  console.error(e);
  process.exit(1);
});
