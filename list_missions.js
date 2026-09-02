const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

async function list() {
  console.log("Listing mission_realms:");
  const snap = await db.collection('mission_realms').get();
  console.log("Found", snap.size, "missions");
  snap.forEach(doc => {
    console.log("-", doc.id);
  });
}

list().catch(console.error);
