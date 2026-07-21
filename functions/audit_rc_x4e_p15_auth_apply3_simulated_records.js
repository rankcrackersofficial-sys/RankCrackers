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
    console.log('--- RC-X4E-P15 AUTH APPLY 3 Simulated Records Audit ---');

    let simulatedTextConfirmed = false;
    let forbiddenFieldFound = false;
    let sideEffectFound = false;

    // 1. Task Check
    console.log('\n--- ai_queue Tasks ---');
    for (const tid of TASK_IDS) {
        const snap = await db.collection('ai_queue').doc(tid).get();
        if (!snap.exists) {
            console.log(`Task ${tid}: MISSING`);
            continue;
        }
        const data = snap.data();
        console.log(`Task: ${tid} | Status: ${data.status} | PE Created: ${data.page_extractions_created}`);
        console.log(`  started_at: ${data.started_at ? data.started_at.toDate().toISOString() : 'N/A'}`);
        console.log(`  completed_at: ${data.completed_at ? data.completed_at.toDate().toISOString() : 'N/A'}`);
    }

    // 2. Page Extraction Check
    console.log('\n--- page_extractions (1-9) ---');
    for (let p = 1; p <= 9; p++) {
        const pageRef = db.collection('mission_realms').doc(MISSION_ID)
            .collection('official_documents').doc(DOCUMENT_ID)
            .collection('page_extractions').doc(String(p));
        const snap = await pageRef.get();
        if (!snap.exists) {
            console.log(`Page ${p}: MISSING`);
            continue;
        }
        const data = snap.data();
        const text = data.extraction_text || '';
        const isSimulated = text.startsWith('Simulated text');
        if (isSimulated) simulatedTextConfirmed = true;

        console.log(`Page ${p}: EXISTS | Length: ${text.length} | Simulated: ${isSimulated}`);
        console.log(`  Preview: "${text.substring(0, 50)}..."`);
        console.log(`  Status: ${data.extraction_status} | Review: ${data.review_status}`);
        console.log(`  Method: ${data.extraction_method} | Task: ${data.extracted_by_task_id}`);

        // Check for forbidden fields
        const forbidden = ['published', 'approved', 'verified', 'founder_approved', 'publish_status'];
        forbidden.forEach(f => {
            if (data[f] !== undefined) {
                console.log(`  FORBIDDEN FIELD FOUND: ${f}`);
                forbiddenFieldFound = true;
            }
        });
    }

    // 3. Side Effects Check
    console.log('\n--- Side Effects Check ---');
    const docSnap = await db.collection('mission_realms').doc(MISSION_ID)
        .collection('official_documents').doc(DOCUMENT_ID).get();
    const docData = docSnap.data();
    console.log(`Parent Document verified: ${docData.verified}`);
    if (docData.verified || docData.approved || docData.published) {
        console.log('  SIDE EFFECT FOUND: Parent doc has unexpected approval/publish fields.');
        sideEffectFound = true;
    }

    const syllabusSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('syllabus_atoms').get();
    console.log(`Syllabus Atoms Count: ${syllabusSnap.size}`);

    if (simulatedTextConfirmed) console.log('\nRC_X4E_P15_AUTH_APPLY_3_IR1_FIRESTORE_SIMULATED_TEXT_CONFIRMED');
    if (forbiddenFieldFound) console.log('RC_X4E_P15_AUTH_APPLY_3_IR1_FORBIDDEN_FIELD_FOUND');
    if (sideEffectFound) console.log('RC_X4E_P15_AUTH_APPLY_3_IR1_SIDE_EFFECT_FOUND');

    if (!simulatedTextConfirmed) console.log('\nRC_X4E_P15_AUTH_APPLY_3_IR1_FIRESTORE_REAL_TEXT_CONFIRMED');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
