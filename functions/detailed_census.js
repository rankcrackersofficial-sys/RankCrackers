const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  // 1. Tasks
  const tasksSnap = await db.collection('ai_queue')
    .where('document_id', '==', docId)
    .get();

  const tasks = tasksSnap.docs.map(d => d.data());
  const statusDist = {
    QUEUED_TASKS: 0,
    COMPLETED_TASKS: 0,
    FAILED_TASKS: 0,
    RUNNING_TASKS: 0,
    OTHER_TASKS: 0
  };

  tasks.forEach(t => {
    if (t.status === 'queued') statusDist.QUEUED_TASKS++;
    else if (t.status === 'completed') statusDist.COMPLETED_TASKS++;
    else if (t.status === 'failed') statusDist.FAILED_TASKS++;
    else if (t.status === 'running') statusDist.RUNNING_TASKS++;
    else statusDist.OTHER_TASKS++;
  });

  // 2. Extractions
  const extractionsSnap = await db.collection('mission_realms').doc(missionId)
    .collection('official_documents').doc(docId)
    .collection('page_extractions')
    .get();

  const extractions = extractionsSnap.docs.map(d => d.data());
  const pageNumbers = extractions.map(e => Number(e.page_number));
  const uniquePages = new Set(pageNumbers);

  let nativeCount = 0;
  let ocrCount = 0;
  let missingProvenance = 0;

  extractions.forEach(e => {
    if (e.extraction_method === 'native_pdf_text') nativeCount++;
    if (e.extraction_method === 'VISION_OCR_PAGEWISE') ocrCount++;
    if (!e.provenance && !e.source_provenance) missingProvenance++;
  });

  // 3. Page Coverage
  const coverageRanges = [];
  let start = 1;
  let currentStatus = uniquePages.has(1) ? 'EXTRACTED' : 'MISSING';

  for (let i = 2; i <= 124; i++) {
    const status = uniquePages.has(i) ? 'EXTRACTED' : 'MISSING';
    if (status !== currentStatus) {
      coverageRanges.push(`${start}-${i - 1}: ${currentStatus}`);
      start = i;
      currentStatus = status;
    }
  }
  coverageRanges.push(`${start}-124: ${currentStatus}`);

  console.log(JSON.stringify({
    TOTAL_TARGET_TASKS: tasks.length,
    statusDist,
    EXISTING_PAGE_EXTRACTIONS: extractions.length,
    UNIQUE_EXTRACTED_PAGES: uniquePages.size,
    DUPLICATE_PAGE_RECORDS: extractions.length - uniquePages.size,
    NATIVE_EXTRACTIONS: nativeCount,
    OCR_EXTRACTIONS: ocrCount,
    MISSING_PROVENANCE_RECORDS: missingProvenance,
    coverageRanges
  }, null, 2));
}

main().catch(console.error);
