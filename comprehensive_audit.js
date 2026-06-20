const admin = require("firebase-admin");
const serviceAccount = require("./functions/service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

function formatTime(val) {
  if (!val) return "N/A";
  // Handle Firestore Timestamp vs Date vs Number
  if (val.toDate) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'number') return new Date(val).toISOString();
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  return JSON.stringify(val);
}

async function runAudit() {
  const db = admin.firestore();
  console.log("--- 🔱 RUNTIME AUDIT REPORT ---");

  // 1. Worker Registry
  const registry = await db.collection("worker_registry").doc("sentinel_worker").get();
  console.log("\n[Worker Registry]");
  if (registry.exists) {
    const data = registry.data();
    console.log(`Status: ${data.status}`);
    console.log(`Last Heartbeat: ${formatTime(data.lastHeartbeat)}`);
    console.log(`Last Success: ${formatTime(data.lastSuccessAt)}`);
    console.log(`Error Count: ${data.errorCount}`);
    console.log(`Last Error: ${data.error || "None"}`);
  } else {
    console.log("Not found.");
  }

  // 2. Latest Ingestion Refinery
  const refinery = await db.collection("ingestion_refinery").orderBy("createdAt", "desc").limit(1).get();
  console.log("\n[Latest Ingestion Refinery]");
  if (!refinery.empty) {
    const doc = refinery.docs[0];
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Status: ${data.status}`);
    console.log(`Error: ${data.error || "None"}`);
    console.log(`Created At: ${formatTime(data.createdAt)}`);
  } else {
    console.log("No documents found.");
  }

  // 3. Latest AI Queue Task
  const queue = await db.collection("ai_queue").orderBy("processedAt", "desc").limit(1).get();
  console.log("\n[Latest AI Queue Task]");
  if (!queue.empty) {
    const doc = queue.docs[0];
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Status: ${data.status}`);
    console.log(`Error: ${data.error || "None"}`);
    console.log(`Processed At: ${formatTime(data.processedAt)}`);
  } else {
    console.log("No documents found.");
  }

  // 4. Latest Sentinel Draft
  const drafts = await db.collection("sentinel_drafts").orderBy("audit.processedAt", "desc").limit(1).get();
  console.log("\n[Latest Sentinel Draft]");
  if (!drafts.empty) {
    const doc = drafts.docs[0];
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Type: ${data.type}`);
    console.log(`Status: ${data.status}`);
    console.log("Created: Yes");
  } else {
    console.log("Created: No");
  }

  // 5. Latest Failed Task Error
  const failed = await db.collection("ai_failed_tasks").orderBy("timestamp", "desc").limit(1).get();
  console.log("\n[Latest Failed Task]");
  if (!failed.empty) {
    const doc = failed.docs[0];
    const data = doc.data();
    console.log(`Error: ${data.error}`);
    console.log(`Timestamp: ${formatTime(data.timestamp)}`);
  } else {
    console.log("No failures found.");
  }
}

runAudit().catch(console.error);
