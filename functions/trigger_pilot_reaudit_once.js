const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'rankcrackers-55',
  });
}

const db = admin.firestore();
const id = `ssc_cgl_reaudit_${Date.now()}`;

async function main() {
  await db.collection('pilot_automation').doc(id).create({
    status: 'QUEUED',
    missionId: 'ssc_cgl',
    requestedBy: 'server_reaudit',
    reason: 'guarded_syllabus_materializer_reaudit',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(JSON.stringify({ id }));
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
