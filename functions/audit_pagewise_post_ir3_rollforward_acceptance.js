const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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
  console.log('PATCH RC-X4E-R12 - PAGEWISE POST-IR3 ROLLFORWARD ACCEPTANCE');
  console.log('================================================================');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  // 1. Fetch all pagewise tasks
  const snap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
  const tasks = [];
  snap.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));

  const total = tasks.length;
  const active = tasks.filter(t => ['queued', 'pending', 'processing', 'running'].includes(lower(t.status))).length;
  const completedTasks = tasks.filter(t => ['completed', 'done', 'success'].includes(lower(t.status)));
  const completed = completedTasks.length;
  const failed = tasks.filter(t => ['failed', 'error', 'dead_letter'].includes(lower(t.status))).length;
  const processing = tasks.filter(t => ['processing', 'running'].includes(lower(t.status))).length;

  // Global Page Extractions Count
  const missionRealmsSnap = await db.collection('mission_realms').get();
  let globalPageExtractionsCount = 0;
  const docMap = new Map();

  for (const missionDoc of missionRealmsSnap.docs) {
    const missionId = missionDoc.id;
    const docsSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    for (const doc of docsSnap.docs) {
      const documentId = doc.id;
      const peSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').doc(documentId).collection('page_extractions').get();
      const pages = [];
      peSnap.forEach(peDoc => {
        pages.push(Number(peDoc.id));
        globalPageExtractionsCount++;
      });
      pages.sort((a, b) => a - b);
      docMap.set(documentId, pages);
    }
  }

  console.log('\n--- 1. GLOBAL QUEUE STATE ---');
  console.log(`Total: ${total} (expected 104)`);
  console.log(`Active: ${active} (expected 64)`);
  console.log(`Completed: ${completed} (expected 37)`);
  console.log(`Failed: ${failed} (expected 3)`);
  console.log(`Processing: ${processing} (expected 0)`);
  console.log(`Page Extractions: ${globalPageExtractionsCount} (expected 118)`);

  if (total !== 104 || active !== 64 || completed !== 37 || failed !== 3 || processing !== 0 || globalPageExtractionsCount !== 118) {
    console.error('ERROR: Global queue state mismatch!');
    process.exit(1);
  }

  // 2. R11 incident tasks
  console.log('\n--- 2. R11 INCIDENT TASKS ---');
  const suspectIds = [
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b6_p16_18',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b7_p19_21',
    'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b8_p22_24'
  ];

  const foundSuspects = completedTasks.filter(t => suspectIds.includes(t.id));
  if (foundSuspects.length !== 3) {
    console.error(`ERROR: Found only ${foundSuspects.length} out of 3 R11 incident tasks!`);
    process.exit(1);
  }

  for (const t of foundSuspects) {
    console.log(`Task ${t.id}:`);
    const isJee = t.mission_id === 'jee_main_2026';
    const notAuto = t.mission_id !== 'AUTO_DETECT';
    const isDocCorrect = t.document_id === 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';
    const isMethodCorrect = t.extraction_method === 'native_pdf_text';
    const completedAtExists = getField(t, ['completed_at', 'completedAt']) !== null;

    console.log(`  status: ${t.status} (expected completed)`);
    console.log(`  mission_id: ${t.mission_id}`);
    console.log(`  document_id: ${t.document_id}`);
    console.log(`  extraction_method: ${t.extraction_method}`);
    console.log(`  completed_at: ${getField(t, ['completed_at', 'completedAt'])}`);

    if (!isJee || !notAuto || !isDocCorrect || !isMethodCorrect || !completedAtExists) {
      console.error('ERROR: Task safety validation failed!');
      process.exit(1);
    }
  }

  // 3. R11 incident page records (16-24)
  console.log('\n--- 3. R11 INCIDENT PAGE RECORDS (16-24) ---');
  const docIdB18d = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';
  const r11Pages = [16, 17, 18, 19, 20, 21, 22, 23, 24];

  for (const pageNum of r11Pages) {
    const docRef = db.collection('mission_realms').doc('jee_main_2026').collection('official_documents').doc(docIdB18d).collection('page_extractions').doc(String(pageNum));
    const peSnap = await docRef.get();
    if (!peSnap.exists) {
      console.error(`ERROR: R11 page ${pageNum} is missing!`);
      process.exit(1);
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
    if (!valid) {
      console.error(`ERROR: R11 page ${pageNum} metadata validation failed!`);
      process.exit(1);
    }

    // Check forbidden fields in page records
    const forbidden = [
      'published', 'approved', 'verified', 'founder_approved', 'publish_status',
      'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
      'ai_generated', 'ocr_used'
    ];
    forbidden.forEach(field => {
      if (data[field] !== undefined) {
        console.error(`ERROR: Forbidden field '${field}' found in page ${pageNum}!`);
        process.exit(1);
      }
    });
  }

  // 4. Prior key page ranges still valid
  console.log('\n--- 4. PRIOR KEY PAGE RANGES VALIDATION ---');
  
  const verifyPageRange = async (docId, pageNum, expectedMinLen = 100) => {
    const docRef = db.collection('mission_realms').doc('jee_main_2026').collection('official_documents').doc(docId).collection('page_extractions').doc(String(pageNum));
    const peSnap = await docRef.get();
    if (!peSnap.exists) {
      console.error(`ERROR: Page ${pageNum} missing in doc ${docId}!`);
      process.exit(1);
    }
    const data = peSnap.data();
    const txtLen = (data.extraction_text || '').length;
    const policy = data.page_policy || {};
    const sp = data.source_proof || {};

    const valid = txtLen >= expectedMinLen &&
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
    if (!valid) {
      console.error(`ERROR: Prior range page ${pageNum} validation failed!`);
      process.exit(1);
    }

    // Check forbidden fields in page records
    const forbidden = [
      'published', 'approved', 'verified', 'founder_approved', 'publish_status',
      'atom_id', 'fact_id', 'question_id', 'crucible_item_id', 'digibook_unit_id',
      'ai_generated', 'ocr_used'
    ];
    forbidden.forEach(field => {
      if (data[field] !== undefined) {
        console.error(`ERROR: Forbidden field '${field}' found in page ${pageNum}!`);
        process.exit(1);
      }
    });
  };

  // P13: page 91 and pages 10–15
  await verifyPageRange(docIdB18d, 91);
  for (let p = 10; p <= 15; p++) await verifyPageRange(docIdB18d, p);

  // P12: pages 7–9, 85–90
  for (let p = 7; p <= 9; p++) await verifyPageRange(docIdB18d, p);
  for (let p = 85; p <= 90; p++) await verifyPageRange(docIdB18d, p);

  // P11: pages 67–84
  for (let p = 67; p <= 84; p++) await verifyPageRange(docIdB18d, p);

  // pre-P11: pages 58–66
  for (let p = 58; p <= 66; p++) await verifyPageRange(docIdB18d, p);

  // syllabus first range: pages 1–17 under hash_7cad document
  const docId7cad = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
  for (let p = 1; p <= 17; p++) await verifyPageRange(docId7cad, p);

  // 6. Parent document side-effect check
  console.log('\n--- 6. PARENT DOCUMENT SIDE-EFFECT CHECK ---');
  for (const missionDoc of missionRealmsSnap.docs) {
    const missionId = missionDoc.id;
    const docsSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    for (const doc of docsSnap.docs) {
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
          console.error(`ERROR: Forbidden field '${field}' found in parent doc ${doc.id}! Value:`, data[field]);
          process.exit(1);
        }
      });
    }
  }
  console.log('Parent document checks: ALL PASSED');

  // 7. Multi-document integrity
  console.log('\n--- 7. MULTI-DOCUMENT INTEGRITY ---');
  const docIdBa8b = 'hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b';
  const count7cad = (docMap.get(docId7cad) || []).length;
  const countB18d = (docMap.get(docIdB18d) || []).length;
  const countBa8b = (docMap.get(docIdBa8b) || []).length;
  console.log(`Document hash_7cad count: ${count7cad} (expected 17)`);
  console.log(`Document hash_b18d count: ${countB18d} (expected 91)`);
  console.log(`Document hash_ba8b count: ${countBa8b} (expected 10)`);

  if (count7cad !== 17 || countB18d !== 91 || countBa8b !== 10) {
    console.error('ERROR: Multi-document page counts do not match expected values!');
    process.exit(1);
  }

  // 8. Active audit script baseline consistency
  console.log('\n--- 8. ACTIVE AUDIT SCRIPT BASELINE CONSISTENCY ---');
  const stalePatterns = [
    '104 / 70 / 31 / 3 / 96',
    '104 / 73 / 28 / 3 / 89',
    '104 / 76 / 25 / 3 / 80',
    '104 / 79 / 22 / 3 / 71',
    '104 / 82 / 19 / 3 / 62'
  ];

  const functionsDir = path.join(__dirname, '..', 'functions');
  const files = fs.readdirSync(functionsDir);
  let staleFound = false;

  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    // Skip this file itself
    if (file === 'audit_pagewise_post_ir3_rollforward_acceptance.js') continue;
    // Skip the R11 undocumented incident script since it dynamically reports
    if (file === 'audit_pagewise_r11_undocumented_incident.js') continue;

    const content = fs.readFileSync(path.join(functionsDir, file), 'utf8');
    for (const pat of stalePatterns) {
      // Normalize whitespace for check
      const normalizedPat = pat.replace(/\s+/g, '');
      const normalizedContent = content.replace(/\s+/g, '');
      if (normalizedContent.includes(normalizedPat)) {
        console.error(`ERROR: Stale baseline signature '${pat}' found in functions/${file}!`);
        staleFound = true;
      }
    }
  }

  if (staleFound) {
    console.error('ERROR: Stale baseline signatures detected in functions!');
    process.exit(1);
  } else {
    console.log('Stale baseline checks: ALL CLEAN');
  }

  console.log('\n================================================================');
  console.log('RC_X4E_R13_POST_IR3_ROLLFORWARD_ACCEPTANCE_READY');
  console.log('================================================================');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
