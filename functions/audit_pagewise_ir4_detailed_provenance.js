const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'rankcrackers-55'
    });
}

const db = admin.firestore();

async function runAudit() {
    console.log('================================================================');
    console.log('PATCH RC-X4E-IR4 - POST-R11 UNDOCUMENTED APPLY RECONCILIATION');
    console.log('================================================================');

    const MISSION_ID = 'jee_main_2026';
    const DOC_B18D = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';
    const DOC_BA8B = 'hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b';

    const pagesB18D = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,91];
    const pagesBA8B = [1,2,3,4,5,6,7,8,9,10];

    async function getPageData(docId, pageNum) {
        const snap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(docId).collection('page_extractions').doc(pageNum.toString()).get();
        return snap.exists ? snap.data() : null;
    }

    console.log('\n--- B18D PROVENANCE ---');
    for (const p of pagesB18D) {
        const data = await getPageData(DOC_B18D, p);
        console.log(`B18D|${p}|${data?.extracted_by_task_id}|${data?.created_at?.toDate().toISOString()}`);
    }

    console.log('\n--- BA8B PROVENANCE ---');
    for (const p of pagesBA8B) {
        const data = await getPageData(DOC_BA8B, p);
        console.log(`BA8B|${p}|${data?.extracted_by_task_id}|${data?.created_at?.toDate().toISOString()}`);
    }
}

runAudit().catch(console.error);
