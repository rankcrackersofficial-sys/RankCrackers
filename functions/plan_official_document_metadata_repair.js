const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const RPSC_MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';

// Strict dry-run checker
const args = process.argv.slice(2);
if (!args.includes('--dry-run')) {
  console.error('DRY_RUN_REQUIRED_FOR_RC_X3M');
  process.exit(1);
}

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

function inferCandidateMissions(fileName, currentPath) {
  const hay = `${normalize(fileName)} ${normalize(currentPath)}`.toLowerCase();
  const candidates = [];

  if (hay.includes('jee')) {
    candidates.push({ mission_id: 'jee_main_2026', confidence: 'high' });
  }
  if (hay.includes('neet')) {
    candidates.push({ mission_id: 'neet_(ug)-2027', confidence: 'high' });
  }
  if (hay.includes('rpsc') || hay.includes('1st grade') || hay.includes('first grade') || hay.includes('gk') || hay.includes('english 2nd paper')) {
    candidates.push({ mission_id: RPSC_MISSION_ID, confidence: 'high' });
  } else if (hay.includes('hindi')) {
    // Hindi syllabus or notice could be RPSC candidate
    candidates.push({ mission_id: RPSC_MISSION_ID, confidence: 'medium' });
  }
  if (hay.includes('ras')) {
    candidates.push({ mission_id: 'AUTO_DETECT', confidence: 'high' });
  }

  return candidates;
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X3M - OFFICIAL DOCUMENT SOURCE METADATA REPAIR PLANNER');
  console.log('================================================================================');
  console.log('Mode: DRY RUN (READ ONLY)');

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
      mData.officialDocuments.forEach((doc, idx) => docs.push({ id: doc.id || doc.documentId || doc.docId || `root_official_${idx}`, mission_id: missionId, mission_title: getField(mData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A'), __source: 'mission_root.officialDocuments', __ref: null, ...doc }));
    }
    const subSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    subSnap.forEach(doc => docs.push({ id: doc.id, mission_id: missionId, mission_title: getField(mData, ['title', 'name', 'examTitle', 'missionTitle'], 'N/A'), __source: 'mission_realms.official_documents', __ref: doc.ref, ...doc.data() }));
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

  const blockedDocs = [];
  for (const doc of officialDocs) {
    const relatedIngestion = ingestion.filter(record => relationMatch(record, doc));
    const relatedSource = sourceDocs.filter(record => relationMatch(record, doc));
    const combined = [doc, ...relatedIngestion, ...relatedSource];
    const sourcePath = combined.map(storagePath).find(Boolean) || '';
    const missionId = getField(doc, ['mission_id', 'missionId'], 'unknown');
    const docType = detectDocumentType(doc);

    const isBlocked = isMissingId(missionId) || !sourcePath;

    if (isBlocked) {
      const fileName = getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A');
      const missingFields = [];
      if (isMissingId(missionId)) missingFields.push('mission_id');
      if (!sourcePath) missingFields.push('source_path');

      const matches = inferCandidateMissions(fileName, sourcePath);

      let action = 'MARK_AS_NEEDS_FOUNDER_DECISION';
      let confidence = 'low';
      let bestMission = null;

      if (matches.length === 1) {
        bestMission = matches[0].mission_id;
        confidence = matches[0].confidence;
        action = 'SET_MISSION_ID';
      } else if (matches.length > 1) {
        confidence = 'low';
        action = 'MARK_AS_NEEDS_FOUNDER_DECISION'; // Block auto-repair due to ambiguity
      }

      // Special study material/historical filter
      if (docType === 'study material' && isMissingId(missionId) && lower(fileName).includes('partition')) {
        action = 'EXCLUDE_FROM_QUEUE_UNTIL_MISSION_CREATED';
        confidence = 'high';
      }

      const pathPreview = doc.__ref ? doc.__ref.path : `ingestion_refinery/${doc.id} or source_documents/${doc.id}`;
      let proposedPreview = '';
      if (action === 'SET_MISSION_ID' && bestMission) {
        proposedPreview = `db.doc("${pathPreview}").update({ missionId: "${bestMission}", mission_id: "${bestMission}" })`;
      } else if (action === 'EXCLUDE_FROM_QUEUE_UNTIL_MISSION_CREATED') {
        proposedPreview = `Exclude doc ${doc.id} from queue operations. Keep in repository under local storage.`;
      } else {
        proposedPreview = `Founder decision required to resolve metadata fields ${missingFields.join(', ')}`;
      }

      blockedDocs.push({
        blocked_doc_id: doc.id,
        file_name: fileName,
        current_metadata: {
          mission_id: missionId,
          source_path: sourcePath || 'MISSING',
          document_type: docType,
        },
        missing_fields: missingFields,
        candidate_missions: matches.map(m => m.mission_id),
        confidence,
        proposed_repair_action: action,
        proposed_patch_command_preview: proposedPreview,
        risk_level: confidence === 'high' ? 'low' : confidence === 'medium' ? 'medium' : 'high',
        founder_decision_required: action === 'MARK_AS_NEEDS_FOUNDER_DECISION',
      });
    }
  }

  // Find orphaned tasks
  const orphanedTasks = [];
  for (const task of activeTasks) {
    const matchedDoc = officialDocs.find(doc => doc.id === task.document_id && doc.mission_id === task.mission_id);
    if (!matchedDoc) {
      // Find possible matching document by document_id only
      const possibleDoc = officialDocs.find(doc => doc.id === task.document_id);
      let recommendedAction = 'FOUNDER_DECISION_REQUIRED';
      if (possibleDoc) {
        recommendedAction = 'LINK_TASK_TO_OFFICIAL_DOCUMENT_AFTER_METADATA_REPAIR';
      } else {
        recommendedAction = 'CANCEL_OR_ARCHIVE_DUPLICATE_TASK';
      }

      orphanedTasks.push({
        task_id: task.id,
        mission_id: task.mission_id,
        document_id: task.document_id,
        source_document_id: task.source_document_id || 'N/A',
        source_path: task.source_path || 'N/A',
        task_status: task.status,
        possible_matching_doc: possibleDoc ? { id: possibleDoc.id, file_name: getField(possibleDoc, ['file_name', 'fileName', 'name', 'title'], 'N/A') } : null,
        recommended_action: recommendedAction,
      });
    }
  }

  console.log('\n--- Blocked Documents Analysis ---\n');
  for (const doc of blockedDocs) {
    console.log(JSON.stringify(doc, null, 2));
    console.log('---');
  }

  console.log('\n--- Orphaned Tasks Analysis ---\n');
  for (const task of orphanedTasks) {
    console.log(JSON.stringify(task, null, 2));
    console.log('---');
  }

  const highConf = blockedDocs.filter(d => d.confidence === 'high');
  const medConf = blockedDocs.filter(d => d.confidence === 'medium');
  const lowConf = blockedDocs.filter(d => d.confidence === 'low' || d.founder_decision_required);

  const safeRepairs = blockedDocs.filter(d => d.proposed_repair_action === 'SET_MISSION_ID' && d.confidence === 'high');
  const proposedExclusions = blockedDocs.filter(d => d.proposed_repair_action === 'EXCLUDE_FROM_QUEUE_UNTIL_MISSION_CREATED');

  console.log('\n==============================================');
  console.log('SUMMARY REPORT');
  console.log('==============================================');
  console.log(`1. Total blocked official docs reviewed: ${blockedDocs.length}`);
  console.log(`2. Blocked docs by type: ${JSON.stringify(blockedDocs.reduce((acc, curr) => {
    acc[curr.current_metadata.document_type] = (acc[curr.current_metadata.document_type] || 0) + 1;
    return acc;
  }, {}), null, 2)}`);
  console.log(`3. High-confidence repair candidates: ${highConf.length}`);
  console.log(`4. Medium-confidence repair candidates: ${medConf.length}`);
  console.log(`5. Low-confidence / Founder decision candidates: ${lowConf.length}`);
  console.log(`6. Orphaned tasks reviewed: ${orphanedTasks.length}`);
  console.log(`7. Proposed safe repairs count: ${safeRepairs.length}`);
  console.log(`8. Proposed exclusions count: ${proposedExclusions.length}`);

  const rpscRepairs = blockedDocs.filter(d => d.candidate_missions.includes(RPSC_MISSION_ID) || d.file_name.toLowerCase().includes('1st grade') || d.file_name.toLowerCase().includes('rpsc'));
  console.log(`9. RPSC repair summary:`);
  console.log(JSON.stringify(rpscRepairs.map(d => ({ file_name: d.file_name, action: d.proposed_repair_action, confidence: d.confidence })), null, 2));

  const rasRepairs = blockedDocs.filter(d => d.candidate_missions.includes('AUTO_DETECT') || d.file_name.toLowerCase().includes('ras'));
  console.log(`10. RAS repair summary:`);
  console.log(JSON.stringify(rasRepairs.map(d => ({ file_name: d.file_name, action: d.proposed_repair_action, confidence: d.confidence })), null, 2));

  const studyRepairs = blockedDocs.filter(d => d.current_metadata.document_type === 'study material');
  console.log(`11. Study material repair summary:`);
  console.log(JSON.stringify(studyRepairs.map(d => ({ file_name: d.file_name, action: d.proposed_repair_action, confidence: d.confidence })), null, 2));

  const recommendedNextPatch = safeRepairs.length > 0
    ? 'RC-X3M-A - Safe Metadata Repair Apply'
    : lowConf.length > 0
      ? 'RC-X3D - Founder decisions required first'
      : 'RC-X3W - Page Count Detection Worker Implementation';
  console.log(`\n12. Recommended next patch: ${recommendedNextPatch}`);

  console.log('\nRC_X3M_METADATA_REPAIR_PLAN_READY');
}

main().catch(e => {
  console.error('\nRC_X3M_BLOCKED');
  console.error(e);
  process.exit(1);
});
