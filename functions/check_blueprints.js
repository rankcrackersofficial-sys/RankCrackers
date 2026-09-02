const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        console.log('Checking blueprints...');
        const bSnap = await db.collection('blueprints').get();
        console.log(`Blueprints count: ${bSnap.size}`);
        bSnap.forEach(doc => console.log(`- ${doc.id}`));

        console.log('\nChecking official_documents for neet_(ug)-2027...');
        const odSnap = await db.collection('mission_realms/neet_(ug)-2027/official_documents').get();
        console.log(`Official documents count: ${odSnap.size}`);
        odSnap.forEach(doc => {
            console.log(`- ${doc.id}`);
            console.log(`  Data:`, JSON.stringify(doc.data(), null, 2));
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
