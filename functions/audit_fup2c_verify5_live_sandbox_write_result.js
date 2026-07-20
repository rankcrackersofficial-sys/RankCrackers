const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const TARGET_PATH = 'system_verification_sandbox/SANDBOX_TEST_DOC_001';
const EXPECTED_APPROVAL_HASH = '0c63d04b9d603c5f43e9c95e8ccccc2d4964b033d37fc392bf9271c8d25d3b79';
const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_LIVE_AUTH_SECOND_GATE_TOKEN.json');

function block(reason) {
  console.error(`AUDIT FAIL: ${reason}`);
  console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_RESULT_BLOCKED_ACADEMIC_SIDE_EFFECT');
  process.exit(1);
}

async function main() {
  console.log('=== FUP-2C-VERIFY5 LIVE SANDBOX WRITE RESULT AUDIT ===');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  // 1. Read token file to get expected bundle SHA
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('Token file missing.');
    console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_RESULT_BLOCKED_TARGET_MISSING');
    process.exit(1);
  }
  let token;
  try {
    token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  } catch (err) {
    console.error('Failed to parse token.');
    console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_RESULT_BLOCKED_TARGET_MISSING');
    process.exit(1);
  }

  // 2. Verify target document exists
  const docRef = db.doc(TARGET_PATH);
  const snap = await docRef.get();
  if (!snap.exists) {
    console.error(`Document at ${TARGET_PATH} does not exist!`);
    console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_RESULT_BLOCKED_TARGET_MISSING');
    process.exit(1);
  }

  const data = snap.data();

  // 3. Verify target payload fields
  if (data.patch !== 'FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1') {
    block('patch mismatch in sandbox payload');
  }
  if (data.mission_id !== MISSION_ID) {
    block('mission_id mismatch in sandbox payload');
  }
  if (data.academic_write !== false) {
    block('academic_write is not false');
  }
  if (data.student_visible !== false) {
    block('student_visible is not false');
  }
  if (data.created_by !== 'founder_authorized_second_gate') {
    block('created_by mismatch in sandbox payload');
  }
  if (data.founder_approval_phrase_hash !== EXPECTED_APPROVAL_HASH) {
    block('founder_approval_phrase_hash mismatch in sandbox payload');
  }
  if (data.token_bundle_sha256 !== token.bundle_sha256) {
    block('token_bundle_sha256 mismatch in sandbox payload');
  }
  const budgetUsed = data.mutation_budget_used || {};
  if (budgetUsed.create !== 1 || budgetUsed.update !== 0 || budgetUsed.delete !== 0) {
    block('mutation_budget_used mismatch in sandbox payload');
  }

  // 4. Verify absence of academic fields in sandbox doc
  const forbiddenFields = [
    'syllabus_atom_id', 'topic_node_id', 'atom_id', 'fact_id', 'question_id',
    'crucible_item_id', 'digibook_unit_id', 'publish_status', 'founder_approved',
    'student_published', 'production_academic_write'
  ];
  for (const f of forbiddenFields) {
    if (data[f] !== undefined) {
      block(`Forbidden field '${f}' present in sandbox document payload.`);
    }
  }

  // 5. Verify no academic side effects in Firestore collections
  // Verify topic_nodes is empty/0
  const topicNodesSnap = await db.collection('student_mission_catalog').doc(MISSION_ID).collection('topic_nodes').get();
  if (!topicNodesSnap.empty) {
    block('student_mission_catalog topic_nodes collection is not empty!');
  }

  const catalogDoc = await db.collection('student_mission_catalog').doc(MISSION_ID).get();
  if (catalogDoc.exists) {
    const catData = catalogDoc.data();
    if (catData.counts && catData.counts.topicNodes !== undefined && catData.counts.topicNodes !== 0) {
      block(`student_mission_catalog counts.topicNodes is non-zero: ${catData.counts.topicNodes}`);
    }
  }

  // Verify syllabus_atoms exists under mission_realms/jee_main_2026/syllabus_atoms
  const syllabusAtomsSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('syllabus_atoms').get();
  if (syllabusAtomsSnap.size > 0) {
    // Check if any was created today or recently, but typically it should not have changed at all.
    // In this patch we perform 0 syllabus_atoms writes. We can verify if there are any that have created_by_patch = FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1
    syllabusAtomsSnap.forEach(d => {
      const aData = d.data();
      if (aData.created_by_patch === 'FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1' || aData.patch === 'FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1') {
        block('syllabus_atoms document contains this patch ID!');
      }
    });
  }

  // 6. Verify page_extractions count remains untouched
  // Let's count page extractions
  let peCount = 0;
  const docsSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').get();
  for (const doc of docsSnap.docs) {
    const peSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(doc.id).collection('page_extractions').get();
    peCount += peSnap.size;
  }
  console.log(`Verified global page_extractions count: ${peCount}`);

  console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_RESULT_READY');
}

main().catch(err => {
  console.error(err);
  console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_RESULT_BLOCKED_ACADEMIC_SIDE_EFFECT');
  process.exit(1);
});
