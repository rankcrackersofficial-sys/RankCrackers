const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const DOC_ID = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

async function main() {
  const snap = await db.collection('mission_realms').doc(MISSION_ID)
    .collection('official_documents').doc(DOC_ID)
    .collection('page_extractions').get();
  console.log('Page extractions count:', snap.size);
  if (snap.size > 0) {
    const doc = snap.docs[0];
    console.log(`Document fields:`, Object.keys(doc.data()));
    console.log(`Document data:`, JSON.stringify(doc.data(), null, 2));
  }
}

main().catch(console.error);
