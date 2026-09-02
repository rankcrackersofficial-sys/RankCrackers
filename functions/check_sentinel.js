const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const ref = db.collection('sentinel_drafts');
        const snap = await ref.where('missionId', '==', 'neet_(ug)-2027').get();
        console.log(`Found ${snap.size} documents in sentinel_drafts for neet_(ug)-2027`);
        snap.forEach(doc => {
            console.log(`- ${doc.id}`);
            const data = doc.data();
            console.log(`  Data:`, JSON.stringify(data, null, 2));
        });
    } catch (error) {
        console.error(error);
    }
}

run();
