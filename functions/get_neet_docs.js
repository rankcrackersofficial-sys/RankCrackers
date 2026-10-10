const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "rankcrackers-55"
  });
}

const db = admin.firestore();

async function run() {
  console.log("🔱 INVESTIGATING DOCUMENTS FOR NEET IN AI_QUEUE...");
  const snap = await db.collection("ai_queue")
    .where("mission_id", "==", "neet_(ug)-2027")
    .get();

  const documents = {};
  
  snap.forEach(doc => {
    const data = doc.data();
    const docId = data.document_id;
    if (!documents[docId]) {
      documents[docId] = {
        document_id: docId,
        source_path: data.source_path,
        task_type: data.task_type || data.type,
        status: data.status,
        tasks_count: 0,
        page_range: { min: Infinity, max: -Infinity }
      };
    }
    
    documents[docId].tasks_count++;
    if (data.page_start) {
      documents[docId].page_range.min = Math.min(documents[docId].page_range.min, data.page_start);
      documents[docId].page_range.max = Math.max(documents[docId].page_range.max, data.page_end);
    }
  });

  console.log("\nFound Documents:", JSON.stringify(documents, null, 2));
}

run().catch(console.error);
