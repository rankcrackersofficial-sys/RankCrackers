const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';

function getField(data, keys, fallback = null) {
  for (const key of keys) {
    if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') {
      return data[key];
    }
  }
  return fallback;
}

function lower(value) { return String(value || '').trim().toLowerCase(); }
function bool(value) { return value === true || lower(value) === 'true'; }

async function main() {
  console.log('================================================================');
  console.log('PATCH RC-X4E-IR3 - PAGEWISE R11 UNDOCUMENTED INCIDENT AUDIT');
  console.log('================================================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  // 1. Fetch all pagewise tasks
  const snap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const tasks = [];
  snap.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));

  // Reconcile status counts
  const total = tasks.length;
  const active = tasks.filter(t => ['queued', 'pending', 'processing', 'running'].includes(lower(t.status))).length;
  const completedTasks = tasks.filter(t => ['completed', 'done', 'success'].includes(lower(t.status)));
  const completed = completedTasks.length;
  const failed = tasks.filter(t => ['failed', 'error', 'dead_letter'].includes(lower(t.status))).length;
  const processing = tasks.filter(t => ['processing', 'running'].includes(lower(t.status))).length;

  console.log('\n--- PART G: CURRENT QUEUE STATE ---');
  console.log(`Total tasks: ${total}`);
  console.log(`Active tasks: ${active}`);
  console.log(`Completed tasks: ${completed}`);
  console.log(`Failed tasks: ${failed}`);
  console.log(`Processing tasks: ${processing}`);

  // Sort completed tasks by completed_at (descending/ascending)
  completedTasks.sort((a, b) => {
    const tA = getField(a, ['completed_at', 'completedAt', 'updated_at', 'updatedAt'], 0);
    const tB = getField(b, ['completed_at', 'completedAt', 'updated_at', 'updatedAt'], 0);
    return tA > tB ? 1 : -1;
  });

  console.log('\n--- PART C: LAST 20 COMPLETED TASKS ---');
  const last20 = completedTasks.slice(-20);
  last20.forEach(t => {
    console.log(`- ID: ${t.id}`);
    console.log(`  mission_id: ${t.mission_id}`);
    console.log(`  document_id: ${t.document_id}`);
    console.log(`  page_range: ${t.page_start}-${t.page_end}`);
    console.log(`  status: ${t.status}`);
    console.log(`  extraction_method: ${t.extraction_method}`);
    console.log(`  completed_at: ${getField(t, ['completed_at', 'completedAt'])}`);
    console.log(`  created_by_patch_completed: ${t.created_by_patch_completed || t.created_by_patch}`);
  });

  // Identify undocumented tasks
  const suspectIds = [
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b6_p16_18',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b7_p19_21',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b8_p22_24'
  ];

  console.log('\n--- PART D: SUSPECTED R11 UNDOCUMENTED TASKS ---');
  const foundSuspects = completedTasks.filter(t => suspectIds.includes(t.id));
  console.log(`Found ${foundSuspects.length} out of 3 suspect tasks in completed queue.`);

  let autoDetectLeakage = false;
  let p13Overlap = false;
  let r11TasksValid = true;

  for (const t of foundSuspects) {
    console.log(`Checking task ${t.id}:`);
    console.log(`  status: ${t.status} (expected completed)`);
    console.log(`  mission_id: ${t.mission_id} (expected jee_main_2026)`);
    if (lower(t.mission_id) === 'auto_detect') autoDetectLeakage = true;
    console.log(`  document_id: ${t.document_id}`);
    console.log(`  extraction_method: ${t.extraction_method} (expected native_pdf_text)`);
    console.log(`  page_range: ${t.page_start}-${t.page_end}`);
    if (t.page_start <= 15 && t.page_end >= 10) p13Overlap = true;
    if (t.page_start === 91 || t.page_end === 91) p13Overlap = true;

    // Check if valid
    const valid = t.status === 'completed' && t.mission_id === 'jee_main_2026' && t.document_id && t.extraction_method === 'native_pdf_text';
    console.log(`  valid: ${valid}`);
    if (!valid) r11TasksValid = false;
  }

  console.log(`AUTO_DETECT leakage: ${autoDetectLeakage}`);
  console.log(`P13 range overlap: ${p13Overlap}`);
  console.log(`R11 tasks valid: ${r11TasksValid}`);

  // Fetch page extractions from all documents in all mission realms to get total page_extractions count
  const missionRealmsSnap = await db.collection('mission_realms').get();
  let globalPageExtractionsCount = 0;
  const docMap = new Map();

  console.log('\n--- PART H: MULTI-DOCUMENT INTEGRITY ---');
  for (const missionDoc of missionRealmsSnap.docs) {
    const missionId = missionDoc.id;
    const docsSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    for (const doc of docsSnap.docs) {
      const documentId = doc.id;
      const peSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').doc(documentId).collection('page_extractions').get();
      const pages = [];
      peSnap.forEach(peDoc => {
        const pageNum = Number(peDoc.id);
        pages.push(pageNum);
        globalPageExtractionsCount++;
      });
      pages.sort((a, b) => a - b);
      docMap.set(documentId, pages);
      console.log(`Doc ID: ${documentId} (Mission: ${missionId}) -> Pages count: ${pages.length}, range: [${pages.join(', ')}]`);
    }
  }

  console.log(`Global page_extractions count: ${globalPageExtractionsCount}`);

  // Check parent document side effects
  console.log('\n--- PART I: PARENT SIDE-EFFECT CHECK ---');
  let parentSideEffectDetected = false;
  for (const missionDoc of missionRealmsSnap.docs) {
    const missionId = missionDoc.id;
    const docsSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    for (const doc of docsSnap.docs) {
      // ONLY check parent documents that have page_extractions
      const pages = docMap.get(doc.id) || [];
      if (pages.length === 0) continue;

      const data = doc.data();
      const forbidden = [
        'published', 'approved', 'verified', 'founder_approved',
        'topic_nodes_created', 'atom_count', 'fact_count', 'question_count',
        'crucible_generated', 'digibook_generated', 'notification_form_generated'
      ];
      forbidden.forEach(field => {
        if (data[field] !== undefined) {
          console.log(`Forbidden field '${field}' found in document ${doc.id}! Value:`, data[field]);
          parentSideEffectDetected = true;
        }
      });
    }
  }
  console.log(`Parent side effect detected: ${parentSideEffectDetected}`);

  // Part E: Verify R11 incident page records (pages 16-24)
  console.log('\n--- PART E: R11 INCIDENT PAGE RECORDS (16-24) ---');
  let r11IncidentRecordsValid = true;
  const docIdB18d = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';
  const r11Pages = [16, 17, 18, 19, 20, 21, 22, 23, 24];

  for (const pageNum of r11Pages) {
    const docRef = db.collection('mission_realms').doc('jee_main_2026').collection('official_documents').doc(docIdB18d).collection('page_extractions').doc(String(pageNum));
    const peSnap = await docRef.get();
    if (!peSnap.exists) {
      console.log(`Page ${pageNum} missing!`);
      r11IncidentRecordsValid = false;
      continue;
    }
    const data = peSnap.data();
    const txtLen = (data.extraction_text || '').length;
    const policy = data.page_policy || {};
    const sp = data.source_proof || {};

    const valid = txtLen > 100 &&
                  data.extraction_status === 'extracted_draft' &&
                  data.review_status === 'pending_founder_verification' &&
                  data.extraction_method === 'native_pdf_text' &&
                  data.extracted_by_task_id &&
                  sp.task_id &&
                  sp.page_number === pageNum &&
                  bool(policy.all_pages_required) &&
                  !bool(policy.fixed_page_limit_allowed) &&
                  bool(policy.batch_size_is_not_page_limit);

    console.log(`Page ${pageNum}: text length = ${txtLen}, valid = ${valid}`);
    if (!valid) r11IncidentRecordsValid = false;

    // Check forbidden fields in page records
    const forbidden = [
      'published', 'approved', 'verified', 'founder_approved', 'publish_status',
      'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
      'ai_generated', 'ocr_used'
    ];
    forbidden.forEach(field => {
      if (data[field] !== undefined) {
        console.log(`Forbidden field '${field}' found in page ${pageNum}!`);
        r11IncidentRecordsValid = false;
      }
    });
  }
  console.log(`R11 incident records valid: ${r11IncidentRecordsValid}`);

  // Part F: Verify Authorized P13 Records Separately
  console.log('\n--- PART F: AUTHORIZED P13 RECORDS ---');
  let p13RecordsValid = true;
  const p13PagesB18d = [91, 10, 11, 12, 13, 14, 15];

  const verifyP13Page = async (docId, pageNum) => {
    const docRef = db.collection('mission_realms').doc('jee_main_2026').collection('official_documents').doc(docId).collection('page_extractions').doc(String(pageNum));
    const peSnap = await docRef.get();
    if (!peSnap.exists) {
      console.log(`P13 Page ${pageNum} missing in doc ${docId}!`);
      p13RecordsValid = false;
      return;
    }
    const data = peSnap.data();
    const txtLen = (data.extraction_text || '').length;
    const policy = data.page_policy || {};
    const sp = data.source_proof || {};

    const valid = txtLen > 100 &&
                  data.extraction_status === 'extracted_draft' &&
                  data.review_status === 'pending_founder_verification' &&
                  data.extraction_method === 'native_pdf_text' &&
                  data.extracted_by_task_id &&
                  sp.task_id &&
                  sp.page_number === pageNum &&
                  bool(policy.all_pages_required) &&
                  !bool(policy.fixed_page_limit_allowed) &&
                  bool(policy.batch_size_is_not_page_limit);

    console.log(`Doc ${docId} Page ${pageNum}: text length = ${txtLen}, valid = ${valid}`);
    if (!valid) p13RecordsValid = false;

    // Check forbidden fields in page records
    const forbidden = [
      'published', 'approved', 'verified', 'founder_approved', 'publish_status',
      'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
      'ai_generated', 'ocr_used'
    ];
    forbidden.forEach(field => {
      if (data[field] !== undefined) {
        console.log(`Forbidden field '${field}' found in page ${pageNum}!`);
        p13RecordsValid = false;
      }
    });
  };

  for (const pageNum of p13PagesB18d) await verifyP13Page(docIdB18d, pageNum);
  console.log(`P13 records valid: ${p13RecordsValid}`);

  console.log('\n================================================================');
  console.log('AUDIT COMPLETE');
  console.log('================================================================');
}

main().catch(console.error);
