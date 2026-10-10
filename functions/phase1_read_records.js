delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}

const db = admin.firestore();

async function run() {
  const missionId = 'jee_main_2026';
  const docId = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
  
  const docRef = db.collection('mission_realms').doc(missionId)
    .collection('official_documents').doc(docId);
    
  const snap = await docRef.collection('page_extractions').orderBy('page_number').get();
  console.log(`Page records count: ${snap.size}`);
  
  const records = [];
  snap.forEach(d => {
    const data = d.data();
    records.push({
      pageNumber: data.page_number || parseInt(d.id),
      rawText: data.extraction_text || '',
      verifiedText: data.verifiedText || null,
      sourceSha256: data.sourceSha256 || null,
      pageAuthorityDigest: data.pageAuthorityDigest || null,
      is_verified: data.is_verified,
      machineVerificationState: data.machine_verification_state || null,
      extraction_status: data.extraction_status || null,
      review_status: data.review_status || null,
      verificationRunId: data.verification_run_id || null,
      verifierRevision: data.verifier_revision || null,
      correctionLog: data.correction_log || null
    });
  });
  
  console.log(JSON.stringify(records, null, 2));
}

run().catch(console.error);
