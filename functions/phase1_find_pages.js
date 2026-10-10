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
  console.log("Querying collectionGroup 'page_extractions'...");
  const snap = await db.collectionGroup('page_extractions').limit(50).get();
  console.log(`Found ${snap.size} page extractions.`);
  snap.forEach(doc => {
    console.log(`Path: ${doc.ref.path}`);
  });
}

run().catch(console.error);
