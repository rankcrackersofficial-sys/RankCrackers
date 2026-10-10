const admin = require("firebase-admin");

console.log("🔱 INITIALIZING EXACT PHYSICAL COUNTS CALCULATOR...");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  const missionId = 'neet_(ug)-2027';

  // 1. AMTNs (micro_nodes)
  const nodesSnap = await db.collection('micro_nodes').get();
  const neetNodesSnap = await db.collection('micro_nodes').where('examId', '==', missionId).get();
  
  // 2. Published AMTNs
  const publishedNodesSnap = await db.collection('micro_nodes').where('status', '==', 'published').get();
  const neetPublishedNodesSnap = await db.collection('micro_nodes')
    .where('examId', '==', missionId)
    .where('status', '==', 'published')
    .get();

  // 3. DigiBook Blocks (content_payloads)
  const payloadsSnap = await db.collection('content_payloads').get();
  
  // 4. Crucible Items (mcq_pool)
  const mcqsSnap = await db.collection('mcq_pool').get();

  // 5. Holds (in ai_queue)
  const holdsSnap = await db.collection('ai_queue')
    .where('state', '==', 'held')
    .get();

  console.log("=================================================");
  console.log("🔱 PHYSICAL FIRESTORE DATABASE COUNTS:");
  console.log("=================================================");
  console.log(`TOTAL_AMTN_DOCUMENT_COUNT (All Exams): ${nodesSnap.size}`);
  console.log(`TOTAL_AMTN_DOCUMENT_COUNT (NEET): ${neetNodesSnap.size}`);
  console.log(`ACTUAL_PUBLISHED_AMTN_COUNT (All Exams): ${publishedNodesSnap.size}`);
  console.log(`ACTUAL_PUBLISHED_AMTN_COUNT (NEET): ${neetPublishedNodesSnap.size}`);
  console.log(`TOTAL_DIGIBOOK_BLOCK_DOCUMENT_COUNT: ${payloadsSnap.size}`);
  console.log(`TOTAL_CRUCIBLE_ITEM_DOCUMENT_COUNT: ${mcqsSnap.size}`);
  console.log(`TOTAL_HOLDS_COUNT (in ai_queue): ${holdsSnap.size}`);
  console.log("=================================================");
}

run().catch(console.error);
