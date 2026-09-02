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
            if (data.missionId === 'neet_(ug)-2027' || data.mission_id === 'neet_(ug)-2027') {
                console.log(`Found matching document in syllabus_registry: ${doc.id}`);
                console.log(`Data:`, JSON.stringify(data, null, 2));
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
