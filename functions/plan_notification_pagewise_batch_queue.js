const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const { buildPageBatches, MAX_RETRY_PER_BATCH } = require('./extraction_policy');
const { selectNotificationSchema } = require('./notification_schemas/schema_selector');

const PROJECT_ID = 'rankcrackers-55';
const RPSC_MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';
const RPSC_EXPECTED_NOTIFICATION_ID = 'mission_RPSC_FIRST_GRADE2026_2026_1782713222215_notification_a461e1f65845dd0a';

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

function normalize(value) {
  return String(value || '').trim();
}

function lower(value) {
  return normalize(value).toLowerCase();
}

function storagePath(data) {
  return getField(data, ['storagePath', 'storage_path', 'storageRawPath', 'sourcePath', 'source_path', 'sourceUrl', 'downloadUrl', 'filePath', 'url', 'storageUrl'], '');
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

function isNotificationLike(data) {
  const hay = [data.id, data.document_type, data.documentType, data.type, data.category, data.document_role, data.documentRole, data.notification_role, data.notificationRole, data.role, data.intent, data.file_name, data.fileName, data.title, data.name].filter(Boolean).join(' ').toLowerCase();
  return /(notification|notice|amendment|correction|corrigendum|result|cutoff|cut-off|answer key|answer_key)/.test(hay);
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

function documentType(data) {
  const hay = [data.document_type, data.documentType, data.type, data.category, data.notification_role, data.file_name, data.fileName, data.title, data.name].filter(Boolean).join(' ').toLowerCase();
  if (/amendment|correction|corrigendum/.test(hay)) return 'amendment';
  if (/result/.test(hay)) return 'result';
  if (/cutoff|cut-off/.test(hay)) return 'cutoff';
  if (/answer key|answer_key/.test(hay)) return 'answer_key';
  if (/notice/.test(hay)) return 'notice';
  return getField(data, ['document_type', 'documentType', 'type', 'category'], 'notification');
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
  } catch (e) {
    return [];
  }
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
  } catch (e) {
    return [];
  }
}

function pageCountTask({ doc, sourcePath, docType }) {
  const missionId = getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown');
  return {
    task_type: 'page_count_detection',
    mission_id: missionId,
    document_id: doc.id,
    source_document_id: getField(doc, ['sourceId', 'source_id', 'documentId', 'document_id'], doc.id),
    document_type: docType || 'notification',
    source_path: sourcePath,
    status: 'planned_dry_run',
    priority: 'normal',
    expected_output: 'page_count',
    next_after_page_count: 'pagewise_text_extraction_batch',
    dry_run: true,
  };
}

function pagewiseTask({ doc, sourcePath, docType, selectedArchetype, batch }) {
  const missionId = getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown');
  return {
    task_type: 'pagewise_text_extraction_batch',
    mission_id: missionId,
    document_id: doc.id,
    source_document_id: getField(doc, ['sourceId', 'source_id', 'documentId', 'document_id'], doc.id),
    document_type: docType || 'notification',
    selected_archetype: selectedArchetype,
    source_path: sourcePath,
    page_start: batch.page_start,
    page_end: batch.page_end,
    page_batch_index: batch.page_batch_index,
    total_batches: batch.total_batches,
    status: 'planned_dry_run',
    priority: 'normal',
    retry_count: 0,
    max_retry: MAX_RETRY_PER_BATCH,
    expected_output: 'page_extractions',
    dry_run: true,
  };
}

async function collectNotificationDocs(db) {
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
    if (!isNotificationLike(record)) continue;
    const missionId = normalize(getField(record, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], 'unknown'));
    const keys = docKeys(record);
    const exists = docs.some(doc => keys.length > 0 && docKeys(doc).some(key => keys.includes(key)));
    if (!exists) docs.push({ ...record, mission_id: missionId || 'unknown', mission_title: 'N/A', __ref: null });
  }
  return { docs: [...new Map(docs.filter(isNotificationLike).map(doc => [`${getField(doc, ['mission_id', 'missionId'], 'unknown')}::${doc.id}`, doc])).values()], ingestion, sourceDocs, aiQueue };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!dryRun) {
    console.log('DRY_RUN_REQUIRED_FOR_RC_N3Q');
    process.exit(1);
  }

  console.log('================================================================================');
  console.log('RC-N3Q NOTIFICATION PAGE-WISE BATCH QUEUE PLANNER');
  console.log('================================================================================');
  console.log('Mode: DRY RUN ONLY - no Firestore writes, no AI extraction, no queue creation');

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });
  const { docs, ingestion, sourceDocs, aiQueue } = await collectNotificationDocs(db);

  const selected = [];
  const skipped = [];
  const proposedTasks = [];
  const futurePageRecordContract = {
    output_path: 'mission_realms/{missionId}/official_documents/{documentId}/page_extractions/{pageNumber}',
    fields: ['page_number', 'batch_index', 'source_document_id', 'mission_id', 'document_type', 'raw_text', 'markdown_text', 'page_explanation', 'extraction_confidence', 'extraction_status', 'is_empty_page', 'warnings', 'token_usage_estimate', 'created_at', 'updated_at'],
  };

  for (const doc of docs) {
    const relatedIngestion = ingestion.filter(record => relationMatch(record, doc));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, doc));
    const relatedAi = aiQueue.filter(record => relationMatch(record, doc));
    const combined = [doc, ...relatedIngestion, ...relatedSource, ...relatedAi];
    const sourcePath = combined.map(storagePath).find(Boolean) || '';
    const language = detectLanguage(doc);
    const docType = documentType(doc);
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
    const selector = selectNotificationSchema({
      exam_name: getField(doc, ['exam_name', 'examName', 'exam_title', 'examTitle', 'title', 'name', 'file_name', 'fileName'], ''),
      authority: getField(doc, ['authority', 'recruiting_body', 'recruitingBody', 'sourceAuthority'], ''),
      document_type: docType,
      mission_category: getField(doc, ['missionCategory', 'category'], ''),
      detected_keywords: [doc.file_name, doc.fileName, doc.title, doc.name, doc.notification_role, doc.category, docType].filter(Boolean),
      existing_mission_id: getField(doc, ['mission_id', 'missionId'], ''),
    });
    const base = {
      mission_id: getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown'),
      document_id: doc.id,
      file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'),
      document_type: docType,
      source_path: sourcePath || 'MISSING',
      language,
      page_count: pageCountValue || 'unknown',
      extracted_pages_count: extractedPages.length,
      selected_archetype: selector.selected_archetype,
      schema_selector_confidence: selector.confidence,
      fallback_used: selector.fallback_used,
      selector_reason: selector.reason,
    };
    const skipReasons = [];
    if (!sourcePath) skipReasons.push('STORAGE_PATH_MISSING');
    if (language === 'hi') skipReasons.push('LANGUAGE_POLICY_WARNING_REQUIRES_FOUNDER_LEGACY_EXCEPTION');
    const incomplete = extractedPages.length === 0 || (pageCountValue && extractedPages.length < pageCountValue);
    if (!incomplete) skipReasons.push('PAGEWISE_EXTRACTION_ALREADY_PRESENT_OR_COMPLETE');
    if (skipReasons.length > 0) {
      skipped.push({ ...base, skip_reasons: skipReasons });
      continue;
    }
    const planned = { ...base, proposed_tasks: [] };
    if (!pageCountValue) {
      const task = pageCountTask({ doc, sourcePath, docType });
      planned.proposed_tasks.push(task);
      proposedTasks.push(task);
    } else {
      for (const batch of buildPageBatches(pageCountValue)) {
        const task = pagewiseTask({ doc, sourcePath, docType, selectedArchetype: selector.selected_archetype, batch });
        planned.proposed_tasks.push(task);
        proposedTasks.push(task);
      }
    }
    selected.push(planned);
  }

  const rpscPlan = selected.find(d => d.mission_id === RPSC_MISSION_ID && d.document_id === RPSC_EXPECTED_NOTIFICATION_ID)
    || skipped.find(d => d.mission_id === RPSC_MISSION_ID && d.document_id === RPSC_EXPECTED_NOTIFICATION_ID)
    || null;
  const pageCountTasks = proposedTasks.filter(t => t.task_type === 'page_count_detection');
  const pagewiseTasks = proposedTasks.filter(t => t.task_type === 'pagewise_text_extraction_batch');
  const blockers = [];
  if (selected.length === 0) blockers.push('NO_NOTIFICATION_DOCUMENTS_SELECTED_FOR_PLANNING');
  if (selected.some(d => d.fallback_used)) blockers.push('SOME_SELECTED_DOCS_USE_SCHEMA_SELECTOR_FALLBACK_REVIEW_REQUIRED');

  const summary = {
    total_notification_like_docs_scanned: docs.length,
    docs_selected_for_planning: selected.length,
    docs_skipped_count: skipped.length,
    docs_needing_page_count_detection: selected.filter(d => d.page_count === 'unknown').length,
    docs_with_known_page_count: selected.filter(d => d.page_count !== 'unknown').length,
    proposed_page_count_detection_tasks: pageCountTasks.length,
    proposed_pagewise_batch_tasks: pagewiseTasks.length,
    rpsc_notification_planned_task_summary: rpscPlan ? {
      document_id: rpscPlan.document_id,
      selected_for_planning: selected.includes(rpscPlan),
      source_path: rpscPlan.source_path,
      page_count: rpscPlan.page_count,
      selected_archetype: rpscPlan.selected_archetype,
      proposed_task_count: rpscPlan.proposed_tasks ? rpscPlan.proposed_tasks.length : 0,
      proposed_task_types: rpscPlan.proposed_tasks ? [...new Set(rpscPlan.proposed_tasks.map(t => t.task_type))] : [],
      skip_reasons: rpscPlan.skip_reasons || [],
    } : {
      document_id: RPSC_EXPECTED_NOTIFICATION_ID,
      selected_for_planning: false,
      skip_reasons: ['RPSC_EXPECTED_NOTIFICATION_DOCUMENT_NOT_FOUND'],
    },
    recommended_next_patch: blockers.length === 0 ? 'RC-N3Q-A - Notification Page-wise Batch Queue Apply' : 'RC-N3Q-B - Source metadata/page_count/schema review before queue apply',
    blockers_before_queue_apply: blockers,
    future_page_extraction_record_contract: futurePageRecordContract,
  };

  console.log('\nSELECTED DOCUMENT PLANS');
  console.log(JSON.stringify(selected, null, 2));
  console.log('\nSKIPPED DOCUMENTS');
  console.log(JSON.stringify(skipped, null, 2));
  console.log('\nSUMMARY');
  console.log(JSON.stringify(summary, null, 2));
  console.log('\nConfirmations:');
  console.log('- dry run only');
  console.log('- no Firestore writes');
  console.log('- no AI extraction run');
  console.log('- no queue tasks created');

  if (blockers.length > 0) {
    console.log('\nFinal verdict: RC_N3Q_NOTIFICATION_PAGEWISE_QUEUE_PLAN_READY');
  } else {
    console.log('\nFinal verdict: RC_N3Q_NOTIFICATION_PAGEWISE_QUEUE_PLAN_READY');
  }
}

main().catch((e) => {
  console.error('RC_N3Q_BLOCKED');
  console.error(e);
  process.exit(1);
});
