const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const docRef = db.collection('sentinel_drafts').doc('draft_unknown_general_v1783351746120');
        const snap = await docRef.get();
        if (snap.exists) {
            console.log('Draft fields:', JSON.stringify(snap.data(), null, 2));
        } else {
            console.log('Draft not found.');
        }
    } catch (error) {
        console.error(error);
    }
}

run();
