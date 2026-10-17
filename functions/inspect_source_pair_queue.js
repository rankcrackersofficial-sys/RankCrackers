const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
const db = admin.firestore();
async function main() {
  const realm = (await db.collection('mission_realms').doc('ssc_cgl').get()).data() || {};
  const parentId = realm.missionSetup?.sourcePairTaskId;
  const parent = parentId ? await db.collection('ai_queue').doc(parentId).get() : null;
  const children = parentId ? await db.collection('ai_queue').where('parentTaskId', '==', parentId).get() : { docs: [] };
  console.log(JSON.stringify({ parentId, parent: parent?.exists ? parent.data() : null, children: children.docs.map((d) => ({ id: d.id, ...d.data() })) }, (k, v) => v && v._seconds !== undefined ? v.toDate().toISOString() : v, 2));
}
main().catch((e) => { console.error(e.stack || e.message || e); process.exitCode = 1; });
