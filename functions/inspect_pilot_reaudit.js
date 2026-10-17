const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
const db = admin.firestore();
const id = process.argv[2];
async function main() {
  const pilot = await db.collection('pilot_automation').doc(id).get();
  const marker = await db.collection('mission_academic_delivery').doc('ssc_cgl_ssc_cgl_2026').get();
  const realm = await db.collection('mission_realms').doc('ssc_cgl').get();
  const out = { pilot: pilot.exists ? pilot.data() : null, marker: marker.exists ? marker.data() : null, realm: realm.exists ? realm.data() : null };
  console.log(JSON.stringify(out, (key, value) => value && value._seconds !== undefined ? value.toDate().toISOString() : value, 2));
}
main().catch((error) => { console.error(error.stack || error.message || error); process.exitCode = 1; });
