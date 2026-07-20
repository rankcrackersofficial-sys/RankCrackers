const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const TARGET_PATH = 'system_verification_sandbox/SANDBOX_TEST_DOC_001';

function block(reason) {
  console.error(`AUDIT FAIL: ${reason}`);
  console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_DELETE_RESULT_BLOCKED_ACADEMIC_SIDE_EFFECT');
  process.exit(1);
}

async function main() {
  console.log('=== FUP-2C-VERIFY5 SANDBOX ROLLBACK DELETE RESULT AUDIT ===');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  // 1. Verify target doc no longer exists
  const docRef = db.doc(TARGET_PATH);
  const snap = await docRef.get();
  if (snap.exists) {
    console.error(`Document at ${TARGET_PATH} still exists!`);
    console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_DELETE_RESULT_BLOCKED_TARGET_STILL_EXISTS');
    process.exit(1);
  }

  // 2. Verify academic counts stable
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
  if (peCount !== 118) {
    block(`Page extractions count changed. Expected 118, got ${peCount}`);
  }

  // 3. Verify no academic side effects
  const catalogDoc = await db.collection('student_mission_catalog').doc(MISSION_ID).get();
  if (catalogDoc.exists) {
    const catData = catalogDoc.data();
    if (catData.published === true || catData.publish_status === 'published' || catData.student_published === true) {
      block('Production catalog is published!');
    }
  }

  console.log('Syllabus atoms count: 430 (STABLE)');
  console.log('Topic nodes count: 0 (STABLE)');
  console.log('Page extractions count: 118 (STABLE)');
  console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_DELETE_RESULT_READY');
}

main().catch(err => {
  console.error(err);
  console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_DELETE_RESULT_BLOCKED_ACADEMIC_SIDE_EFFECT');
  process.exit(1);
});
