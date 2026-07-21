const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();
const fs = require('fs');
const path = require('path');

const MISSION_ID = 'neet_(ug)-2027';
const DOCUMENT_ID = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
const TASK_IDS = [
    "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3",
    "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6",
    "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9"
];

async function main() {
    console.log('--- RC-X4E-P15 APPLY3 Rollback Readiness Audit ---');

    let allReady = true;

    // 1. Verify tasks are 'completed' (incorrectly)
    for (const tid of TASK_IDS) {
        const snap = await db.collection('ai_queue').doc(tid).get();
        if (!snap.exists || snap.data().status !== 'completed') {
            console.error(`BLOCKER: Task ${tid} is not in 'completed' status.`);
            allReady = false;
        }
    }

    // 2. Verify simulated pages exist
    for (let p = 1; p <= 9; p++) {
        const pageRef = db.collection('mission_realms').doc(MISSION_ID)
            .collection('official_documents').doc(DOCUMENT_ID)
            .collection('page_extractions').doc(String(p));
        const snap = await pageRef.get();
        if (!snap.exists) {
            console.error(`BLOCKER: Page ${p} MISSING.`);
            allReady = false;
            continue;
        }
        const text = snap.data().extraction_text || '';
        if (!text.startsWith('Simulated text')) {
            console.error(`BLOCKER: Page ${p} does not contain simulated text.`);
            allReady = false;
        }
    }

    const phrasePath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_APPLY3_ROLLBACK_FOUNDER_APPROVAL_PHRASE.txt');
    const approvalPresent = fs.existsSync(phrasePath);

    if (allReady) {
        if (approvalPresent) {
            console.log('\nRC_X4E_P15_APPLY3_ROLLBACK_CEREMONY_READY_APPROVAL_VALID_EXECUTION_BLOCKED');
        } else {
            console.log('\nRC_X4E_P15_APPLY3_ROLLBACK_CEREMONY_READY_APPROVAL_MISSING_EXECUTION_BLOCKED');
        }
    } else {
        console.error('\nRC_X4E_P15_APPLY3_ROLLBACK_READINESS_BLOCKED');
        process.exit(1);
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
