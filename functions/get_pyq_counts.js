const admin = require("firebase-admin");

console.log("🔱 INITIALIZING PYQ COUNTER...");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  const snap = await db.collection('content_payloads').get();
  let pyqCount = 0;
  snap.forEach(doc => {
    const data = doc.data();
    if (data.easyMcqs) {
      data.easyMcqs.forEach(q => {
        if (q.isPYQ) {
          pyqCount++;
          console.log(`- Found Authentic PYQ: ${q.id} mapped to AMTN ${q.nodeId}`);
        }
      });
    }
  });
  console.log(`TOTAL AUTHENTIC PYQ INGESTED & MAPPED: ${pyqCount}`);
}

run().catch(console.error);
