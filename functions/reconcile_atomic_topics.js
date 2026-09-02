const admin = require('firebase-admin');
const { atoms: canonicalAtoms } = require('./materialize_neet_full_v3');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const atomsRef = db.collection('mission_realms').doc(missionId).collection('syllabus_atoms');

  console.log('Fetching all atomic topics from Firestore...');
  const snapshot = await atomsRef.get();

  const discovered = snapshot.size;
  const canonical = canonicalAtoms.length;

  let sourceBacked = 0;
  let verified = 0;
  let duplicates = 0;
  let unresolved = 0;
  let orphans = 0;
  let missingSourceBinding = 0;
  let synthetic = 0;

  const seenIds = new Set();
  const canonicalIds = new Set(canonicalAtoms.map(a => a.atom_id));

  snapshot.forEach(doc => {
    const data = doc.data();
    if (seenIds.has(doc.id)) duplicates++;
    seenIds.add(doc.id);

    if (data.source_document_id && data.page_number) {
        sourceBacked++;
    } else {
        missingSourceBinding++;
    }

    if (data.verification_state === 'verified_from_source_v1' || data.status === 'verified') {
        verified++;
    }

    if (!canonicalIds.has(doc.id)) {
        orphans++;
    }

    if (data.is_synthetic || doc.id.includes('SYNTHETIC')) {
        synthetic++;
    }
  });

  console.log('\n--- Atomic Topic Reconciliation Report ---');
  console.log(`DISCOVERED_ATOMIC_TOPICS = ${discovered}`);
  console.log(`CANONICAL_ATOMIC_TOPICS = ${canonical}`);
  console.log(`SOURCE_BACKED_ATOMIC_TOPICS = ${sourceBacked}`);
  console.log(`VERIFIED_ATOMIC_TOPICS = ${verified}`);
  console.log(`DUPLICATES = ${duplicates}`);
  console.log(`UNRESOLVED = ${unresolved}`);
  console.log(`ORPHANS = ${orphans}`);
  console.log(`MISSING_SOURCE_BINDING = ${missingSourceBinding}`);
  console.log(`SYNTHETIC_TOPICS = ${synthetic}`);

  if (discovered === canonical && orphans === 0 && duplicates === 0 && synthetic === 0 && missingSourceBinding === 0) {
    console.log('\nVERDICT: ATOMIC RECONCILIATION SUCCESS');
  } else {
    console.log('\nVERDICT: ATOMIC RECONCILIATION FAILED (Check mismatches)');
  }
}

main().catch(console.error);
