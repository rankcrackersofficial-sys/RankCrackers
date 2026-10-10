const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}

const db = admin.firestore();

async function findUploads() {
  console.log('=== FIND UPLOADS STARTING ===');
  
  // List of potential collections
  const collections = [
    'founder_missions',
    'student_missions',
    'student_mission_catalog',
    'ingestion_refinery',
    'source_registries',
    'source_binding',
    'refinery_metadata',
    'official_sources',
    'syllabus_source',
    'syllabus',
    'notification_sources',
    'pyq_sources',
    'uploads',
    'ai_queue'
  ];

  for (const col of collections) {
    try {
      const snap = await db.collection(col).get();
      console.log(`\nCollection '${col}' has ${snap.size} documents.`);
      if (snap.size > 0) {
        snap.forEach(doc => {
          console.log(`- Doc ID: '${doc.id}'`);
          console.log('  Data:', JSON.stringify(doc.data(), null, 2));
        });
      }
    } catch (err) {
      console.log(`Error reading '${col}': ${err.message}`);
    }
  }

  console.log('\n=== FIND UPLOADS COMPLETE ===');
  process.exit(0);
}

findUploads();
