const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore('default');

async function run() {
    try {
        const collections = await db.listCollections();
        console.log('Top-level collections (Enterprise):');
        collections.forEach(col => console.log(`- ${col.id}`));
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
