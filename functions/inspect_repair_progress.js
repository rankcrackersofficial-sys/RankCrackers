const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
const db = admin.firestore();
async function main() {
  const realmSnap = await db.collection('mission_realms').doc('ssc_cgl').get();
  const realm = realmSnap.data() || {};
  const task = realm.missionSetup?.sourcePairTaskId;
  const parent = task ? (await db.collection('ai_queue').doc(task).get()).data() || {} : {};
  const childSnap = task ? await db.collection('ai_queue').where('parentTaskId', '==', task).get() : { docs: [] };
  const counts = {};
  for (const d of childSnap.docs) { const s = d.data()?.status || 'missing'; counts[s] = (counts[s] || 0) + 1; }
  const marker = (await db.collection('mission_academic_delivery').doc('ssc_cgl_ssc_cgl_2026').get()).data() || null;
  const cycle = (await db.collection('mission_realms').doc('ssc_cgl').collection('cycles').doc('ssc_cgl_2026').get()).data() || {};
  console.log(JSON.stringify({ task, parentStatus: parent.status || null, childCount: childSnap.docs.length, childStatus: counts, notificationBinding: cycle.notificationBinding || null, syllabusBinding: cycle.syllabusBinding || null, syllabusBindingMode: cycle.syllabusBindingMode || null, marker: marker ? { status: marker.status, version: marker.materializerVersion, sourceDocumentId: marker.sourceDocumentId, nodeCount: marker.nodeCount, retiredLegacyCount: marker.retiredLegacyCount, error: marker.error } : null, repair: realm.automatedRepair || null, visibility: { studentVisible: realm.studentVisible, catalogVisible: realm.catalogVisible, userPanelVisible: realm.userPanelVisible, cardVisible: realm.cardVisible } }, (k, v) => v && v._seconds !== undefined ? v.toDate().toISOString() : v, 2));
}
main().catch((e) => { console.error(e.stack || e.message || e); process.exitCode = 1; });
