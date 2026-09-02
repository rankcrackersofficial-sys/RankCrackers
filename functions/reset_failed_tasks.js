const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  console.log(`--- Resetting Failed Tasks for Doc: ${docId} ---`);

  const snap = await db.collection('ai_queue')
    .where('document_id', '==', docId)
    .where('status', '==', 'failed')
    .get();

  console.log(`Found ${snap.size} failed tasks.`);

  const batch = db.batch();
  snap.forEach(doc => {
    // Only reset if it's not the known cover page failure (b1) or if we want to retry it too.
    // The user said "Process the remaining eligible ... tasks".
    // I'll reset all failed tasks to try them with the integrated conveyor.
    batch.update(doc.ref, {
      status: 'queued',
      failure_reason: admin.firestore.FieldValue.delete(),
      error_message: admin.firestore.FieldValue.delete(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  if (snap.size > 0) {
    await batch.commit();
    console.log('Tasks reset to queued.');
  }
}

main().catch(console.error);
