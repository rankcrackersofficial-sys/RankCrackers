const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
  const pages = [1, 2, 3];

  console.log(`\n--- READING EXTRACTION TEXT FOR NEET (UG)-2027 PAGES 1, 2, 3 ---`);

  for (const p of pages) {
    const snap = await db.collection('mission_realms').doc(missionId)
      .collection('official_documents').doc(docId)
      .collection('page_extractions').doc(String(p)).get();

    if (!snap.exists) {
      console.log(`\n[PAGE ${p}] NOT FOUND`);
      continue;
    }

    const data = snap.data();
    console.log(`\n=== PAGE ${p} ===`);
    console.log(data.extraction_text);
    console.log(`\n--- END OF PAGE ${p} ---`);
  }
}

main().catch(console.error);
