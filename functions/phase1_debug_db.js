delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}

const db = admin.firestore();

async function run() {
  console.log("Project ID:", admin.app().options.projectId);
  
  const collections = await db.listCollections();
  console.log("Root collections:", collections.map(c => c.id));
  
  // Check if missionId exists
  const realms = await db.collection('mission_realms').listDocuments();
  console.log("Documents in mission_realms:", realms.map(d => d.id));
  
  // Let's check subcollections of jee_main_2026
  const jeeRef = db.collection('mission_realms').doc('jee_main_2026');
  const subcolls = await jeeRef.listCollections();
  console.log("Subcollections of jee_main_2026:", subcolls.map(c => c.id));
  
  if (subcolls.map(c => c.id).includes('official_documents')) {
    const docs = await jeeRef.collection('official_documents').listDocuments();
    console.log("Documents in official_documents:", docs.map(d => d.id));
  }
}

run().catch(console.error);
