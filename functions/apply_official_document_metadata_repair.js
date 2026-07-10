const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const RPSC_MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';

const args = process.argv.slice(2);
const applyIndex = args.indexOf('--apply');
const isApplyMode = applyIndex !== -1 && args[applyIndex + 1] === 'CONFIRM_SAFE_OFFICIAL_METADATA_REPAIR';

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
    candidates.push({ mission_id: RPSC_MISSION_ID, confidence: 'medium' });
  }
  if (hay.includes('ras')) {
    candidates.push({ mission_id: 'AUTO_DETECT', confidence: 'high' });
  }

  return candidates;
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X3M-A - SAFE OFFICIAL DOCUMENT METADATA REPAIR APPLY');
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
  const sourceRefs = new Map(); // maps documentId -> ref path
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
      sourceRefs.set(`${missionId}::${doc.id}`, doc.ref);
    });
  }
  const ingestion = await scanCollection(db, 'ingestion_refinery');
  const sourceDocs = await scanCollection(db, 'source_documents');
  
  for (const record of [...ingestion, ...sourceDocs]) {
    if (!isOfficialLike(record)) continue;
    const missionId = normalize(getField(record, ['missionId', 'mission_id', 'realmId', 'recruitmentId'], 'unknown'));
    const keys = docKeys(record);
    const exists = docs.some(doc => keys.length > 0 && docKeys(doc).some(key => keys.includes(key)));
    if (!exists) {
      docs.push({ ...record, mission_id: missionId || 'unknown', mission_title: 'N/A', __ref: null });
    }
    const docKey = `${missionId}::${record.id}`;
    if (!sourceRefs.has(docKey)) {
      sourceRefs.set(docKey, db.doc(record.__path));
    }
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

  const safeRepairs = [];
  const safeExclusions = [];
  const skippedDocs = [];
  const writeOperations = [];

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
      const matches = inferCandidateMissions(fileName, sourcePath);

      let action = 'MARK_AS_NEEDS_FOUNDER_DECISION';
      let confidence = 'low';
      let bestMission = null;

      if (matches.length === 1) {
        bestMission = matches[0].mission_id;
        confidence = matches[0].confidence;
        action = 'SET_MISSION_ID';
      }

      if (docType === 'study material' && isMissingId(missionId) && lower(fileName).includes('partition')) {
        action = 'EXCLUDE_FROM_QUEUE_UNTIL_MISSION_CREATED';
        confidence = 'high';
      }

      const docKey = `${missionId}::${doc.id}`;
      const targetRef = sourceRefs.get(docKey);

      if (action === 'SET_MISSION_ID' && confidence === 'high' && bestMission) {
        const updatePayload = {
          mission_id: bestMission,
          missionId: bestMission,
          metadata_repair_status: 'safe_repaired',
          metadata_repaired_by_patch: 'RC-X3M-A',
          metadata_repair_reason: `High-confidence ${bestMission === RPSC_MISSION_ID ? 'RPSC First Grade' : 'AUTO_DETECT'} filename/path match`,
          metadata_repaired_at: Firestore.FieldValue.serverTimestamp(),
        };

        if (bestMission === 'AUTO_DETECT') {
          updatePayload.requires_founder_mission_assignment_before_publish = true;
          updatePayload.metadata_repair_reason = 'High-confidence RAS notification filename match; temporary AUTO_DETECT mission routing';
        }

        safeRepairs.push({ id: doc.id, file_name: fileName, path: targetRef ? targetRef.path : 'unknown', updates: updatePayload });
        if (targetRef) {
          writeOperations.push({ ref: targetRef, updates: updatePayload });
        }
      } else if (action === 'EXCLUDE_FROM_QUEUE_UNTIL_MISSION_CREATED' && confidence === 'high') {
        const updatePayload = {
          queue_exclusion_status: 'excluded_until_mission_created',
          queue_exclusion_reason: 'Historical study material has no mission_id; founder must create/assign mission before processing',
          queue_excluded_by_patch: 'RC-X3M-A',
          requires_founder_mission_assignment_before_queue: true,
          metadata_repaired_at: Firestore.FieldValue.serverTimestamp(),
        };

        safeExclusions.push({ id: doc.id, file_name: fileName, path: targetRef ? targetRef.path : 'unknown', updates: updatePayload });
        if (targetRef) {
          writeOperations.push({ ref: targetRef, updates: updatePayload });
        }
      } else {
        skippedDocs.push({ id: doc.id, file_name: fileName, path: targetRef ? targetRef.path : 'unknown', reason: 'FOUNDER_DECISION_REQUIRED_LOW_CONFIDENCE' });
      }
    }
  }

  // Orphaned task review
  let orphanedTaskFound = false;
  let possibleMatchingDocFound = false;
  const orphanedTask = activeTasks.find(t => t.id === 'rc_n3qa_page_count_RPSC_FIRST_GRADE2026_2026_1782713222215_mission_RPSC_FIRST_GRADE2026_2026_1782713222215_notification_3f230660dc55c863');
  if (orphanedTask) {
    orphanedTaskFound = true;
    const possibleDoc = officialDocs.find(doc => doc.id === orphanedTask.document_id);
    if (possibleDoc) {
      possibleMatchingDocFound = true;
    }
  }

  if (isApplyMode) {
    console.log('\nApplying updates to Firestore...');
    const batch = db.batch();
    for (const op of writeOperations) {
      console.log(`- Writing to: ${op.ref.path}`);
      batch.set(op.ref, op.updates, { merge: true });
    }
    await batch.commit();

    console.log('\n==============================================');
    console.log('APPLY OUTPUT');
    console.log('==============================================');
    console.log('1. Confirmation phrase accepted: yes');
    console.log(`2. Metadata repairs applied count: ${safeRepairs.length}`);
    console.log(`3. Exclusions applied count: ${safeExclusions.length}`);
    console.log(`4. Skipped low-confidence count: ${skippedDocs.length}`);
    console.log('5. Updated document paths:');
    safeRepairs.concat(safeExclusions).forEach(d => console.log(`   - ${d.path} (${d.file_name})`));
    console.log('6. Fields written summary:');
    console.log(JSON.stringify(writeOperations.map(o => ({ path: o.ref.path, fields: Object.keys(o.updates) })), null, 2));
    console.log(`7. Orphaned task unchanged confirmation: confirmed (orphanedTaskFound=${orphanedTaskFound ? 'YES' : 'NO'})`);
    console.log('8. Confirm no writes to ai_queue: confirmed');
    console.log('\nRC_X3M_A_SAFE_METADATA_REPAIR_APPLIED_READY');
  } else {
    console.log('\n==============================================');
    console.log('DRY-RUN OUTPUT');
    console.log('==============================================');
    console.log(`1. Total planned repair candidates reviewed: ${safeRepairs.length + safeExclusions.length + skippedDocs.length}`);
    console.log(`2. Safe repairs that would be applied: ${safeRepairs.length}`);
    safeRepairs.forEach(d => console.log(`   - File: ${d.file_name} -> Path: ${d.path}`));
    console.log(`3. Safe exclusions that would be applied: ${safeExclusions.length}`);
    safeExclusions.forEach(d => console.log(`   - File: ${d.file_name} -> Path: ${d.path}`));
    console.log(`4. Low-confidence docs skipped: ${skippedDocs.length}`);
    skippedDocs.forEach(d => console.log(`   - File: ${d.file_name} -> Path: ${d.path}`));
    console.log('5. Exact target document paths:');
    safeRepairs.concat(safeExclusions).forEach(d => console.log(`   - ${d.path}`));
    console.log('6. Exact fields that would be written:');
    console.log(JSON.stringify(writeOperations.map(o => ({ path: o.ref.path, updates: o.updates })), null, 2));
    console.log(`7. Orphaned task review: taskFound=${orphanedTaskFound ? 'YES' : 'NO'}, matchFound=${possibleMatchingDocFound ? 'YES' : 'NO'}, recommendedNextHandling=RC-X3M-B_ORPHAN_TASK_REVIEW`);
    console.log('8. Confirmation:');
    console.log('   - no writes in dry-run: confirmed');
    console.log('   - no queue task creation: confirmed');
    console.log('   - no extraction run: confirmed');
    console.log('\nRC_X3M_A_DRY_RUN_READY');
  }
}

main().catch(e => {
  if (isApplyMode) {
    console.error('\nRC_X3M_A_APPLY_BLOCKED');
  } else {
    console.error('\nRC_X3M_A_DRY_RUN_BLOCKED');
  }
  console.error(e);
  process.exit(1);
});
