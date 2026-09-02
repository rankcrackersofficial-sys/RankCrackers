const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    const realmPath = 'mission_realms/neet_(ug)-2027';
    console.log(`Checking path: ${realmPath}`);

    try {
        const realmDoc = await db.doc(realmPath).get();
        console.log(`Realm document fields:`, realmDoc.data());

        const collections = await db.doc(realmPath).listCollections();
        console.log(`Subcollections of ${realmPath}:`, collections.map(c => c.id));

        // Manually check for syllabus and atomic_topics
        const syllabusSnap = await db.collection(`${realmPath}/syllabus`).get();
        console.log(`Documents in syllabus: ${syllabusSnap.size}`);
        syllabusSnap.forEach(doc => console.log(`- ${doc.id}`));

        const atomicTopicsSnap = await db.collection(`${realmPath}/atomic_topics`).get();
        console.log(`Documents in atomic_topics: ${atomicTopicsSnap.size}`);

        if (atomicTopicsSnap.size > 0) {
            const first = atomicTopicsSnap.docs[0].data();
            console.log('Sample atomic topic:', JSON.stringify(first, null, 2));
        }

        // Check if atomic_topics is inside syllabus documents
        if (syllabusSnap.size > 0) {
             for (const subjectDoc of syllabusSnap.docs) {
                 const subCols = await subjectDoc.ref.listCollections();
                 console.log(`Subcollections of syllabus/${subjectDoc.id}:`, subCols.map(c => c.id));
                 const subAtoms = await subjectDoc.ref.collection('atomic_topics').get();
                 if (subAtoms.size > 0) {
                     console.log(`Found ${subAtoms.size} atomic_topics in ${subjectDoc.id}`);
                 }
             }
        }

    } catch (e) {
        console.error(e);
    }
}

run();
