const admin = require('firebase-admin');
const { atoms } = require('./materialize_neet_full_v3');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  console.log(`Total Atoms to materialize: ${atoms.length}`);

  const batch = db.batch();
  const atomsRef = db.collection('mission_realms').doc(missionId).collection('syllabus_atoms');

  for (const atom of atoms) {
    const docRef = atomsRef.doc(atom.atom_id);
    batch.set(docRef, {
      ...atom,
      verification_state: 'verified_from_source_v1',
      source_document_id: docId,
      source_sha256: '2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      created_by: 'RC_SYLLABUS_NEET2027_COMPLETION_AGENT',
      status: 'verified'
    });
  }

  if (process.argv.includes('--apply')) {
      console.log(`Committing ${atoms.length} atoms to Firestore...`);
      await batch.commit();
      console.log('Materialization SUCCESS.');
  } else {
      console.log('Dry run complete. Use --apply to commit.');
  }
}

main().catch(console.error);
