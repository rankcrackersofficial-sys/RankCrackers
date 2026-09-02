const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        console.log('Searching for "synthetic: true"...');
        const collections = ['syllabus_atoms', 'micro_nodes', 'semantic_units', 'atomic_topics'];
        for (const col of collections) {
            const snap = await db.collectionGroup(col).where('synthetic', '==', true).get();
            console.log(`Found ${snap.size} synthetic documents in ${col} collection group.`);
            snap.forEach(doc => console.log(`- ${doc.ref.path}`));
        }
    } catch (error) {
        console.error(error);
    }
}

run();
