const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
const db = admin.firestore();
async function count(collection, field, value) { const s = await db.collection(collection).where(field, '==', value).get(); return s.size; }
async function main() {
  const nodes = await db.collection('micro_nodes').where('missionId', '==', 'ssc_cgl').where('generatedBy', '==', 'mission_academic_materializer_v2_guarded_syllabus').get();
  const digi = await db.collection('digibook_units').where('missionId', '==', 'ssc_cgl').where('generatedBy', '==', 'mission_academic_materializer_v2_guarded_syllabus').get();
  const oldNodes = await db.collection('micro_nodes').where('missionId', '==', 'ssc_cgl').where('generatedBy', '==', 'mission_academic_materializer_v1').get();
  const oldDigi = await db.collection('digibook_units').where('missionId', '==', 'ssc_cgl').where('generatedBy', '==', 'mission_academic_materializer_v1').get();
  const questions = await db.collection('published_questions').where('examId', '==', 'ssc_cgl').get();
  const papers = await db.collection('test_arena_papers').where('missionId', '==', 'ssc_cgl').get();
  console.log(JSON.stringify({
    v2: { nodes: nodes.size, digibook: digi.size, sampleTitles: nodes.docs.slice(0, 12).map((d) => d.data().title), notificationMarkerHits: nodes.docs.filter((d) => /reservation|vacanc|ews|sc\s*\/\s*st|eligibility|age limit/i.test(String(d.data().title) + ' ' + String(d.data().description))).length },
    legacy: { nodes: oldNodes.size, publishedNodes: oldNodes.docs.filter((d) => d.data().status === 'published').length, digibook: oldDigi.size, publishedDigibook: oldDigi.docs.filter((d) => d.data().status === 'published').length },
    questions: questions.docs.map((d) => ({ id: d.id, status: d.data().status, question: d.data().question })),
    papers: papers.docs.map((d) => ({ id: d.id, status: d.data().status, isReleased: d.data().isReleased, questionCount: d.data().questionCount })),
  }, null, 2));
}
main().catch((e) => { console.error(e.stack || e.message || e); process.exitCode = 1; });
