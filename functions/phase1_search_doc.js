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
  const targetId = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
  
  console.log("Searching for target ID in all root collections...");
  const collections = await db.listCollections();
  
  for (const coll of collections) {
    // Check if a document with this ID exists directly in the collection
    const docSnap = await coll.doc(targetId).get();
    if (docSnap.exists) {
      console.log(`FOUND direct doc in collection '${coll.id}':`, JSON.stringify(docSnap.data(), null, 2));
    }
  }

  // Also query collections for fields containing targetId
  for (const coll of collections) {
    try {
      const q1 = await coll.where('document_id', '==', targetId).get();
      if (q1.size > 0) {
        console.log(`FOUND document_id match in collection '${coll.id}': ${q1.size} docs`);
      }
    } catch(e) {}
    try {
      const q2 = await coll.where('docId', '==', targetId).get();
      if (q2.size > 0) {
        console.log(`FOUND docId match in collection '${coll.id}': ${q2.size} docs`);
      }
    } catch(e) {}
    try {
      const q3 = await coll.where('source_document_id', '==', targetId).get();
      if (q3.size > 0) {
        console.log(`FOUND source_document_id match in collection '${coll.id}': ${q3.size} docs`);
      }
    } catch(e) {}
  }
}

run().catch(console.error);
