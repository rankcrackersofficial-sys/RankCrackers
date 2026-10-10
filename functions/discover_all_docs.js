const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

const missions = [
  'jee_main_2026',
  'neet_(ug)-2027',
  'RPSC_FIRST_GRADE2026_2026_1782713222215'
];

async function main() {
  console.log('=== DISCOVERING OFFICIAL DOCUMENTS ===');
  for (const mId of missions) {
    console.log(`\nChecking mission: ${mId}`);
    try {
      const snap = await db.collection('mission_realms').doc(mId).collection('official_documents').get();
      console.log(`  - official_documents count: ${snap.size}`);
      snap.forEach(doc => {
        console.log(`    * Document ID: ${doc.id}`);
        console.log(`      Data:`, JSON.stringify(doc.data(), null, 2));
      });
    } catch (e) {
      console.error(`  - Failed to read official_documents for ${mId}:`, e.message);
    }

    try {
      const snapAtoms = await db.collection('mission_realms').doc(mId).collection('syllabus_atoms').limit(5).get();
      console.log(`  - syllabus_atoms count: ${snapAtoms.size}`);
      snapAtoms.forEach(doc => {
        const d = doc.data();
        console.log(`    * Atom ID: ${doc.id}`);
        console.log(`      sourceDocumentId: ${d.sourceDocumentId || d.source_document_id}`);
        console.log(`      sourceTextExcerpt: ${d.sourceTextExcerpt ? d.sourceTextExcerpt.substring(0, 60) + '...' : null}`);
      });
    } catch (e) {
      console.error(`  - Failed to read syllabus_atoms for ${mId}:`, e.message);
    }
  }
}

main().catch(console.error).then(() => process.exit(0));
