const admin = require("firebase-admin");

console.log("🔱 INITIALIZING STUDENT SESSION FINDER...");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  console.log(`TOTAL USER PROFILES IN FIRESTORE: ${usersSnap.size}`);
  
  usersSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- User: ${doc.id}, Email: ${data.email || 'N/A'}, Role: ${data.role || 'N/A'}`);
  });
}

run().catch(console.error);
