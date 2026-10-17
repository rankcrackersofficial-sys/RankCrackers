const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
const db = admin.firestore();
const taskId = 'mission_source_pair_48c6c8c3537615c7bbbc85a544358d8f5c2e7bedf4ca337506ad6f6a84f0ca5e';
async function main() {
  const snap = await db.collection('ai_queue').where('parentTaskId', '==', taskId).where('status', '==', 'completed').limit(1).get();
  if (snap.empty) throw new Error('NO_COMPLETED_SOURCE_PAIR_CHILD');
  await snap.docs[0].ref.set({ academicRepairKickAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log(JSON.stringify({ kickedTaskId: snap.docs[0].id }));
}
main().catch((e) => { console.error(e.stack || e.message || e); process.exitCode = 1; });
