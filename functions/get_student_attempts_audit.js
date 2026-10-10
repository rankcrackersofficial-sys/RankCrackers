const admin = require("firebase-admin");

console.log("🔱 INITIALIZING STUDENT ATTEMPTS AUDITOR...");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  let foundAttempt = false;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const email = userDoc.data().email || 'N/A';
    
    // Check 'attempt_evidence' or 'attempts' subcollections
    const attemptsSnap = await db.collection('users').doc(uid).collection('attempt_evidence').get();
    const altAttemptsSnap = await db.collection('users').doc(uid).collection('attempts').get();
    const protocolsSnap = await db.collection('users').doc(uid).collection('protocols').get();

    if (attemptsSnap.size > 0 || altAttemptsSnap.size > 0 || protocolsSnap.size > 0) {
      foundAttempt = true;
      console.log(`\n=================================================`);
      console.log(`👤 STUDENT: ${uid} (${email})`);
      console.log(`-------------------------------------------------`);
      console.log(`- attempt_evidence subcollection: ${attemptsSnap.size} documents`);
      attemptsSnap.forEach(doc => {
        console.log(`  - Attempt ID: ${doc.id}, data:`, doc.data());
      });

      console.log(`- attempts subcollection: ${altAttemptsSnap.size} documents`);
      altAttemptsSnap.forEach(doc => {
        console.log(`  - Attempt ID: ${doc.id}, data:`, doc.data());
      });

      console.log(`- protocols subcollection: ${protocolsSnap.size} documents`);
      protocolsSnap.forEach(doc => {
        console.log(`  - Protocol ID: ${doc.id}, data:`, doc.data());
      });
      console.log(`=================================================`);
    }
  }

  if (!foundAttempt) {
    console.log("❌ No student attempts or protocol documents found in Firestore.");
  }
}

run().catch(console.error);
