const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const ref = db.collection('micro_nodes');
        const snap = await ref.where('mission_id', '==', 'neet_(ug)-2027').limit(10).get();
        console.log(`Found ${snap.size} micro_nodes for neet_(ug)-2027`);
        snap.forEach(doc => {
            console.log(`- ${doc.id}`);
            // console.log(`  Data:`, doc.data());
        });

        if (snap.empty) {
             // Try missionId
             const snap2 = await ref.where('missionId', '==', 'neet_(ug)-2027').limit(10).get();
             console.log(`Found ${snap2.size} micro_nodes for neet_(ug)-2027 (missionId)`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
