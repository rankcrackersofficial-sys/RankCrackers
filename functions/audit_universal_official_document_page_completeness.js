const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  PRIMARY_EXTRACTION_LANGUAGE,
  languagePolicyFor,
  normalizePageCount,
  buildPageBatches,
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

async function scanRootCollection(db, collectionName) {
  const out = [];
  const snap = await db.collection(collectionName).get();
  snap.forEach(doc => out.push({ id: doc.id, __source: collectionName, __path: `${collectionName}/${doc.id}`, ...doc.data() }));
  return out;
}

async function getPageExtractionsDetail(docRef) {
  try {
    const snap = await docRef.collection('page_extractions').get();
    const pages = [];
    const failed = [];
    const empty = [];
    snap.forEach(doc => {
      const data = doc.data();
      const page = pageNumberFromRecord(doc.id, data);
      if (page) {
        pages.push(page);
        if (data.extraction_status === 'failed') failed.push(page);
        if (data.extraction_status === 'empty' || data.is_empty_page === true) empty.push(page);
      }
    });
    return {
      extracted: [...new Set(pages)].sort((a, b) => a - b),
      failed: [...new Set(failed)].sort((a, b) => a - b),
      empty: [...new Set(empty)].sort((a, b) => a - b),
    };
  } catch (e) {
    return { extracted: [], failed: [], empty: [] };
  }
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

function checkFixedPageLimitRules() {
  const functionsPath = path.join(__dirname);
  const jsFiles = listAllJsFiles(functionsPath);
  let noFixedPageLimitRuleActive = true;
  let batchSizeIsNotPageLimit = true;
  const prohibitedPatterns = [
    /only first page/i,
    /first 5 pages only/i,
    /max 10 pages report/i,
    /ignore pages after/i,
    /truncate document pages/i,
  ];

  for (const file of jsFiles) {
    const basename = path.basename(file);
    if (basename === 'audit_universal_official_document_page_completeness.js') continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of prohibitedPatterns) {
      if (pattern.test(content)) {
        noFixedPageLimitRuleActive = false;
        batchSizeIsNotPageLimit = false;
        console.error(`Blocker: Prohibited rule pattern ${pattern} found in ${file}`);
      }
    }
  }

  return { noFixedPageLimitRuleActive, batchSizeIsNotPageLimit };
}

function classify({
  pageCountKnown,
  totalPages,
  extractedPagesCount,
  missingPagesCount,
  failedPagesCount,
  verified,
  hasStructured,
  hasAtoms,
  sourceChainComplete,
  published,
}) {
  if (!pageCountKnown) return 'PAGE_COUNT_UNKNOWN';
  if (extractedPagesCount === 0) return 'PAGEWISE_EXTRACTION_NOT_STARTED';
  if (totalPages > 1 && extractedPagesCount === 1 && missingPagesCount > 0) return 'FIRST_PAGE_ONLY_BLOCKED';
  if (missingPagesCount > 0 || failedPagesCount > 0) return 'PAGEWISE_EXTRACTION_PARTIAL';
  
  if (!verified) return 'FOUNDER_VERIFICATION_PENDING';
  
  if (published && !sourceChainComplete) return 'PUBLICATION_BLOCKED_SOURCE_CHAIN_INCOMPLETE';
  if (!hasStructured) return 'READY_FOR_STRUCTURED_EXTRACTION';
  if (!hasAtoms) return 'READY_FOR_ATOM_EXTRACTION';
  if (!sourceChainComplete) return 'PUBLICATION_BLOCKED_SOURCE_CHAIN_INCOMPLETE';
  
  return 'READY_FOR_PUBLICATION';
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X2 - UNIVERSAL OFFICIAL DOCUMENT PAGE COMPLETENESS GUARD');
  console.log('================================================================================');
  console.log('Mode: READ ONLY - no Firestore writes, no task creation, no Firebase deploy');

  const { noFixedPageLimitRuleActive, batchSizeIsNotPageLimit } = checkFixedPageLimitRules();
  console.log(`NO_FIXED_PAGE_LIMIT_RULE_ACTIVE = ${noFixedPageLimitRuleActive}`);
  console.log(`BATCH_SIZE_IS_NOT_PAGE_LIMIT = ${batchSizeIsNotPageLimit}`);
  console.log('FOUNDER_VERIFICATION_REQUIRED_BEFORE_PUBLISH = true');

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
        const docId = doc.id || doc.documentId || doc.docId || `root_official_${idx}`;
        officialDocs.push({
          id: docId,
          mission_id: missionId,
          mission_title: missionData.title || 'N/A',
          __source: 'mission_root.officialDocuments',
          __path: `mission_realms/${missionId}.officialDocuments[${idx}]`,
          __ref: db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId),
          ...doc,
        });
      });
    }
    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => {
      officialDocs.push({
        id: doc.id,
        mission_id: missionId,
        mission_title: missionData.title || 'N/A',
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
    const missionId = normalizeId(getField(record, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], ''));
    const keys = docKeys(record);
    const existing = officialDocs.some(doc => keys.length > 0 && docKeys(doc).some(key => keys.includes(key)));
    if (!existing) {
      const docId = record.id || record.documentId || record.document_id || record.docId || record.sourceId || record.source_id;
      officialDocs.push({
        ...record,
        mission_id: missionId || 'unknown',
        mission_title: 'N/A',
        __ref: (missionId && missionId !== 'unknown' && docId) ? db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId) : null,
      });
    }
  }

  const merged = new Map();
  for (const doc of officialDocs) {
    const missionId = normalizeId(getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown'));
    const key = `${missionId}::${doc.id}`;
    const existing = merged.get(key) || {};
    merged.set(key, { ...existing, ...doc, __ref: doc.__ref || existing.__ref, mission_id: missionId });
  }

  const reports = [];
  const blockers = [];

  if (!noFixedPageLimitRuleActive || !batchSizeIsNotPageLimit) {
    blockers.push('FIXED_PAGE_LIMIT_POLICY_DETECTED');
  }

  for (const doc of merged.values()) {
    const missionId = normalizeId(getField(doc, ['mission_id', 'missionId', 'realmId', 'recruitmentId'], 'unknown'));
    const keys = docKeys(doc);
    const relatedIngestion = ingestion.filter(record => relationMatch(record, keys, missionId));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, keys, missionId));
    const relatedQueue = aiQueue.filter(record => relationMatch(record, keys, missionId));

    const combined = [doc, ...relatedIngestion, ...relatedSource, ...relatedQueue];
    
    // Page details
    const pageDetails = doc.__ref ? await getPageExtractionsDetail(doc.__ref) : { extracted: [], failed: [], empty: [] };
    const inlinePages = [];
    for (const record of combined) {
      for (const pageRecord of pageArrays(record)) {
        const page = pageNumberFromRecord('', pageRecord);
        if (page) inlinePages.push(page);
      }
    }
    const extractedPageNumbers = [...new Set([...pageDetails.extracted, ...inlinePages])].sort((a, b) => a - b);
    const knownPageCount = combined.map(pageCount).find(Boolean) || null;
    const extractedPagesCount = extractedPageNumbers.length;

    const missingPages = knownPageCount
      ? Array.from({ length: knownPageCount }, (_, i) => i + 1).filter(n => !extractedPageNumbers.includes(n))
      : [];

    const storage = combined.map(storagePath).find(Boolean) || '';
    const language = detectLanguage(doc);
    const document_type = detectDocumentType(doc);

    const firstPageOnly = knownPageCount && knownPageCount > 1 && extractedPagesCount === 1 && extractedPageNumbers[0] === 1;

    // Check status
    const verifiedStatus = getField(doc, ['verification_status', 'verificationStatus', 'verified', 'founderApproved', 'founder_approved'], null);
    const isVerified = verifiedStatus === 'verified' || verifiedStatus === true;

    const extractionStage = getField(doc, ['extraction_status', 'extractionStatus', 'last_successful_stage'], '');
    const hasStructured = extractionStage === 'structured' || extractionStage === 'pyq_extracted' || extractionStage === 'syllabus_extracted';

    // Verify atoms linked
    let hasAtoms = false;
    let sourceChainComplete = true;
    if (doc.__ref) {
      const atomsSnap = await doc.__ref.parent.parent.collection('syllabus_atoms').where('source_document_id', '==', doc.id).get();
      if (atomsSnap.size > 0) {
        hasAtoms = true;
        atomsSnap.forEach(atomDoc => {
          const atomData = atomDoc.data();
          const atomVerified = atomData.verification_status === 'verified' || atomData.verified === true;
          if (!atomVerified) sourceChainComplete = false;
        });
      }
    }

    const published = doc.published === true;

    const classification = classify({
      pageCountKnown: Boolean(knownPageCount),
      totalPages: knownPageCount,
      extractedPagesCount,
      missingPagesCount: missingPages.length,
      failedPagesCount: pageDetails.failed.length,
      verified: isVerified,
      hasStructured,
      hasAtoms,
      sourceChainComplete,
      published,
    });

    const page_count_detection_needed = !knownPageCount;
    const pagewise_batch_queue_needed = Boolean(knownPageCount) && extractedPagesCount < knownPageCount;
    const founder_verification_needed = !isVerified;

    let publish_blocked_reason = null;
    if (classification !== 'READY_FOR_PUBLICATION') {
      publish_blocked_reason = `Blocked due to status: ${classification}`;
    }

    reports.push({
      mission_id: missionId,
      mission_title: doc.mission_title,
      document_id: doc.id,
      source_document_id: getField(doc, ['source_document_id', 'sourceDocumentId'], 'N/A'),
      file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'),
      document_type,
      storage_path_or_source_url: storage || 'MISSING',
      language,
      page_count_status: knownPageCount ? 'known' : 'unknown',
      total_pages: knownPageCount || 'unknown',
      extracted_pages_count: extractedPagesCount,
      expected_pages_range: knownPageCount ? `1-${knownPageCount}` : 'unknown',
      missing_pages: missingPages,
      failed_pages: pageDetails.failed,
      empty_pages: pageDetails.empty,
      first_page_only_risk: firstPageOnly,
      pagewise_extraction_status: extractedPagesCount === 0
        ? 'not_started'
        : knownPageCount && missingPages.length === 0
          ? 'complete'
          : 'partial',
      page_count_detection_needed,
      pagewise_batch_queue_needed,
      founder_verification_needed,
      publish_blocked_reason,
      classification,
    });
  }

  // Sorting
  reports.sort((a, b) => `${a.mission_id}/${a.file_name}`.localeCompare(`${b.mission_id}/${b.file_name}`));

  // Summaries
  const totalAudited = reports.length;
  const pageCountUnknown = reports.filter(r => r.classification === 'PAGE_COUNT_UNKNOWN').length;
  const pagewiseNotStarted = reports.filter(r => r.classification === 'PAGEWISE_EXTRACTION_NOT_STARTED').length;
  const partialExtraction = reports.filter(r => r.classification === 'PAGEWISE_EXTRACTION_PARTIAL' || r.pagewise_extraction_status === 'partial').length;
  const firstPageOnlyRisk = reports.filter(r => r.first_page_only_risk).length;
  const completeExtraction = reports.filter(r => r.pagewise_extraction_status === 'complete').length;
  const founderVerificationPending = reports.filter(r => r.classification === 'FOUNDER_VERIFICATION_PENDING').length;
  const publicationBlocked = reports.filter(r => r.publish_blocked_reason !== null).length;
  const readyForNextQueue = reports.filter(r => r.page_count_detection_needed || r.pagewise_batch_queue_needed).length;

  const docTypeCounts = {};
  reports.forEach(r => {
    docTypeCounts[r.document_type] = (docTypeCounts[r.document_type] || 0) + 1;
  });

  const rpscReports = reports.filter(r => r.mission_id === RPSC_MISSION_ID);

  console.log('\n--- Audited Official Documents Details ---');
  for (const report of reports) {
    console.log(JSON.stringify(report, null, 2));
    console.log('---');
  }

  console.log('\n==============================================');
  console.log('SUMMARY REPORT');
  console.log('==============================================');
  console.log(`1. Total official docs audited: ${totalAudited}`);
  console.log(`2. Count by document type: ${JSON.stringify(docTypeCounts, null, 2)}`);
  console.log(`3. Page count unknown count: ${pageCountUnknown}`);
  console.log(`4. Pagewise not started count: ${pagewiseNotStarted}`);
  console.log(`5. Partial extraction count: ${partialExtraction}`);
  console.log(`6. First-page-only risk count: ${firstPageOnlyRisk}`);
  console.log(`7. Complete pagewise extraction count: ${completeExtraction}`);
  console.log(`8. Founder verification pending count: ${founderVerificationPending}`);
  console.log(`9. Publication blocked count: ${publicationBlocked}`);
  console.log(`10. Documents ready for next queue step: ${readyForNextQueue}`);
  
  console.log(`\n11. RPSC mission document summary:`);
  console.log(JSON.stringify({
    mission_id: RPSC_MISSION_ID,
    documents_found: rpscReports.length,
    documents: rpscReports.map(r => ({
      id: r.document_id,
      file_name: r.file_name,
      document_type: r.document_type,
      classification: r.classification,
      pagewise_extraction_status: r.pagewise_extraction_status,
    })),
  }, null, 2));

  console.log(`\n12. Notification summary:`);
  console.log(JSON.stringify(reports.filter(r => r.document_type === 'notification').map(r => ({ id: r.document_id, classification: r.classification, file_name: r.file_name })), null, 2));

  console.log(`\n13. Syllabus summary:`);
  console.log(JSON.stringify(reports.filter(r => r.document_type === 'syllabus').map(r => ({ id: r.document_id, classification: r.classification, file_name: r.file_name })), null, 2));

  console.log(`\n14. PYQ summary:`);
  console.log(JSON.stringify(reports.filter(r => r.document_type === 'pyq').map(r => ({ id: r.document_id, classification: r.classification, file_name: r.file_name })), null, 2));

  console.log(`\n15. Study material summary:`);
  console.log(JSON.stringify(reports.filter(r => r.document_type === 'study material').map(r => ({ id: r.document_id, classification: r.classification, file_name: r.file_name })), null, 2));

  if (blockers.length > 0) {
    console.error('\nRC_X2_BLOCKED');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  } else {
    console.log('\nRC_X2_UNIVERSAL_PAGE_COMPLETENESS_AUDIT_READY');
  }
}

main().catch(e => {
  console.error('\nRC_X2_BLOCKED');
  console.error(e);
  process.exit(1);
});
