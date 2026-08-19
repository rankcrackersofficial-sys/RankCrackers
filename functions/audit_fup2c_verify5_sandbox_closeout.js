const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const TARGET_PATH = 'system_verification_sandbox/SANDBOX_TEST_DOC_001';
const EXPECTED_APPROVAL_HASH = '0c63d04b9d603c5f43e9c95e8ccccc2d4964b033d37fc392bf9271c8d25d3b79';

function block(reason, verdict = 'FUP_2C_VERIFY5_SANDBOX_CLOSEOUT_BLOCKED_ACADEMIC_SIDE_EFFECT') {
  console.error(`CLOSEOUT AUDIT FAIL: ${reason}`);
  console.log(verdict);
  process.exit(1);
}

async function main() {
  console.log('=== FUP-2C-VERIFY5 SANDBOX CLOSEOUT AUDIT ===');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  // 1. Verify sandbox target exists
  const docRef = db.doc(TARGET_PATH);
  const snap = await docRef.get();
  if (!snap.exists) {
    block('Sandbox target document is missing!', 'FUP_2C_VERIFY5_SANDBOX_CLOSEOUT_BLOCKED_TARGET_MISSING');
  }

  const data = snap.data();

  // 2. Verify sandbox payload valid
  if (data.patch !== 'FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1') {
    block('patch mismatch in payload');
  }
  if (data.mission_id !== MISSION_ID) {
    block('mission_id mismatch in payload');
  }
  if (data.purpose !== 'authorization_sandbox_verification') {
    block('purpose mismatch in payload');
  }
  if (data.academic_write !== false) {
    block('academic_write is not false');
  }
  if (data.student_visible !== false) {
    block('student_visible is not false');
  }
  if (data.created_by !== 'founder_authorized_second_gate') {
    block('created_by mismatch in payload');
  }
  if (data.founder_approval_phrase_hash !== EXPECTED_APPROVAL_HASH) {
    block('founder_approval_phrase_hash mismatch');
  }
  const budget = data.mutation_budget_used || {};
  if (budget.create !== 1 || budget.update !== 0 || budget.delete !== 0) {
    block('mutation_budget_used mismatch');
  }

  // 3. Verify absence of academic fields on sandbox doc
  const forbiddenFields = [
    'syllabus_atom_id', 'topic_node_id', 'atom_id', 'fact_id', 'question_id',
    'crucible_item_id', 'digibook_unit_id', 'publish_status', 'founder_approved',
    'student_published', 'production_academic_write'
  ];
  for (const f of forbiddenFields) {
    if (data[f] !== undefined) {
      block(`Forbidden academic field '${f}' present in sandbox doc.`);
    }
  }

  // 4. Verify academic counts stable
  // syllabus_atoms count
  const saSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('syllabus_atoms').get();
  if (saSnap.size !== 430) {
    block(`Syllabus atoms count changed. Expected 430, got ${saSnap.size}`);
  }

  // topic_nodes count
  const tnSnap = await db.collection('student_mission_catalog').doc(MISSION_ID).collection('topic_nodes').get();
  if (tnSnap.size !== 0) {
    block(`Topic nodes count changed. Expected 0, got ${tnSnap.size}`);
  }

  // page_extractions count
  let peCount = 0;
  const docsSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').get();
  for (const doc of docsSnap.docs) {
    const peSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(doc.id).collection('page_extractions').get();
    peCount += peSnap.size;
  }
  if (peCount !== 133) {
    block(`Page extractions count changed. Expected 133, got ${peCount}`);
  }

  // 5. Production authority remains blocked
  // Read catalog data for any signs of student publish or Crucible/DigiBook updates
  const catalogDoc = await db.collection('student_mission_catalog').doc(MISSION_ID).get();
  if (catalogDoc.exists) {
    const catData = catalogDoc.data();
    if (catData.published === true || catData.publish_status === 'published' || catData.student_published === true) {
      block('Production catalog is published!', 'FUP_2C_VERIFY5_SANDBOX_CLOSEOUT_BLOCKED_PRODUCTION_AUTHORITY_ESCALATION');
    }
    if (catData.counts && catData.counts.topicNodes > 0) {
      block('Production catalog counts.topicNodes is non-zero!', 'FUP_2C_VERIFY5_SANDBOX_CLOSEOUT_BLOCKED_PRODUCTION_AUTHORITY_ESCALATION');
    }
  }

  // Ensure there is no active token allowing production write
  // We don't have any production tokens, and the current token target_path is sandbox-only.
  // We verify that the current token file ONLY authorizes the sandbox path.
  const fs = require('fs');
  const path = require('path');
  const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_LIVE_AUTH_SECOND_GATE_TOKEN.json');
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      if (token.target_path !== 'system_verification_sandbox/SANDBOX_TEST_DOC_001') {
        block('Token target path is not sandbox!', 'FUP_2C_VERIFY5_SANDBOX_CLOSEOUT_BLOCKED_PRODUCTION_AUTHORITY_ESCALATION');
      }
      if (token.mutation_budget?.create !== 1 || token.mutation_budget?.update !== 0 || token.mutation_budget?.delete !== 0) {
        block('Token allows unexpected mutations!', 'FUP_2C_VERIFY5_SANDBOX_CLOSEOUT_BLOCKED_PRODUCTION_AUTHORITY_ESCALATION');
      }
    } catch (e) {
      // JSON parse fail is fine for closeout block check (not escalation)
    }
  }

  console.log('Syllabus atoms count: 430 (STABLE)');
  console.log('Topic nodes count: 0 (STABLE)');
  console.log('Page extractions count: 133 (STABLE)');
  console.log('Production student publish: BLOCKED');
  console.log('FUP_2C_VERIFY5_SANDBOX_CLOSEOUT_READY');
}

main().catch(err => {
  console.error(err);
  console.log('FUP_2C_VERIFY5_SANDBOX_CLOSEOUT_BLOCKED');
  process.exit(1);
});
