const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    const realmPath = 'mission_realms/neet_(ug)-2027';
    try {
        console.log(`Checking ${realmPath}/syllabus_atoms...`);
        const atomsSnap = await db.collection(`${realmPath}/syllabus_atoms`).get();
        console.log(`Count: ${atomsSnap.size}`);
        if (atomsSnap.size > 0) {
            console.log('Sample atom:', JSON.stringify(atomsSnap.docs[0].data(), null, 2));
        }

        console.log(`\nChecking ${realmPath}/syllabus...`);
        const syllabusSnap = await db.collection(`${realmPath}/syllabus`).get();
        console.log(`Count: ${syllabusSnap.size}`);
        if (syllabusSnap.size > 0) {
            syllabusSnap.forEach(doc => console.log(`- ${doc.id}`));
        }

        console.log(`\nChecking ${realmPath}/atomic_topics...`);
        const atomicTopicsSnap = await db.collection(`${realmPath}/atomic_topics`).get();
        console.log(`Count: ${atomicTopicsSnap.size}`);

    } catch (error) {
        console.error(error);
    }
}

run();
