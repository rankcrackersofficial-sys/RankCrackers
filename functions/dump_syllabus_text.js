const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  console.log(`--- Dumping Syllabus Text (67-80) ---`);
  let fullText = '';
  for (let i = 67; i <= 80; i++) {
    const snap = await db.collection('mission_realms').doc(missionId)
      .collection('official_documents').doc(docId)
      .collection('page_extractions').doc(String(i)).get();

    if (snap.exists) {
      fullText += `\n\n=== PAGE ${i} ===\n${snap.data().extraction_text}`;
    }
  }
  console.log(fullText);
}

main().catch(console.error);
