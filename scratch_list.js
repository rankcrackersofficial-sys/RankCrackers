const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

async function main() {
  const snap = await db.collection('mission_realms').doc(MISSION_ID)
    .collection('official_documents').get();
  console.log('Official documents count:', snap.size);
  snap.docs.forEach(doc => {
    console.log(`Document ID: ${doc.id}`);
    const data = doc.data();
    console.log(`  Name: ${data.name || data.fileName || data.title}`);
    console.log(`  Type: ${data.documentType || data.document_type}`);
    console.log(`  PageCount: ${data.pageCount || data.page_count}`);
  });
}

main().catch(console.error);
