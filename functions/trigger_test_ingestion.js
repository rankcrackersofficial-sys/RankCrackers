const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');

// 🔱 SOVEREIGN TEST SCRIPT: Manual Pipeline Injection
// This bypasses the UI to test the integrity of the Ingestion -> Queue -> Worker chain.

initializeApp({
  projectId: 'rankcrackers-55',
  storageBucket: 'rankcrackers-55.firebasestorage.app'
});

const db = getFirestore();
const bucket = getStorage().bucket();

async function run() {
  console.log("🔱 STARTING SOVEREIGN INGESTION STRIKE...");

  const content = JSON.stringify({
    title: "SSC GD RECRUITMENT 2026",
    organization: "Staff Selection Commission",
    vacancies: 5000,
    age_limit: "18-25",
    description: "Official notification for General Duty constables in CAPFs, SSF and Rifleman in Assam Rifles."
  });

  const fileHash = crypto.createHash('sha256').update(content).digest('hex');
  const fileName = `test_ingestion_${Date.now()}.json`;
  const storagePath = `ingestion_refinery/${fileHash}.json`;

  console.log(`🔱 STEP 1: UPLOADING TO STORAGE... [${storagePath}]`);
  const file = bucket.file(storagePath);
  await file.save(content, {
    metadata: { contentType: 'application/json' }
  });

  // Use public URL format (alt=media)
  const url = `https://firebasestorage.googleapis.com/v0/b/rankcrackers-55.firebasestorage.app/o/${encodeURIComponent(storagePath)}?alt=media`;

  const recordId = `hash_${fileHash}`;
  console.log(`🔱 STEP 2: CREATING REFINERY RECORD... [${recordId}]`);

  await db.collection('ingestion_refinery').doc(recordId).set({
    id: recordId,
    fileName: fileName,
    fileType: 'json',
    fileHash: fileHash,
    status: 'received',
    sourceUrl: url,
    storagePath: storagePath,
    createdAt: FieldValue.serverTimestamp(),
    assetType: 'recruitment_notification',
    manualTest: true
  });

  console.log(`🔱 STEP 3: INJECTING INTO AI QUEUE...`);
  await db.collection('ai_queue').doc(recordId).set({
    type: 'pdfParse',
    provider: 'gemini',
    status: 'received',
    createdAt: FieldValue.serverTimestamp(),
    manualTrigger: true,
    payload: {
      id: recordId,
      fileName: fileName,
      filePath: url,
      fileType: 'json',
      intent: 'recruitment_notification',
      status: 'parsing',
      fileHash: fileHash
    }
  });

  console.log(`🔱 STRIKE COMPLETE. TASK ID: ${recordId}`);
  console.log(`🔱 CHECK LOGS FOR: sentinelBackgroundWorker picking up ${recordId}`);
}

run().catch(e => {
    console.error("🔥 STRIKE FAILED:", e);
    process.exit(1);
});
