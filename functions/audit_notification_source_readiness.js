const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
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
  return getField(data, [
    'storagePath', 'storage_path', 'storageRawPath', 'sourcePath', 'source_path',
    'sourceUrl', 'downloadUrl', 'filePath', 'url', 'storageUrl',
  ], '');
}

function pageCount(data) {
  const value = Number(getField(data, ['page_count', 'pageCount', 'totalPages', 'total_pages', 'numPages'], NaN));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function docKeys(doc) {
  return [
    doc.id, doc.documentId, doc.document_id, doc.docId, doc.sourceId, doc.source_id,
    doc.refineryId, doc.fileHash, doc.hash,
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

function isNotificationLike(data) {
  const hay = [
    data.id, data.document_type, data.documentType, data.type, data.category, data.document_role,
    data.documentRole, data.notification_role, data.notificationRole, data.role, data.intent,
    data.file_name, data.fileName, data.title, data.name,
  ].filter(Boolean).join(' ').toLowerCase();
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

function hasText(data) {
  const value = getField(data, ['extractedText', 'parsedText', 'rawText', 'text', 'markdown', 'extractedMarkdown', 'searchableText', 'combinedText', 'combinedMarkdown'], null);
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function aiStatus(record) {
  return getField(record, ['status', 'aiQueueStatus', 'extraction_status', 'extractionStatus', 'last_successful_stage'], 'unknown');
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

function classify(report) {
  if (report.language === 'hi') return 'LANGUAGE_POLICY_REVIEW_REQUIRED';
  if (report.storage_link_status !== 'FOUND') return 'STORAGE_LINK_BLOCKED';
  if (report.source_document_link_status !== 'FOUND') return 'SOURCE_LINK_BLOCKED';
  if (report.fallback_used) return 'SCHEMA_SELECTOR_FALLBACK_REVIEW_REQUIRED';
  if (report.page_count !== 'unknown' && report.extracted_pages_count === 1 && report.page_count > 1) return 'FIRST_PAGE_ONLY_BLOCKED';
  if (report.extracted_pages_count === 0 && report.page_count === 'unknown') return 'PAGE_COUNT_DETECTION_PENDING';
  if (report.extracted_pages_count === 0) return 'PAGEWISE_EXTRACTION_PENDING';
  return 'READY_FOR_FORM_EXTRACTION';
}

function blockerFor(report) {
  if (report.language === 'hi') return 'LANGUAGE_POLICY_WARNING_REQUIRES_FOUNDER_LEGACY_EXCEPTION';
  if (report.storage_link_status !== 'FOUND') return 'STORAGE_PATH_MISSING';
  if (report.source_document_link_status !== 'FOUND') return 'SOURCE_DOCUMENT_LINK_MISSING';
  if (report.page_count !== 'unknown' && report.extracted_pages_count === 1 && report.page_count > 1) return 'FIRST_PAGE_ONLY_EXTRACTION';
  if (report.extracted_pages_count === 0) return 'PAGEWISE_TEXT_EXTRACTION_MISSING';
  if (report.fallback_used) return 'SCHEMA_SELECTOR_FALLBACK_REVIEW_REQUIRED';
  return null;
}

async function main() {
  console.log('================================================================================');
  console.log('RC-N2 NOTIFICATION SOURCE READINESS AUDIT');
  console.log('================================================================================');
  console.log('Mode: READ ONLY - no AI extraction, no Firestore writes, no deploy');

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  const missionsSnap = await db.collection('mission_realms').get();
  const officialDocs = [];
  for (const missionDoc of missionsSnap.docs) {
    const missionId = missionDoc.id;
    const missionData = missionDoc.data();
    if (Array.isArray(missionData.officialDocuments)) {
      missionData.officialDocuments.forEach((doc, idx) => officialDocs.push({
        id: doc.id || doc.documentId || doc.docId || `root_official_${idx}`,
        mission_id: missionId,
        mission_title: getField(missionData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A'),
        __source: 'mission_root.officialDocuments',
        __path: `mission_realms/${missionId}.officialDocuments[${idx}]`,
        __ref: null,
        ...doc,
      }));
    }
    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => officialDocs.push({
      id: doc.id,
      mission_id: missionId,
      mission_title: getField(missionData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A'),
      __source: 'mission_realms.official_documents',
      __path: doc.ref.path,
      __ref: doc.ref,
      ...doc.data(),
    }));
  }

  const ingestion = await scanCollection(db, 'ingestion_refinery');
  const sourceDocs = await scanCollection(db, 'source_documents');
  const aiQueue = await scanCollection(db, 'ai_queue');
  const notificationCollections = [];
  for (const name of ['notification_candidates', 'notification_candidate', 'notification_canonical', 'notification_registry', 'notifications']) {
    notificationCollections.push(...await scanCollection(db, name));
  }

  for (const record of [...ingestion, ...sourceDocs, ...notificationCollections]) {
    if (!isNotificationLike(record)) continue;
    const missionId = normalize(getField(record, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], 'unknown'));
    const keys = docKeys(record);
    const exists = officialDocs.some(doc => keys.length > 0 && docKeys(doc).some(key => keys.includes(key)));
    if (!exists) officialDocs.push({ ...record, mission_id: missionId || 'unknown', mission_title: 'N/A', __ref: null });
  }

  const byKey = new Map();
  for (const doc of officialDocs.filter(isNotificationLike)) {
    const key = `${getField(doc, ['mission_id', 'missionId'], 'unknown')}::${doc.id}`;
    byKey.set(key, { ...(byKey.get(key) || {}), ...doc });
  }

  const reports = [];
  for (const doc of byKey.values()) {
    const missionId = normalize(getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown'));
    const relatedIngestion = ingestion.filter(record => relationMatch(record, doc));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, doc));
    const relatedAi = aiQueue.filter(record => relationMatch(record, doc));
    const combined = [doc, ...relatedIngestion, ...relatedSource, ...relatedAi];
    const subcollectionPages = await getPageExtractionPages(doc.__ref);
    const inlinePages = [];
    for (const record of combined) {
      for (const p of pageArrays(record)) {
        const n = pageNumberFromRecord('', p);
        if (n) inlinePages.push(n);
      }
    }
    const extractedPages = [...new Set([...subcollectionPages, ...inlinePages])].sort((a, b) => a - b);
    const knownPageCount = combined.map(pageCount).find(Boolean) || null;
    const storage = combined.map(storagePath).find(Boolean) || '';
    const language = detectLanguage(doc);
    const docType = documentType(doc);
    const selector = selectNotificationSchema({
      exam_name: getField(doc, ['exam_name', 'examName', 'exam_title', 'examTitle', 'title', 'name', 'file_name', 'fileName'], ''),
      authority: getField(doc, ['authority', 'recruiting_body', 'recruitingBody', 'sourceAuthority'], ''),
      document_type: docType,
      mission_category: getField(doc, ['missionCategory', 'category'], ''),
      detected_keywords: [doc.file_name, doc.fileName, doc.title, doc.name, doc.notification_role, doc.category, docType].filter(Boolean),
      existing_mission_id: missionId,
    });
    const sourceLinkFound = relatedSource.length > 0 || relatedIngestion.length > 0 || doc.__source === 'source_documents' || doc.__source === 'ingestion_refinery';
    const missingCount = knownPageCount ? Math.max(knownPageCount - extractedPages.length, 0) : 'unknown';
    const report = {
      mission_id: missionId,
      mission_title: getField(doc, ['mission_title', 'missionTitle'], 'N/A'),
      document_id: doc.id,
      file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'),
      document_type: docType,
      notification_role: getField(doc, ['notification_role', 'notificationRole', 'document_role', 'documentRole'], 'N/A'),
      storage_path_or_source_url: storage || 'MISSING',
      language,
      page_count: knownPageCount || 'unknown',
      extracted_pages_count: extractedPages.length,
      missing_pages_count: missingCount,
      pagewise_extraction_status: extractedPages.length === 0 ? 'missing' : (knownPageCount && missingCount === 0 ? 'complete' : 'partial_or_unknown'),
      text_extraction_status: combined.some(hasText) || extractedPages.length > 0 ? 'text_available' : 'text_missing',
      ai_queue_task_exists: relatedAi.length > 0,
      ai_queue_status: relatedAi.map(aiStatus).join(', ') || 'N/A',
      source_document_link_status: sourceLinkFound ? 'FOUND' : 'MISSING',
      storage_link_status: storage ? 'FOUND' : 'MISSING',
      selected_archetype: selector.selected_archetype,
      schema_selector_confidence: selector.confidence,
      fallback_used: selector.fallback_used,
      selector_reason: selector.reason,
      related_records: {
        ingestion_refinery: relatedIngestion.map(r => r.id),
        source_documents: relatedSource.map(r => r.id),
        ai_queue: relatedAi.map(r => r.id),
        page_extractions_subcollection_pages: subcollectionPages.length,
      },
    };
    report.classification = classify(report);
    report.blocker_reason = blockerFor(report);
    report.ready_for_notification_form_extraction = report.classification === 'READY_FOR_FORM_EXTRACTION';
    reports.push(report);
  }

  reports.sort((a, b) => `${a.mission_id}/${a.file_name}`.localeCompare(`${b.mission_id}/${b.file_name}`));

  console.log('\nDOCUMENT READINESS REPORTS');
  for (const report of reports) {
    console.log('\n---');
    console.log(JSON.stringify(report, null, 2));
  }

  const rpscReport = reports.find(r => r.mission_id === RPSC_MISSION_ID && r.document_id === RPSC_EXPECTED_NOTIFICATION_ID)
    || reports.find(r => r.mission_id === RPSC_MISSION_ID && lower(r.document_id).includes('notification'))
    || null;

  const summary = {
    total_notification_like_docs_audited: reports.length,
    ready_count: reports.filter(r => r.classification === 'READY_FOR_FORM_EXTRACTION').length,
    pagewise_missing_count: reports.filter(r => r.extracted_pages_count === 0).length,
    first_page_only_risk_count: reports.filter(r => r.classification === 'FIRST_PAGE_ONLY_BLOCKED').length,
    storage_missing_count: reports.filter(r => r.storage_link_status !== 'FOUND').length,
    language_policy_warning_count: reports.filter(r => r.language === 'hi').length,
    schema_fallback_count: reports.filter(r => r.fallback_used).length,
    rpsc_notification_readiness: rpscReport ? {
      expected_document_id: RPSC_EXPECTED_NOTIFICATION_ID,
      document_found: true,
      actual_document_id: rpscReport.document_id,
      storage_path_found: rpscReport.storage_link_status === 'FOUND',
      pagewise_extraction_found: rpscReport.extracted_pages_count > 0,
      selected_schema_archetype: rpscReport.selected_archetype,
      ready_for_notification_form_extraction: rpscReport.ready_for_notification_form_extraction,
      exact_blockers: rpscReport.blocker_reason ? [rpscReport.blocker_reason] : [],
    } : {
      expected_document_id: RPSC_EXPECTED_NOTIFICATION_ID,
      document_found: false,
      storage_path_found: false,
      pagewise_extraction_found: false,
      selected_schema_archetype: 'N/A',
      ready_for_notification_form_extraction: false,
      exact_blockers: ['RPSC_EXPECTED_NOTIFICATION_DOCUMENT_NOT_FOUND'],
    },
  };
  summary.recommended_next_patch = summary.ready_count > 0
    ? 'RC-N3 - Notification form draft dry-run audit for ready documents'
    : 'X2/N3Q - Page-wise batch queue before notification form extraction';

  console.log('\nSUMMARY');
  console.log(JSON.stringify(summary, null, 2));
  console.log('\nConfirmations:');
  console.log('- read only audit');
  console.log('- no AI extraction run');
  console.log('- no Firestore writes');
  console.log('- no Firebase deploy');
  console.log('\nFinal verdict: RC_N2_NOTIFICATION_SOURCE_READINESS_AUDIT_READY');
}

main().catch((e) => {
  console.error('RC_N2_BLOCKED');
  console.error(e);
  process.exit(1);
});
