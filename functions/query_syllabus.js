const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const docRef = db.doc('mission_realms/neet_(ug)-2027');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log('Document mission_realms/neet_(ug)-2027 does not exist.');
        } else {
            console.log('Document mission_realms/neet_(ug)-2027 exists.');
        }

        const collections = await docRef.listCollections();
        console.log('Collections in mission_realms/neet_(ug)-2027:');
        collections.forEach(col => console.log(`- ${col.id}`));

        const syllabusExists = collections.some(col => col.id === 'syllabus');
        console.log(`1. Does the 'syllabus' collection exist? ${syllabusExists}`);

        if (syllabusExists) {
            const syllabusRef = docRef.collection('syllabus');
            const subjectsSnap = await syllabusRef.get();
            const subjects = subjectsSnap.docs.map(doc => doc.id);
            console.log('2. Top-level subjects in the syllabus:');
            subjects.forEach(s => console.log(`- ${s}`));
        }

        // Search for atomic_topics - checking if it's a subcollection
        const atomicTopicsRef = docRef.collection('atomic_topics');
        const atomicTopicsSnap = await atomicTopicsRef.get();
        console.log(`3. How many 'atomic_topics' records are there? ${atomicTopicsSnap.size}`);

        if (atomicTopicsSnap.size > 0) {
            const firstDoc = atomicTopicsSnap.docs[0].data();
            const hasProvenance = firstDoc.document_id !== undefined && firstDoc.page_number !== undefined;
            console.log(`4. Do they have source provenance (document_id, page_number)? ${hasProvenance}`);
            if (hasProvenance) {
               console.log(`   Sample provenance: document_id=${firstDoc.document_id}, page_number=${firstDoc.page_number}`);
            }

            const syntheticTopics = atomicTopicsSnap.docs.filter(doc => doc.data().synthetic === true);
            console.log(`5. Are there any 'synthetic' topics? ${syntheticTopics.length > 0}`);
            if (syntheticTopics.length > 0) {
                console.log(`   Count of synthetic topics: ${syntheticTopics.length}`);
            }
        } else {
            // Check if it's a collection group or elsewhere if not found here
            console.log('Atomic topics not found as a subcollection. Checking if it is a top-level collection...');
            const topLevelAtomicTopics = await db.collection('atomic_topics').limit(1).get();
            if (!topLevelAtomicTopics.empty) {
                console.log('Found atomic_topics at top level.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
