const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const subjects = ['Physics', 'Chemistry', 'Biology'];
        for (const s of subjects) {
            const path = `mission_realms/neet_(ug)-2027/syllabus/${s}/atomic_topics`;
            const snap = await db.collection(path).get();
            console.log(`Path: ${path}, Count: ${snap.size}`);
        }
    } catch (error) {
        console.error(error);
    }
}

run();
