const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();

async function main() {
    const s = await db.collection('ai_queue')
        .where('task_type', '==', 'pagewise_text_extraction_batch')
        .where('status', 'in', ['queued', 'pending'])
        .limit(3)
        .get();

    const tasks = [];
    for (const d of s.docs) {
        const data = d.data();
        const docSnap = await db.collection('mission_realms').doc(data.mission_id).collection('official_documents').doc(data.document_id).get();
        const docData = docSnap.data();
        tasks.push({
            id: d.id,
            missionId: data.mission_id,
            documentId: data.document_id,
            page_start: data.page_start,
            page_end: data.page_end,
            source_checksum: docData.source_path_checksum || docData.checksum || 'UNKNOWN'
        });
    }
    console.log(JSON.stringify(tasks, null, 2));
}
main();
