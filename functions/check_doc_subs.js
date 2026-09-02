const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        const docPath = 'mission_realms/neet_(ug)-2027/official_documents/hash_8b16375b6143a29743d3392915bbed0f886d3764f2f2d17932faa0b852a3a089';
        const docRef = db.doc(docPath);
        const collections = await docRef.listCollections();
        console.log(`Subcollections of ${docPath}:`, collections.map(c => c.id));

        for (const col of collections) {
            const snap = await col.get();
            console.log(`Documents in ${col.id}: ${snap.size}`);
            if (snap.size > 0) {
                console.log(`Sample from ${col.id}:`, JSON.stringify(snap.docs[0].data(), null, 2));
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
