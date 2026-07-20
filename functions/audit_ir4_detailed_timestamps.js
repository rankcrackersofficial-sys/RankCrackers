const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'rankcrackers-55'
    });
}

const db = admin.firestore();

async function audit() {
    console.log('--- RECENT PAGE EXTRACTION TIMESTAMPS ---');
    const peSnap = await db.collectionGroup('page_extractions').get();
    const pages = [];
    peSnap.forEach(d => {
        const data = d.data();
        pages.push({
            id: d.id,
            docId: d.ref.path.split('/')[3],
            created: data.created_at?.toDate().toISOString(),
            updated: data.updated_at?.toDate().toISOString(),
            taskId: data.extracted_by_task_id
        });
    });

    pages.sort((a, b) => new Date(b.created) - new Date(a.created));

    console.log('| Page | Doc | Created | Updated | Task ID |');
    console.log('|---|---|---|---|---|');
    pages.slice(0, 15).forEach(p => {
        console.log(`| ${p.id} | ${p.docId.substring(0, 8)} | ${p.created} | ${p.updated} | ${p.taskId} |`);
    });
}

audit().catch(console.error);
