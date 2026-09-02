const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const ref = db.collection('syllabus_registry');
        const snap = await ref.get();
        snap.forEach(doc => {
            const data = doc.data();
            console.log(`Doc ID: ${doc.id}, Title: ${data.title}, Mission: ${data.missionId || data.mission_id}`);
        });
    } catch (error) {
        console.error(error);
    }
}

run();
