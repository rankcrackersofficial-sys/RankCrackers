const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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
  
  const docs = snap.docs.sort((a, b) => {
    const ap = Number(a.id || a.data().page_number || a.data().pageNumber);
    const bp = Number(b.id || b.data().page_number || b.data().pageNumber);
    return ap - bp;
  });

  let fullText = '';
  docs.forEach(doc => {
    const pageNum = doc.id;
    const data = doc.data();
    const text = data.extraction_text || data.text || '';
    fullText += `\n\n--- PAGE ${pageNum} ---\n\n${text}`;
  });

  const outDir = path.join(__dirname, 'docs', 'patch_safety');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'jee_syllabus_text.txt'), fullText, 'utf8');
  console.log(`Saved syllabus to docs/patch_safety/jee_syllabus_text.txt. Total pages: ${docs.length}`);
}

main().catch(console.error);
