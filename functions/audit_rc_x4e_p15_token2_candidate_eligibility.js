const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();
const MISSION_ID = 'neet_(ug)-2027';
const DOCUMENT_ID = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
const TASK_IDS = [
    "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3",
    "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6",
    "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9"
];
async function main() {
    console.log('--- RC-X4E-P15 Token 2 Candidate Eligibility Audit ---');
    let allEligible = true;
    for (const tid of TASK_IDS) {
        const snap = await db.collection('ai_queue').doc(tid).get();
        if (!snap.exists) {
            console.error(`BLOCKER: Task ${tid} MISSING`);
            allEligible = false;
            continue;
        }
        const data = snap.data();
        console.log(`Task: ${tid} | Status: ${data.status}`);
        if (data.status !== 'queued' || data.mission_id !== MISSION_ID || data.document_id !== DOCUMENT_ID) allEligible = false;
    }
    const peSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOCUMENT_ID).collection('page_extractions').where('__name__', '>=', '1').where('__name__', '<=', '9').get();
    console.log(`Existing Page Extractions (1-9): ${peSnap.size}`);
    if (peSnap.size > 0) allEligible = false;
    if (allEligible) console.log('RC_X4E_P15_AUTH_TOKEN_2_CANDIDATE_ELIGIBILITY_READY');
    else process.exit(1);
}
main().catch(error => { console.error(error); process.exit(1); });
