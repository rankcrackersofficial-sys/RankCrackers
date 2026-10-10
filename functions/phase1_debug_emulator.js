process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}

const db = admin.firestore();

async function run() {
  console.log("Connecting to emulator...");
  const jeeRef = db.collection('mission_realms').doc('jee_main_2026');
  const subcolls = await jeeRef.listCollections();
  console.log("Emulator Subcollections of jee_main_2026:", subcolls.map(c => c.id));
  
  if (subcolls.map(c => c.id).includes('official_documents')) {
    const docs = await jeeRef.collection('official_documents').listDocuments();
    console.log("Emulator Documents in official_documents:", docs.map(d => d.id));
    
    const snap = await jeeRef.collection('official_documents')
      .doc('hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905')
      .collection('page_extractions').get();
    console.log(`Emulator Page extractions count: ${snap.size}`);
  }
}

run().catch(console.error);
