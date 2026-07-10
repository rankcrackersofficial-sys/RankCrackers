const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const {
  PRIMARY_EXTRACTION_LANGUAGE,
  buildPageBatches,
  extractionSummaryContract,
  languagePolicyFor,
  normalizePageCount,
  pageExtractionRecordContract,
  queueTaskContract,
} = require('./extraction_policy');

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

function valueExists(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function getField(data, keys, fallback = null) {
  for (const key of keys) {
    if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
  }
  return fallback;
}

function normalizeId(value) {
  return String(value || '').trim();
}

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function detectLanguage(data) {
  const explicit = getField(data, ['language', 'lang', 'documentLanguage', 'sourceLanguage'], '');
  if (explicit) {
    const normalized = lower(explicit);
    if (['en', 'eng', 'english'].includes(normalized)) return 'en';
    if (['hi', 'hin', 'hindi'].includes(normalized)) return 'hi';
    return normalized;
  }
  const name = lower(getField(data, ['file_name', 'fileName', 'name', 'title'], ''));
  if (name.includes('hindi') || name.includes('हिंदी')) return 'hi';
  if (name.includes('english') || name.includes('eng ')) return 'en';
  return 'unknown';
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
  if (hay.includes('notification') || hay.includes('notice')) return 'notification';
  if (hay.includes('syllabus') || hay.includes('paper 1') || hay.includes('paper 2')) return 'syllabus';
  if (hay.includes('pyq') || hay.includes('previous year')) return 'pyq';
  if (hay.includes('study') || hay.includes('material')) return 'study_material';
  if (hay.includes('update')) return 'update_notice';
  return explicit || 'other_official_document';
}

function storagePath(data) {
  return getField(data, [
    'storagePath',
    'storage_path',
    'storageRawPath',
    'sourcePath',
    'source_path',
    'sourceUrl',
    'downloadUrl',
    'filePath',
    'url',
  ], '');
}

function pageCount(data) {
  return normalizePageCount(getField(data, [
    'page_count',
    'pageCount',
    'totalPages',
    'total_pages',
    'pagesCount',
    'numPages',
  ], null));
}

function pageNumberFromRecord(id, data) {
  const direct = Number(getField(data, [
    'page_number',
    'pageNumber',
    'page',
    'number',
    'source_page_number',
    'sourcePageNumber',
  ], NaN));
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const fromId = String(id || '').match(/(\d+)$/);
  if (fromId) return Number(fromId[1]);
  return null;
}

function pageArrays(data) {
  const candidates = [];
  for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages', 'pageWiseExtraction']) {
    if (Array.isArray(data[key])) candidates.push(...data[key]);
  }
  for (const parent of ['aiResult', 'rawData', 'result', 'extraction']) {
    if (data[parent] && typeof data[parent] === 'object') {
      for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages']) {
        if (Array.isArray(data[parent][key])) candidates.push(...data[parent][key]);
      }
    }
  }
  return candidates;
}

function hasTextExtraction(data) {
  return valueExists(getField(data, [
    'extractedText',
    'parsedText',
    'rawText',
    'text',
    'markdown',
    'extractedMarkdown',
    'searchableText',
    'combinedText',
    'combinedMarkdown',
  ], null));
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
  return /official|notification|notice|syllabus|pyq|study material|paper|document|pdf|json/.test(hay);
}

function docKeys(doc) {
  return [
    doc.id,
    doc.documentId,
    doc.document_id,
    doc.docId,
    doc.sourceId,
    doc.source_id,
    doc.refineryId,
    doc.fileHash,
    doc.hash,
  ].map(normalizeId).filter(Boolean);
}

function relationMatch(record, keys, missionId) {
  const recordKeys = docKeys(record);
  const keyMatch = keys.some(key => recordKeys.includes(key) || record.id === key);
  const directMission = [
    record.missionId,
    record.mission_id,
    record.realmId,
    record.recruitmentId,
  ].map(normalizeId).includes(missionId);
  return keyMatch || directMission;
}

function statusOf(record) {
  return getField(record, [
    'status',
    'aiQueueStatus',
    'extraction_status',
    'extractionStatus',
    'text_extraction_status',
    'textExtractionStatus',
    'last_successful_stage',
  ], 'unknown');
}

function classify({ pageCountKnown, extractedPages, missingPagesCount, textExtracted, storage, queueExists, queueStatus, languagePolicy, firstPageOnly, tokenRisk }) {
  if (languagePolicy.language_policy_status !== 'primary_extraction_allowed') return 'LANGUAGE_POLICY_WARNING';
  if (!storage) return 'STORAGE_PATH_MISSING';
  if (!pageCountKnown) return 'PAGE_COUNT_UNKNOWN';
  if (!queueExists && !textExtracted && extractedPages === 0) return 'QUEUE_MISSING';
  if (queueExists && ['queued', 'processing', 'running', 'structured'].includes(lower(queueStatus)) && !textExtracted && extractedPages === 0) return 'QUEUED_BUT_STUCK';
  if (firstPageOnly) return 'FIRST_PAGE_ONLY';
  if (extractedPages === 0 && !textExtracted) return 'NOT_EXTRACTED';
  if (missingPagesCount > 0 || tokenRisk) return 'PARTIALLY_EXTRACTED';
  return 'FULLY_EXTRACTED';
}

async function scanRootCollection(db, collectionName) {
  const out = [];
  const snap = await db.collection(collectionName).get();
  snap.forEach(doc => out.push({ id: doc.id, __source: collectionName, __path: `${collectionName}/${doc.id}`, ...doc.data() }));
  return out;
}

async function getPageExtractionPages(docRef) {
  try {
    const snap = await docRef.collection('page_extractions').get();
    const pages = [];
    snap.forEach(doc => {
      const data = doc.data();
      const page = pageNumberFromRecord(doc.id, data);
      if (page) pages.push(page);
    });
    return [...new Set(pages)].sort((a, b) => a - b);
  } catch (e) {
    return [];
  }
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH X1 - UNIVERSAL PAGE-WISE EXTRACTION AUDIT & CHUNKING POLICY');
  console.log('================================================================================');
  console.log('Mode: READ ONLY - no extraction, no Firestore writes, no atoms, no publish, no approval, no generation, no deploy');
  console.log(`Primary extraction language policy: ${PRIMARY_EXTRACTION_LANGUAGE}`);
  console.log('Document value principle: every page must be extracted; large documents require batches/chunks.');

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  const missionSnap = await db.collection('mission_realms').get();
  const officialDocs = [];
  for (const missionDoc of missionSnap.docs) {
    const missionId = missionDoc.id;
    const missionData = missionDoc.data();
    if (Array.isArray(missionData.officialDocuments)) {
      missionData.officialDocuments.forEach((doc, idx) => {
        officialDocs.push({
          id: doc.id || doc.documentId || doc.docId || `root_official_${idx}`,
          mission_id: missionId,
          __source: 'mission_root.officialDocuments',
          __path: `mission_realms/${missionId}.officialDocuments[${idx}]`,
          __ref: null,
          ...doc,
        });
      });
    }
    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => {
      officialDocs.push({
        id: doc.id,
        mission_id: missionId,
        __source: 'mission_realms.official_documents',
        __path: doc.ref.path,
        __ref: doc.ref,
        ...doc.data(),
      });
    });
  }

  const ingestion = await scanRootCollection(db, 'ingestion_refinery');
  const sourceDocs = await scanRootCollection(db, 'source_documents');
  const aiQueue = await scanRootCollection(db, 'ai_queue');

  for (const record of [...ingestion, ...sourceDocs]) {
    if (!isOfficialLike(record)) continue;
    const missionId = normalizeId(getField(record, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], ''));
    const keys = docKeys(record);
    const existing = officialDocs.some(doc => keys.length > 0 && docKeys(doc).some(key => keys.includes(key)));
    if (!existing) {
      officialDocs.push({
        ...record,
        mission_id: missionId || 'unknown',
        __ref: null,
      });
    }
  }

  const merged = new Map();
  for (const doc of officialDocs) {
    const missionId = normalizeId(getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown'));
    const key = `${missionId}::${doc.id}`;
    merged.set(key, { ...(merged.get(key) || {}), ...doc, mission_id: missionId });
  }

  const reports = [];
  for (const doc of merged.values()) {
    const missionId = normalizeId(getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown'));
    const keys = docKeys(doc);
    const relatedIngestion = ingestion.filter(record => relationMatch(record, keys, missionId));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, keys, missionId));
    const relatedQueue = aiQueue.filter(record => relationMatch(record, keys, missionId));
    const combined = [doc, ...relatedIngestion, ...relatedSource, ...relatedQueue];
    const subcollectionPages = doc.__ref ? await getPageExtractionPages(doc.__ref) : [];
    const inlinePages = [];
    for (const record of combined) {
      for (const pageRecord of pageArrays(record)) {
        const page = pageNumberFromRecord('', pageRecord);
        if (page) inlinePages.push(page);
      }
    }
    const extractedPageNumbers = [...new Set([...subcollectionPages, ...inlinePages])].sort((a, b) => a - b);
    const knownPageCount = combined.map(pageCount).find(Boolean) || null;
    const extractedPagesCount = extractedPageNumbers.length;
    const missingPages = knownPageCount
      ? Array.from({ length: knownPageCount }, (_, i) => i + 1).filter(n => !extractedPageNumbers.includes(n))
      : [];
    const storage = combined.map(storagePath).find(Boolean) || '';
    const language = detectLanguage(doc);
    const languagePolicy = languagePolicyFor(language, true);
    const textExtracted = combined.some(hasTextExtraction) || extractedPagesCount > 0;
    const queueStatuses = relatedQueue.map(statusOf);
    const queueExists = relatedQueue.length > 0;
    const firstPageOnly = knownPageCount && knownPageCount > 1 && extractedPageNumbers.length === 1 && extractedPageNumbers[0] === 1;
    const tokenRisk = (knownPageCount && knownPageCount > 5 && extractedPagesCount > 0 && missingPages.length > 0)
      || relatedQueue.some(q => /token|limit|context|quota/i.test([q.error, q.errorMessage, q.reason, q.warning].filter(Boolean).join(' ')));
    const batches = knownPageCount ? buildPageBatches(knownPageCount) : [];
    const classification = classify({
      pageCountKnown: Boolean(knownPageCount),
      extractedPages: extractedPagesCount,
      missingPagesCount: missingPages.length,
      textExtracted,
      storage,
      queueExists,
      queueStatus: queueStatuses.join(', '),
      languagePolicy,
      firstPageOnly,
      tokenRisk,
    });
    const needsBatch = Boolean(knownPageCount) && (missingPages.length > 0 || extractedPagesCount === 0) && languagePolicy.language_policy_status === 'primary_extraction_allowed';
    const nextRequiredAction = !knownPageCount
      ? 'page_count_detection'
      : classification === 'LANGUAGE_POLICY_WARNING'
        ? 'founder_language_policy_review'
        : needsBatch
          ? 'dry_run_pagewise_batch_queue_recommendation'
          : classification === 'FULLY_EXTRACTED'
            ? 'none'
            : 'metadata_or_queue_linkage_review';

    const sampleTask = needsBatch && batches.length > 0
      ? queueTaskContract({
        missionId,
        documentId: doc.id,
        documentType: detectDocumentType(doc),
        language,
        sourcePath: storage,
        pageStart: batches[0].page_start,
        pageEnd: batches[0].page_end,
        pageBatchIndex: batches[0].page_batch_index,
        totalBatches: batches[0].total_batches,
      })
      : null;

    reports.push({
      mission_id: missionId,
      document_id: doc.id,
      file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'),
      document_type: detectDocumentType(doc),
      category: getField(doc, ['category', 'documentCategory'], 'N/A'),
      syllabus_role: getField(doc, ['syllabus_role', 'syllabusRole'], 'N/A'),
      pyq_role: getField(doc, ['pyq_role', 'pyqRole'], 'N/A'),
      notification_role: getField(doc, ['notification_role', 'notificationRole'], 'N/A'),
      language,
      language_policy_status: languagePolicy.language_policy_status,
      extraction_blocked_reason: languagePolicy.extraction_blocked_reason,
      storage_path_or_source_url: storage || 'MISSING',
      mime_type: getField(doc, ['mimeType', 'contentType', 'fileType'], 'unknown'),
      page_count: knownPageCount || 'unknown',
      extracted_pages_count: extractedPagesCount,
      missing_pages_count: knownPageCount ? missingPages.length : 'unknown',
      missing_pages_sample: missingPages.slice(0, 20),
      pagewise_extraction_status: extractedPagesCount === 0
        ? 'none'
        : knownPageCount && missingPages.length === 0
          ? 'complete'
          : 'partial',
      text_extraction_status: textExtracted ? 'text_available' : 'text_missing',
      ai_queue_task_exists: queueExists,
      ai_queue_status: queueStatuses.join(', ') || 'N/A',
      first_page_only_risk: Boolean(firstPageOnly),
      token_limit_risk: Boolean(tokenRisk),
      batch_policy: knownPageCount
        ? {
          total_batches: batches.length,
          first_batch: batches[0] || null,
          last_batch: batches[batches.length - 1] || null,
        }
        : null,
      dry_run_sample_queue_task: sampleTask,
      classification,
      next_required_action: nextRequiredAction,
      related_records: {
        ingestion_refinery: relatedIngestion.map(r => r.id),
        source_documents: relatedSource.map(r => r.id),
        ai_queue: relatedQueue.map(r => r.id),
        page_extractions_subcollection_pages: subcollectionPages.length,
      },
    });
  }

  reports.sort((a, b) => `${a.mission_id}/${a.file_name}`.localeCompare(`${b.mission_id}/${b.file_name}`));

  const counts = {
    total_official_documents_audited: reports.length,
    fully_extracted: reports.filter(r => r.classification === 'FULLY_EXTRACTED').length,
    not_extracted: reports.filter(r => r.classification === 'NOT_EXTRACTED').length,
    partially_extracted: reports.filter(r => r.classification === 'PARTIALLY_EXTRACTED').length,
    page_count_unknown: reports.filter(r => r.classification === 'PAGE_COUNT_UNKNOWN' || r.page_count === 'unknown').length,
    first_page_only_risk: reports.filter(r => r.first_page_only_risk).length,
    token_limit_risk: reports.filter(r => r.token_limit_risk).length,
    needing_batch_extraction: reports.filter(r => r.next_required_action === 'dry_run_pagewise_batch_queue_recommendation').length,
    language_policy_warnings: reports.filter(r => r.classification === 'LANGUAGE_POLICY_WARNING' || r.language_policy_status !== 'primary_extraction_allowed').length,
    queue_missing: reports.filter(r => r.classification === 'QUEUE_MISSING').length,
    storage_path_missing: reports.filter(r => r.classification === 'STORAGE_PATH_MISSING').length,
  };

  const rpscReports = reports.filter(r => r.mission_id === RPSC_MISSION_ID);
  const rpscExpectedNames = ['gk atomic', 'english', 'hindi', 'gk paper', 'notification'];

  console.log('\nPART A - Universal document audit');
  for (const report of reports) {
    console.log('\n---');
    console.log(JSON.stringify(report, null, 2));
  }

  console.log('\nPART B - Page batch policy');
  console.log(JSON.stringify({
    PAGE_BATCH_SIZE_DEFAULT: 5,
    PAGE_BATCH_SIZE_LARGE_DOC: 3,
    MAX_PAGES_PER_TASK: 5,
    MAX_RETRY_PER_BATCH: 3,
    rules: [
      '1 to 5 pages: one pagewise extraction task',
      '6 to 50 pages: split into 5-page batches',
      '51+ pages: split into 3-page batches',
      'page_count unknown: first run page_count_detection task',
      'failed batch does not block already extracted pages',
      'final status complete only when every page has a page_extractions record',
    ],
  }, null, 2));

  console.log('\nPART C - Queue task contract');
  console.log(JSON.stringify({
    output_path: 'mission_realms/{missionId}/official_documents/{documentId}/page_extractions/{pageNumber}',
    queue_task_contract: queueTaskContract({
      missionId: '{missionId}',
      documentId: '{documentId}',
      documentType: '{documentType}',
      language: '{language}',
      sourcePath: '{sourcePath}',
      pageStart: 1,
      pageEnd: 5,
      pageBatchIndex: 1,
      totalBatches: 1,
    }),
    page_extraction_record_contract: pageExtractionRecordContract(),
  }, null, 2));

  console.log('\nPART D - Combined final extraction view contract');
  console.log(JSON.stringify({
    output_path: 'mission_realms/{missionId}/official_documents/{documentId}/extraction_summary/latest',
    extraction_summary_contract: extractionSummaryContract(),
    founder_ui_requirements: [
      'page list',
      'page-wise extracted text/explanation',
      'missing/failed page indicators',
      'combined full document extraction preview',
      'send back/retry per page or per batch',
    ],
  }, null, 2));

  console.log('\nPART E - English-first upload policy');
  console.log(JSON.stringify({
    PRIMARY_EXTRACTION_LANGUAGE,
    future_english_documents: 'allow normal extraction',
    future_hindi_documents: {
      language_policy_status: 'requires_english_source_or_translation_workflow',
      extraction_blocked_reason: 'primary_extraction_requires_english_source',
    },
    existing_hindi_documents: 'audit with LANGUAGE_POLICY_WARNING; do not delete; do not process without Founder legacy exception',
    translation: 'not performed in X1',
  }, null, 2));

  console.log('\nPART F - RPSC specific audit');
  console.log(JSON.stringify({
    target_mission: RPSC_MISSION_ID,
    expected_document_groups_checked: rpscExpectedNames,
    documents_found: rpscReports.length,
    english_docs: rpscReports.filter(r => r.language === 'en').map(r => ({ id: r.document_id, file_name: r.file_name, next_required_action: r.next_required_action })),
    hindi_or_unknown_docs: rpscReports.filter(r => r.language !== 'en').map(r => ({ id: r.document_id, file_name: r.file_name, language: r.language, language_policy_status: r.language_policy_status, next_required_action: r.next_required_action })),
    need_page_count_detection: rpscReports.filter(r => r.next_required_action === 'page_count_detection').map(r => ({ id: r.document_id, file_name: r.file_name })),
    need_batch_extraction: rpscReports.filter(r => r.next_required_action === 'dry_run_pagewise_batch_queue_recommendation').map(r => ({ id: r.document_id, file_name: r.file_name, page_count: r.page_count })),
    not_suitable_under_english_first_policy: rpscReports.filter(r => r.language_policy_status !== 'primary_extraction_allowed').map(r => ({ id: r.document_id, file_name: r.file_name, language: r.language, reason: r.extraction_blocked_reason })),
    all_rpsc_documents: rpscReports,
  }, null, 2));

  console.log('\nSUMMARY COUNTS');
  console.log(JSON.stringify(counts, null, 2));

  console.log('\nRecommended next queue patch: PATCH X2 - Batch Page-wise Extraction Queue Apply');
  console.log('\nConfirmations:');
  console.log('- no extraction run');
  console.log('- no atoms created');
  console.log('- no publish');
  console.log('- no approval');
  console.log('- no generation');
  console.log('- no Firebase deploy');
  console.log('- VESTA untouched');
  console.log('\nFinal verdict: PATCH_X1_UNIVERSAL_EXTRACTION_AUDIT_AND_CHUNKING_POLICY_READY');
}

main().catch((e) => {
  console.error('PATCH_X1_BLOCKED');
  console.error(e);
  process.exit(1);
});
