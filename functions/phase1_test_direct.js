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
  const missionId = 'jee_main_2026';
  const docId = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
  
  const docRef = db.collection('mission_realms').doc(missionId)
    .collection('official_documents').doc(docId);
    
  const docSnap = await docRef.get();
  console.log("Doc exists:", docSnap.exists);
  if (docSnap.exists) {
    console.log("Doc data:", JSON.stringify(docSnap.data(), null, 2));
  }
  
  const pagesSnap = await docRef.collection('page_extractions').get();
  console.log("Pages count:", pagesSnap.size);
  if (pagesSnap.size > 0) {
    console.log("First page data keys:", Object.keys(pagesSnap.docs[0].data()));
  }
}

run().catch(console.error);
