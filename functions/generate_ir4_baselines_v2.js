const admin = require('firebase-admin');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();

async function main() {
    // 1. Queue Baseline
    const qSnap = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
    const qData = {};
    const sortedDocs = qSnap.docs.sort((a, b) => a.id.localeCompare(b.id));
    sortedDocs.forEach(d => {
        const data = d.data();
        qData[d.id] = {
            status: data.status,
            mission_id: data.mission_id,
            document_id: data.document_id,
            page_start: data.page_start,
            page_end: data.page_end
        };
    });
    const qJson = JSON.stringify(qData, null, 2);
    const qHash = crypto.createHash('sha256').update(qJson).digest('hex');
    const qPath = 'docs/patch_safety/RC_X4E_IR4_REFINE6_ai_queue_baseline.json';
    fs.mkdirSync(path.dirname(qPath), { recursive: true });
    fs.writeFileSync(qPath, qJson);

    // 2. Page Baseline
    const peSnap = await db.collectionGroup('page_extractions').get();
    const peData = {};
    const sortedPe = peSnap.docs.sort((a, b) => a.ref.path.localeCompare(b.ref.path));
    sortedPe.forEach(d => {
        peData[d.ref.path] = true;
    });
    const peJson = JSON.stringify(peData, null, 2);
    const peHash = crypto.createHash('sha256').update(peJson).digest('hex');
    const pePath = 'docs/patch_safety/RC_X4E_IR4_REFINE6_page_extractions_baseline.json';
    fs.writeFileSync(pePath, peJson);

    console.log(`Queue Hash: ${qHash} | Path: ${qPath} | Records: ${qSnap.size}`);
    console.log(`Page Hash: ${peHash} | Path: ${pePath} | Records: ${peSnap.size}`);
}

main().catch(console.error);
