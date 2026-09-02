const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const ref = db.collection('semantic_units');
        const snap = await ref.where('missionId', '==', 'neet_(ug)-2027').get();
        console.log(`Found ${snap.size} semantic_units for neet_(ug)-2027`);
        if (snap.size > 0) {
            console.log('Sample semantic unit:', JSON.stringify(snap.docs[0].data(), null, 2));
        }

        const ref2 = db.collection('atomic_facts');
        const snap2 = await ref2.where('missionId', '==', 'neet_(ug)-2027').get();
        console.log(`Found ${snap2.size} atomic_facts for neet_(ug)-2027`);
        if (snap2.size > 0) {
            console.log('Sample atomic fact:', JSON.stringify(snap2.docs[0].data(), null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
