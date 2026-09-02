const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const snap = await db.collectionGroup('syllabus_atoms').where('missionId', '==', 'neet_(ug)-2027').get();
        console.log(`Found ${snap.size} documents in syllabus_atoms for neet_(ug)-2027`);

        if (snap.size === 0) {
             const snap2 = await db.collectionGroup('syllabus_atoms').where('mission_id', '==', 'neet_(ug)-2027').get();
             console.log(`Found ${snap2.size} documents in syllabus_atoms for neet_(ug)-2027 (mission_id)`);
             snap2.forEach(doc => console.log(`- ${doc.ref.path}`));
        } else {
             snap.forEach(doc => console.log(`- ${doc.ref.path}`));
        }

        // Also check if 'syllabus' collection exists
        const sylSnap = await db.collectionGroup('syllabus').get();
        console.log(`\nTotal docs in 'syllabus' collection group: ${sylSnap.size}`);
        sylSnap.forEach(doc => {
            if (doc.ref.path.includes('neet_(ug)-2027')) {
                console.log(`- FOUND syllabus in path: ${doc.ref.path}`);
            }
        });

    } catch (error) {
        console.error(error);
    }
}

run();
