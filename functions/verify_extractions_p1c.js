const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
  const pages = [25, 26, 27];

  console.log(`\n--- Verifying Extractions for Doc: ${docId} ---`);

  for (const p of pages) {
    const snap = await db.collection('mission_realms').doc(missionId)
      .collection('official_documents').doc(docId)
      .collection('page_extractions').doc(String(p)).get();

    if (!snap.exists) {
      console.error(`Page ${p}: MISSING`);
      continue;
    }

    const data = snap.data();
    console.log(`\n[PAGE ${p}]`);
    console.log(`Status: ${data.extraction_status}`);
    console.log(`Review: ${data.review_status}`);
    console.log(`Method: ${data.extraction_method}`);
    console.log(`Created By: ${data.created_by_patch}`);
    console.log(`Text Length: ${data.extraction_text.length}`);
    console.log(`Text Preview: ${data.extraction_text.substring(0, 200).replace(/\n/g, '\\n')}...`);
  }
}

main().catch(console.error);
