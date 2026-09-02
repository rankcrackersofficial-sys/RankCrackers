const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        console.log('Listing syllabus_atoms to check for synthetic topics...');
        const snap = await db.collectionGroup('syllabus_atoms').get();
        console.log(`Checking ${snap.size} documents...`);
        let count = 0;
        snap.forEach(doc => {
            const data = doc.data();
            if (data.synthetic === true) {
                console.log(`- FOUND synthetic in ${doc.ref.path}`);
                count++;
            }
        });
        console.log(`Total synthetic topics found: ${count}`);
    } catch (error) {
        console.error(error);
    }
}

run();
