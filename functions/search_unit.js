const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    projectId: 'rankcrackers-55'
});

const db = getFirestore();

async function run() {
    try {
        console.log('Searching for documents containing "PHYSICS AND MEASUREMENT"...');
        // We can't search text fields easily, but we can try collection group and check first doc
        const collections = ['micro_nodes', 'semantic_units', 'atomic_facts', 'syllabus_atoms', 'syllabus'];

        for (const colName of collections) {
            const snap = await db.collectionGroup(colName).limit(100).get();
            console.log(`Checking collection group ${colName} (${snap.size} docs)...`);
            snap.forEach(doc => {
                const data = JSON.stringify(doc.data());
                if (data.includes('PHYSICS AND MEASUREMENT')) {
                    console.log(`- FOUND in ${doc.ref.path}`);
                }
            });
        }

    } catch (error) {
        console.error(error);
    }
}

run();
