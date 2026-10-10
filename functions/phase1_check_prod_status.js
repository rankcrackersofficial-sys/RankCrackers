delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}

const db = admin.firestore();

async function run() {
  const taskId = 'task_jee_main_2026_b1_extraction';
  const taskSnap = await db.collection('ai_queue').doc(taskId).get();
  if (taskSnap.exists) {
    const d = taskSnap.data();
    console.log(`Task Status: ${d.status}`);
    if (d.error) console.log("Task Error:", d.error);
    if (d.failure_reason) console.log("Task Failure Reason:", d.failure_reason);
  } else {
    console.log("Task doc not found in production!");
  }

  const docId = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
  const docRef = db.collection('mission_realms').doc('jee_main_2026')
    .collection('official_documents').doc(docId);
  const snap = await docRef.collection('page_extractions').get();
  console.log(`Production page extractions count: ${snap.size}`);
}

run().catch(console.error);
