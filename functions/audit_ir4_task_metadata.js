const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'rankcrackers-55'
    });
}

const db = admin.firestore();

async function audit() {
    const tasks = [
        'rc_x4a_pagewise_jee_main_2026_hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b_b1_p1_5',
        'rc_x4a_pagewise_jee_main_2026_hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b_b2_p6_10',
        'rc_x4a_pagewise_jee_main_2026_hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e_b9_p25_27'
    ];

    for (const tid of tasks) {
        const snap = await db.collection('ai_queue').doc(tid).get();
        if (snap.exists) {
            const d = snap.data();
            console.log(`Task: ${tid}`);
            console.log(`  CreatedAt: ${d.created_at?.toDate().toISOString()}`);
            console.log(`  StartedAt: ${d.started_at?.toDate().toISOString()}`);
            console.log(`  CompletedAt: ${d.completed_at?.toDate().toISOString()}`);
            console.log(`  Status: ${d.status}`);
            console.log(`  CreatedByPatch: ${d.created_by_patch_completed || d.created_by_patch}`);
            console.log(`  Metadata: ${JSON.stringify(d.metadata || {}, null, 2)}`);
        }
    }

    // Check for recent page extraction timestamps
    const peSnap = await db.collectionGroup('page_extractions').orderBy('created_at', 'desc').limit(5).get();
    console.log('\n--- Newest Page Extractions ---');
    peSnap.forEach(d => {
        console.log(`Page: ${d.id} | Created: ${d.data().created_at?.toDate().toISOString()} | Updated: ${d.data().updated_at?.toDate().toISOString()}`);
    });
}

audit().catch(console.error);
