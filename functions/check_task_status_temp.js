const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}

const db = admin.firestore();

async function run() {
  const docRef = db.collection('mission_realms').doc('jee_main_2026')
    .collection('official_documents').doc('hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905');
  const pagesSnap = await docRef.collection('page_extractions').get();
  console.log(`Pages count: ${pagesSnap.size}`);
}

run().catch(console.error);
