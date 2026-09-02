const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const realmsRef = db.collection('mission_realms');
        const snap = await realmsRef.get();
        console.log('Documents in mission_realms:');
        snap.forEach(doc => console.log(`- ${doc.id}`));
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
