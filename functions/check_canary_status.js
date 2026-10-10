const admin = require("firebase-admin");

console.log("🔱 INITIALIZING CANARY STATUS CHECKER...");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  const docRef = db.collection('ai_queue').doc('CANARY_FF08_TEST');
  const snap = await docRef.get();
  if (!snap.exists) {
    console.log("❌ Canary job CANARY_FF08_TEST does not exist in production!");
    return;
  }
  const job = snap.data();
  console.log("=================================================");
  console.log("🔱 PRODUCTION CANARY STATUS:");
  console.log("=================================================");
  console.log(`Job ID: ${job.jobId}`);
  console.log(`State: ${job.state}`);
  console.log(`Attempts: ${job.attempts}`);
  console.log(`Lease Owner: ${job.leaseOwner}`);
  console.log(`Last Error: ${job.lastError}`);
  console.log(`Output Hash: ${job.outputHash}`);
  console.log(`Created At: ${job.createdAt ? job.createdAt.toDate().toISOString() : 'null'}`);
  console.log(`Updated At: ${job.updatedAt ? job.updatedAt.toDate().toISOString() : 'null'}`);
  console.log(`Started At: ${job.startedAt ? job.startedAt.toDate().toISOString() : 'null'}`);
  console.log(`Finished At: ${job.finishedAt ? job.finishedAt.toDate().toISOString() : 'null'}`);
  console.log("=================================================");
}

run().catch(console.error);
