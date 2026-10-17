const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
const db = admin.firestore();
async function main() {
  const id = 'syllabus_3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f';
  const ref = db.collection('mission_realms').doc('ssc_cgl').collection('official_documents').doc(id);
  const snap = await ref.collection('page_extractions').orderBy('page_number').limit(6).get();
  const out = snap.docs.map((d) => { const x = d.data() || {}; return { id: d.id, keys: Object.keys(x), page_number: x.page_number, extraction_text: String(x.extraction_text || '').slice(0, 600), text: String(x.text || '').slice(0, 600), rawText: String(x.rawText || '').slice(0, 600), status: x.status, sourceSha256: x.sourceSha256 }; });
  console.log(JSON.stringify({ count: snap.size, pages: out }, null, 2));
}
main().catch((e) => { console.error(e.stack || e.message || e); process.exitCode = 1; });
