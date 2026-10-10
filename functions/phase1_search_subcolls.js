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
  const docId = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
  const docRef = db.collection('source_documents').doc(docId);
  const subcolls = await docRef.listCollections();
  console.log("Subcollections of source_documents/hash_...:", subcolls.map(c => c.id));
  
  if (subcolls.map(c => c.id).includes('page_extractions')) {
    const pages = await docRef.collection('page_extractions').orderBy('page_number').get();
    console.log(`Pages count under source_documents: ${pages.size}`);
    if (pages.size > 0) {
      console.log("Sample page data:", JSON.stringify(pages.docs[0].data(), null, 2));
    }
  }
}

run().catch(console.error);
