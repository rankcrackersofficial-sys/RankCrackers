const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const snap = await db.collectionGroup('syllabus_atoms').limit(20).get();
        console.log(`Paths in syllabus_atoms:`);
        snap.forEach(doc => console.log(`- ${doc.ref.path}`));
    } catch (error) {
        console.error(error);
    }
}

run();
