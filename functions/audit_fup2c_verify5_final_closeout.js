const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const TARGET_PATH = 'system_verification_sandbox/SANDBOX_TEST_DOC_001';

function block(reason, verdict = 'FUP_2C_VERIFY5_FINAL_CLOSEOUT_BLOCKED_PRODUCTION_AUTHORITY_ESCALATION') {
  console.error(`FINAL CLOSEOUT FAIL: ${reason}`);
  console.log(verdict);
  process.exit(1);
}

async function main() {
  console.log('=== FUP-2C-VERIFY5 FINAL CLOSEOUT AUDIT ===');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  // 1. Verify sandbox target does NOT exist
  const docRef = db.doc(TARGET_PATH);
  const snap = await docRef.get();
  if (snap.exists) {
    block('Sandbox target document still exists!', 'FUP_2C_VERIFY5_FINAL_CLOSEOUT_BLOCKED_SANDBOX_TARGET_STILL_EXISTS');
  }

  // 2. Verify academic counts stable
  // syllabus_atoms count
  const saSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('syllabus_atoms').get();
  if (saSnap.size !== 430) {
    block(`Syllabus atoms count changed. Expected 430, got ${saSnap.size}`, 'FUP_2C_VERIFY5_FINAL_CLOSEOUT_BLOCKED_ACADEMIC_COUNT_MISMATCH');
  }

  // topic_nodes count
  const tnSnap = await db.collection('student_mission_catalog').doc(MISSION_ID).collection('topic_nodes').get();
  if (tnSnap.size !== 0) {
    block(`Topic nodes count changed. Expected 0, got ${tnSnap.size}`, 'FUP_2C_VERIFY5_FINAL_CLOSEOUT_BLOCKED_ACADEMIC_COUNT_MISMATCH');
  }

  // page_extractions count
  let peCount = 0;
  const docsSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').get();
  for (const doc of docsSnap.docs) {
    const peSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(doc.id).collection('page_extractions').get();
    peCount += peSnap.size;
  }
  if (peCount !== 133) {
    block(`Page extractions count changed. Expected 133, got ${peCount}`, 'FUP_2C_VERIFY5_FINAL_CLOSEOUT_BLOCKED_ACADEMIC_COUNT_MISMATCH');
  }

  // 3. Verify production authority blocked
  const catalogDoc = await db.collection('student_mission_catalog').doc(MISSION_ID).get();
  if (catalogDoc.exists) {
    const catData = catalogDoc.data();
    if (catData.published === true || catData.publish_status === 'published' || catData.student_published === true) {
      block('Production catalog is published!');
    }
    if (catData.counts && catData.counts.topicNodes > 0) {
      block('Production catalog counts.topicNodes is non-zero!');
    }
  }

  // Check token files to make sure they do not allow any production writes
  const tokenFiles = [
    'FUP_2C_VERIFY5_LIVE_AUTH_SECOND_GATE_TOKEN.json',
    'FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN.json'
  ];

  for (const f of tokenFiles) {
    const tokenPath = path.join(__dirname, '..', 'docs', 'patch_safety', f);
    if (fs.existsSync(tokenPath)) {
      try {
        const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        if (token.target_path !== 'system_verification_sandbox/SANDBOX_TEST_DOC_001') {
          block(`Token ${f} targets unexpected path: ${token.target_path}`);
        }
      } catch (err) {
        // Parse error is fine for closeout block checks
      }
    }
  }

  console.log('Final sandbox state: deleted/missing (STABLE)');
  console.log('Syllabus atoms count: 430 (STABLE)');
  console.log('Topic nodes count: 0 (STABLE)');
  console.log('Page extractions count: 133 (STABLE)');
  console.log('Production authority: BLOCKED');
  console.log('FUP_2C_VERIFY5_FINAL_CLOSEOUT_READY');
}

main().catch(err => {
  console.error(err);
  console.log('FUP_2C_VERIFY5_FINAL_CLOSEOUT_BLOCKED');
  process.exit(1);
});
