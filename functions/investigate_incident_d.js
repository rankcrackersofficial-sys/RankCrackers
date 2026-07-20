const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();

async function main() {
    const docId = 'hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b';
    const missionId = 'jee_main_2026';

    console.log('--- Incident D Task Records ---');
    const tasks = [
        `rc_x4a_pagewise_${missionId}_${docId}_b3_p11_15`,
        `rc_x4a_pagewise_${missionId}_${docId}_b4_p16_20`,
        `rc_x4a_pagewise_${missionId}_${docId}_b5_p21_25`
    ];

    for (const tid of tasks) {
        const snap = await db.collection('ai_queue').doc(tid).get();
        if (snap.exists) {
            console.log(JSON.stringify({ id: snap.id, ...snap.data() }, null, 2));
        } else {
            console.log(`Task ${tid} missing.`);
        }
    }

    console.log('\n--- Incident D Page Records (11-25) ---');
    for (let p = 11; p <= 25; p++) {
        const peSnap = await db.collection('mission_realms').doc(missionId)
            .collection('official_documents').doc(docId)
            .collection('page_extractions').doc(String(p)).get();
        if (peSnap.exists) {
            const data = peSnap.data();
            console.log(`| ${p} | ${peSnap.id} | ${data.extracted_by_task_id} | ${data.created_at?.toDate().toISOString()} | ${data.updated_at?.toDate().toISOString()} | ${data.source_proof?.checksum} | ${data.extraction_text_checksum} | ${data.extraction_status} | ${data.review_status} |`);
        } else {
            console.log(`| ${p} | MISSING |`);
        }
    }
}
main().catch(console.error);
