const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const doc = await db.doc('mission_realms/neet_(ug)-2027/syllabus/physics').get();
        if (doc.exists) {
            console.log('Physics doc exists!');
        } else {
            console.log('Physics doc does not exist.');
        }

        const atoms = await db.collection('mission_realms/neet_(ug)-2027/atomic_topics').limit(1).get();
        console.log(`Atomic topics count (direct): ${atoms.size}`);

    } catch (error) {
        console.error(error);
    }
}

run();
