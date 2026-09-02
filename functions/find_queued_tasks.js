const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "rankcrackers-55"
  });
}

const db = admin.firestore();

async function run() {
  console.log("🔍 Searching for 'queued' or 'pending' tasks in 'ai_queue'...");

  const statuses = ['queued', 'pending'];
  const tasks = [];

  for (const status of statuses) {
    const snap = await db.collection("ai_queue")
      .where("status", "==", status)
      .get();

    snap.forEach(doc => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        mission_id: data.mission_id,
        document_id: data.document_id,
        status: data.status
      });
    });
  }

  if (tasks.length === 0) {
    console.log("No tasks found with status 'queued' or 'pending'.");
  } else {
    console.log(`Found ${tasks.length} tasks:`);
    tasks.forEach(t => {
      console.log(`Mission ID: ${t.mission_id}, Document ID: ${t.document_id}, Task ID: ${t.id}, Status: ${t.status}`);
    });
  }
}

run().catch(console.error);
