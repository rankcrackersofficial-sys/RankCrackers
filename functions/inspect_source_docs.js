const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
const db = admin.firestore();
async function main() {
  const realm = (await db.collection('mission_realms').doc('ssc_cgl').get()).data() || {};
  const ids = [realm.missionSetup?.notificationDocumentId, realm.missionSetup?.syllabusDocumentId].filter(Boolean);
  const out = [];
  for (const id of ids) {
    const doc = await db.collection('mission_realms').doc('ssc_cgl').collection('official_documents').doc(id).get();
    out.push({ id, data: doc.exists ? doc.data() : null });
  }
  console.log(JSON.stringify(out, (k, v) => v && v._seconds !== undefined ? v.toDate().toISOString() : v, 2));
}
main().catch((e) => { console.error(e.stack || e.message || e); process.exitCode = 1; });
