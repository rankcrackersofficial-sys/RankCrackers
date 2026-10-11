// Retired exam-named diagnostic. Use universal mission-scoped read-only audit tooling.
require('./services/mission_agnostic_policy').rejectLegacyMissionSpecificExecution('get_neet_tasks.js');

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "rankcrackers-55"
  });
}

const db = admin.firestore();

async function run() {
  console.log("🔱 FETCHING NEET TASKS IN AI_QUEUE...");
  const snap = await db.collection("ai_queue")
    .where("mission_id", "==", "neet_(ug)-2027")
    .get();

  console.log(`Total tasks found for NEET: ${snap.size}`);
  
  const statusMap = {};
  const stateMap = {};
  const typeMap = {};
  
  snap.forEach(doc => {
    const data = doc.data();
    statusMap[data.status] = (statusMap[data.status] || 0) + 1;
    stateMap[data.state] = (stateMap[data.state] || 0) + 1;
    typeMap[data.task_type || data.type] = (typeMap[data.task_type || data.type] || 0) + 1;
    
    // Log a few samples
    if (snap.size <= 5 || doc.id.includes("b1_p1_3") || doc.id.includes("b32_p94_96")) {
      console.log(`- Task doc: ${doc.id}`);
      console.log(`  task_type/type: ${data.task_type || data.type}`);
      console.log(`  status: ${data.status}`);
      console.log(`  state: ${data.state}`);
      console.log(`  page_start: ${data.page_start}`);
      console.log(`  page_end: ${data.page_end}`);
      console.log(`  queueContract: ${data.queueContract}`);
    }
  });

  console.log("\nCounts by Status:", statusMap);
  console.log("Counts by State:", stateMap);
  console.log("Counts by Type:", typeMap);
}

run().catch(console.error);
