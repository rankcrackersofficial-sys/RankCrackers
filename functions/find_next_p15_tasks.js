const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();

async function main() {
    const tasksSnap = await db.collection('ai_queue')
        .where('task_type', '==', 'pagewise_text_extraction_batch')
        .where('status', 'in', ['queued', 'pending'])
        .limit(10)
        .get();

    console.log('--- Candidate Tasks for P15 ---');
    const candidates = [];
    for (const d of tasksSnap.docs) {
        const task = { id: d.id, ...d.data() };
        // Check if pages already exist
        const peSnap = await db.collection('mission_realms').doc(task.mission_id)
            .collection('official_documents').doc(task.document_id)
            .collection('page_extractions')
            .where('__name__', '>=', task.page_start.toString())
            .where('__name__', '<=', task.page_end.toString())
            .get();

        if (peSnap.size === 0) {
            candidates.push(task);
            console.log(`Task: ${task.id} | Mission: ${task.mission_id} | Pages: ${task.page_start}-${task.page_end} | Status: ${task.status}`);
        } else {
            console.log(`[SKIP] Task: ${task.id} | Existing pages: ${peSnap.size}`);
        }
        if (candidates.length >= 3) break;
    }

    if (candidates.length < 3) {
        console.log('\nInsufficient new candidates found.');
    }
}
main().catch(console.error);
