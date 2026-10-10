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
  const taskRef = db.collection('ai_queue').doc(taskId);

  console.log(`Deleting old task ${taskId} from production if any...`);
  await taskRef.delete();

  const taskData = {
    task_type: 'pagewise_text_extraction_batch',
    mission_id: 'jee_main_2026',
    document_id: 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905',
    source_document_id: 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905',
    document_type: 'syllabus',
    source_path: 'gs://rankcrackers-55.firebasestorage.app/mission_realms/jee_main_2026/official_documents/hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905.pdf',
    page_start: 1,
    page_end: 17,
    page_batch_index: 0,
    total_batches: 1,
    status: 'queued',
    expected_output: 'page_extractions',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  };

  console.log(`Writing task to production ai_queue...`);
  await taskRef.set(taskData);
  console.log(`Task successfully written!`);
}

run().catch(console.error);
