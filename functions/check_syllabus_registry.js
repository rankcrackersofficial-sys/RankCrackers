const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const ref = db.collection('syllabus_registry');
        const snap = await ref.get();
        console.log('Documents in syllabus_registry:');
        snap.forEach(doc => console.log(`- ${doc.id}`));

        // Check if any document corresponds to neet_(ug)-2027
        const neetDoc = snap.docs.find(doc => doc.id === 'neet_(ug)-2027' || doc.data().mission_id === 'neet_(ug)-2027');
        if (neetDoc) {
            console.log('Found neet_(ug)-2027 in syllabus_registry.');
            console.log('Fields:', JSON.stringify(neetDoc.data(), null, 2));

            const subCols = await neetDoc.ref.listCollections();
            console.log('Subcollections:', subCols.map(c => c.id));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
