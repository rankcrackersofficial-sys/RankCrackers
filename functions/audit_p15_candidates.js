const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();

async function main() {
    const MISSION_ID = 'jee_main_2026';
    const DOC_ID = 'hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e';

    const docSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_ID).get();
    console.log('--- Document Metadata ---');
    console.log(JSON.stringify(docSnap.data(), null, 2));

    const tasksSnap = await db.collection('ai_queue')
        .where('document_id', '==', DOC_ID)
        .where('status', 'in', ['queued', 'pending'])
        .get();

    console.log('\n--- Eligible P15 Tasks (B18D) ---');
    tasksSnap.forEach(d => {
        const data = d.data();
        console.log(`Task: ${d.id} | Range: ${data.page_start}-${data.page_end}`);
    });

    const peSnap = await db.collection('mission_realms').doc(MISSION_ID).collection('official_documents').doc(DOC_ID).collection('page_extractions').get();
    console.log(`\nExisting Page Extractions for B18D: ${peSnap.size}`);

    // Check if 91 unique pages exist or if there are duplicates
    const pages = new Set();
    peSnap.forEach(d => pages.add(parseInt(d.id)));
    console.log(`Unique pages: ${pages.size}`);
}
main().catch(console.error);
