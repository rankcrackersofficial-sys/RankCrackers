const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  console.log(`--- Production Census for ${docId} ---`);

  // 1. Tasks
  const tasksSnap = await db.collection('ai_queue')
    .where('document_id', '==', docId)
    .get();

  const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Total Tasks: ${tasks.length}`);

  const statusDist = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  console.log('Status Distribution:', statusDist);

  // 2. Extractions
  const extractionsSnap = await db.collection('mission_realms').doc(missionId)
    .collection('official_documents').doc(docId)
    .collection('page_extractions')
    .get();

  const extractions = extractionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Total Extractions: ${extractions.length}`);

  const uniquePages = new Set(extractions.map(e => e.page_number));
  console.log(`Unique Pages Extracted: ${uniquePages.size}`);

  const extractionMethods = extractions.reduce((acc, e) => {
    acc[e.extraction_method] = (acc[e.extraction_method] || 0) + 1;
    return acc;
  }, {});
  console.log('Extraction Methods:', extractionMethods);

  // 3. Page Coverage Map
  const coverage = [];
  for (let i = 1; i <= 124; i++) {
    const ext = extractions.find(e => Number(e.page_number) === i);
    coverage.push(ext ? (ext.extraction_method === 'native_pdf_text' ? 'N' : 'O') : '.');
  }
  console.log('Page Coverage (1-124):');
  console.log(coverage.join(''));
}

main().catch(console.error);
