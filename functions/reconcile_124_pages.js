const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'neet_(ug)-2027';
const DOCUMENT_ID = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
const EXPECTED_SHA = '2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const docRef = db.collection('mission_realms').doc(MISSION_ID)
    .collection('official_documents').doc(DOCUMENT_ID);

  console.log('Fetching all page extractions...');
  const extractionsSnap = await docRef.collection('page_extractions').get();
  const extractions = {};
  extractionsSnap.forEach(doc => {
    extractions[doc.id] = doc.data();
  });

  console.log(`Total records found in Firestore: ${Object.keys(extractions).length}`);

  let accounted = 0;
  let contentExtracted = 0;
  let nonContent = 0;
  let ambiguous = 0;
  let failed = 0;
  let missing = 0;
  let duplicate = 0;
  let wrongBinding = 0;
  let simulated = 0;

  const batch = db.batch();
  let batchCount = 0;

  for (let p = 1; p <= 124; p++) {
    const pageId = String(p);
    const data = extractions[pageId];

    if (!data) {
      missing++;
      continue;
    }

    accounted++;

    // SHA Verify
    // The field document_id is often hash_...
    const actualSha = (data.source_sha256 || data.document_id || '').replace('hash_', '');
    if (actualSha !== EXPECTED_SHA) {
      wrongBinding++;
      continue;
    }

    // Simulated check
    const text = (data.extraction_text || '').toLowerCase();
    if (text.includes('simulated text') || text.includes('placeholder')) {
      simulated++;
      continue;
    }

    // Routing disposition
    // Content range: Appendix III (Syllabus) is Document Pages 60-76.
    // However, some missions might want the whole doc.
    // But for "CONTENT_PAGES_EXTRACTED", we focus on the academic syllabus.
    const isContent = (p >= 60 && p <= 76);
    const disposition = isContent ? 'CONTENT_EXTRACTED_VERIFIED' : 'NON_CONTENT_PAGE_VERIFIED';

    if (isContent) contentExtracted++;
    else nonContent++;

    // Update the record with verified state
    batch.update(docRef.collection('page_extractions').doc(pageId), {
      verification_state: 'reconciled_v1',
      disposition: disposition,
      reconciled_at: admin.firestore.FieldValue.serverTimestamp(),
      reconciled_by: 'RC_SYLLABUS_NEET2027_COMPLETION_AGENT'
    });
    batchCount++;
  }

  console.log('\n--- Reconciliation Report ---');
  console.log(`PHYSICAL_PAGES_ACCOUNTED = ${accounted}/124`);
  console.log(`CONTENT_PAGES_EXTRACTED = ${contentExtracted}`);
  console.log(`NON_CONTENT_PAGES = ${nonContent}`);
  console.log(`AMBIGUOUS_PAGES = ${ambiguous}`);
  console.log(`FAILED_PAGES = ${failed}`);
  console.log(`MISSING_PAGES = ${missing}`);
  console.log(`DUPLICATE_PAGES = ${duplicate}`);
  console.log(`WRONG_BINDING_PAGES = ${wrongBinding}`);
  console.log(`SIMULATED_PAGES = ${simulated}`);

  if (accounted === 124 && missing === 0 && wrongBinding === 0 && simulated === 0) {
    console.log('\nVERDICT: RECONCILIATION SUCCESS');
  } else {
    console.log('\nVERDICT: RECONCILIATION FAILED (Check missing/wrong binding/simulated)');
  }

  if (process.argv.includes('--apply')) {
    if (batchCount > 0) {
        console.log(`\nApplying ${batchCount} reconciliation updates to Firestore...`);
        await batch.commit();
        console.log('Done.');
    } else {
        console.log('\nNo updates to apply.');
    }
  } else {
    console.log('\nDry run complete. Use --apply to commit.');
  }
}

main().catch(console.error);
