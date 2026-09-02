const admin = require('firebase-admin');

async function auditDB(db, dbName) {
    console.log(`\n********** DATABASE: ${dbName} **********`);

    const realms = await db.collection('mission_realms').listDocuments();
    console.log(`Realms in ${dbName}:`, realms.map(d => d.id));

    for (const realmRef of realms) {
        const missionId = realmRef.id;
        if (!missionId.includes('neet') && !missionId.includes('RPSC')) continue;

        console.log(`\n--- Auditing Mission: ${missionId} ---`);

        const collections = await realmRef.listCollections();
        console.log(`Collections in ${missionId}:`, collections.map(c => c.id));

        for (const coll of collections) {
            const docs = await coll.get();
            console.log(`  Collection ${coll.id}: ${docs.size} documents`);
            if (coll.id === 'official_documents') {
                for (const doc of docs.docs) {
                    console.log(`    Doc: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
                    const extractions = await doc.ref.collection('page_extractions').get();
                    console.log(`      Page Extractions: ${extractions.size}`);
                }
            }
        }

        const structuredNodes = await realmRef.collection('structured_nodes').get();
        console.log(`  Structured Nodes: ${structuredNodes.size}`);
    }

    const tasks = await db.collection('ai_queue').get();
    console.log(`\nTotal AI Queue Tasks in ${dbName}: ${tasks.size}`);
    tasks.forEach(t => {
        const d = t.data();
        if (d.mission_id && (d.mission_id.includes('neet') || d.mission_id.includes('RPSC'))) {
            console.log(`  Task: ${t.id}, Mission: ${d.mission_id}, Status: ${d.status}, Type: ${d.task_type || d.type}`);
        }
    });
}

async function main() {
    const app = admin.initializeApp({ projectId: 'rankcrackers-55' }, 'audit-app');

    const dbStandard = app.firestore(); // (default)
    await auditDB(dbStandard, '(default) - Standard');

    try {
        const dbEnterprise = app.firestore('default');
        await auditDB(dbEnterprise, 'default - Enterprise');
    } catch (e) {
        console.log('Error accessing Enterprise database:', e.message);
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
