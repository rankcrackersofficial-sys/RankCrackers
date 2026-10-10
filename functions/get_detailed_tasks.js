const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "rankcrackers-55"
  });
}

const db = admin.firestore();

async function run() {
  const docId = "hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925";
  console.log(`🔱 DETAILED SCAN OF TASKS FOR DOCUMENT ${docId}...`);
  
  const snap = await db.collection("ai_queue")
    .where("document_id", "==", docId)
    .get();

  const tasks = [];
  snap.forEach(doc => {
    const data = doc.data();
    tasks.push({
      id: doc.id,
      task_type: data.task_type || data.type,
      status: data.status,
      state: data.state,
      page_start: data.page_start,
      page_end: data.page_end,
      page_batch_index: data.page_batch_index,
      total_batches: data.total_batches
    });
  });

  // Sort by page_start
  tasks.sort((a, b) => (a.page_start || 0) - (b.page_start || 0));

  console.log(`Found ${tasks.length} tasks:`);
  tasks.forEach(t => {
    console.log(`- ${t.id}: type=${t.task_type}, status=${t.status}, state=${t.state}, pages=${t.page_start}-${t.page_end}, batch=${t.page_batch_index}/${t.total_batches}`);
  });
}

run().catch(console.error);
