const admin = require('firebase-admin');

async function main() {
    console.log('--- RC-X4E-P15 APPLY3 Rollback Result Audit ---');

    if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
    const db = admin.firestore();

    const missionId = 'neet_(ug)-2027';
    const documentId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
    const taskIds = [
        "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3",
        "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6",
        "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9"
    ];

    let allDeleted = true;
    for (let p = 1; p <= 9; p++) {
        const pageRef = db.collection('mission_realms').doc(missionId)
            .collection('official_documents').doc(documentId)
            .collection('page_extractions').doc(String(p));
        const snap = await pageRef.get();
        if (snap.exists) {
            console.error(`BLOCKER: Page ${p} still exists.`);
            allDeleted = false;
        }
    }

    let allReset = true;
    for (const tid of taskIds) {
        const snap = await db.collection('ai_queue').doc(tid).get();
        if (!snap.exists) {
            console.error(`BLOCKER: Task ${tid} missing.`);
            allReset = false;
            continue;
        }
        const data = snap.data();
        if (data.status !== 'queued' || data.page_extractions_created !== 0 || data.rollback_marker !== 'RC_X4E_P15_APPLY3_SIMULATED_TEXT_ROLLBACK') {
            console.error(`BLOCKER: Task ${tid} not reset correctly.`);
            allReset = false;
        }
    }

    if (allDeleted && allReset) {
        console.log('RC_X4E_P15_APPLY3_ROLLBACK_RESULT_READY');
    } else {
        process.exit(1);
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
