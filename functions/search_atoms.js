const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        console.log('Searching for atomic_topics collection group...');
        const snap = await db.collectionGroup('atomic_topics').limit(10).get();
        console.log(`Found ${snap.size} documents in collection group 'atomic_topics'`);
        snap.forEach(doc => {
            console.log(`- Path: ${doc.ref.path}`);
            // console.log(`  Data:`, doc.data());
        });

        console.log('\nSearching for syllabus collection group...');
        const syllabusSnap = await db.collectionGroup('syllabus').limit(10).get();
        console.log(`Found ${syllabusSnap.size} documents in collection group 'syllabus'`);
        syllabusSnap.forEach(doc => {
            console.log(`- Path: ${doc.ref.path}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
