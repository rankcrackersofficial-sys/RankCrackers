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

        for (const doc of snap.docs) {
            console.log(`Realm: ${doc.id}`);
            const collections = await doc.ref.listCollections();
            console.log(`  Subcollections: ${collections.map(c => c.id).join(', ')}`);
        }
    } catch (error) {
        console.error(error);
    }
}

run();
