const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const snap = await db.collection('mission_realms').doc('jee_main_2026').collection('syllabus_atoms').limit(1).get();
  if (snap.empty) {
    console.log('No atoms found.');
    return;
  }
  console.log(JSON.stringify(snap.docs[0].data(), null, 2));
}

main().catch(console.error);
