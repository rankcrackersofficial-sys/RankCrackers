const admin = require("firebase-admin");

console.log("🔱 INITIALIZING MISSION LISTER...");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  const snap = await db.collection('micro_nodes').get();
  const exams = {};
  snap.forEach(doc => {
    const data = doc.data();
    exams[data.examId] = (exams[data.examId] || 0) + 1;
  });
  console.log("Exams in micro_nodes:");
  console.log(exams);

  const queueSnap = await db.collection('ai_queue').get();
  const queueExams = {};
  queueSnap.forEach(doc => {
    const data = doc.data();
    queueExams[data.missionId] = (queueExams[data.missionId] || 0) + 1;
  });
  console.log("Missions in ai_queue:");
  console.log(queueExams);
}

run().catch(console.error);
