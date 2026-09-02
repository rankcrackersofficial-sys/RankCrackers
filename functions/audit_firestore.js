const admin = require('firebase-admin');

async function audit(db, missionId) {
    console.log(`--- Auditing Mission: ${missionId} ---`);
    const missionRef = db.collection('missions').doc(missionId);
    const missionSnap = await missionRef.get();

    if (!missionSnap.exists) {
        console.log(`Mission ${missionId} not found in missions collection`);
        // Check mission_realms
        const realmRef = db.collection('mission_realms').doc(missionId);
        const realmSnap = await realmRef.get();
        if (!realmSnap.exists) {
             console.log(`Mission ${missionId} not found in mission_realms collection`);
             return;
        }
        console.log(`Mission found in mission_realms: ${missionId}`);
    } else {
        console.log(`Mission found in missions: ${missionId}`);
    }

    const sourceDocs = await db.collection('mission_realms').doc(missionId).collection('official_documents').get();
    console.log(`Source Documents: ${sourceDocs.size}`);

    let totalPages = 0;
    let pageExtractions = 0;
    let nativeExtractions = 0;
    let ocrExtractions = 0;
    let machineVerified = 0;

    for (const doc of sourceDocs.docs) {
        const data = doc.data();
        totalPages += data.expected_physical_pages || 0;
        console.log(`Document: ${doc.id}, Pages: ${data.expected_physical_pages}, Type: ${data.document_type}`);

        const extractions = await doc.ref.collection('page_extractions').get();
        pageExtractions += extractions.size;

        extractions.forEach(e => {
            const eData = e.data();
            if (eData.extraction_method === 'native_pdf_text') nativeExtractions++;
            if (eData.extraction_method === 'VISION_OCR_PAGEWISE' || eData.extraction_method === 'hybrid_routing_v1') ocrExtractions++;
            if (eData.review_status === 'machine_verified' || eData.review_status === 'verified') machineVerified++;
        });
    }

    const structuredNodes = await db.collection('mission_realms').doc(missionId).collection('structured_nodes').get();
    const canonicalAtoms = await db.collection('mission_realms').doc(missionId).collection('canonical_atoms').get();

    const tasks = await db.collection('ai_queue').where('mission_id', '==', missionId).get();
    let pending = 0, active = 0, terminal = 0;
    tasks.forEach(t => {
        const status = t.data().status;
        if (status === 'pending' || status === 'queued' || status === 'received') pending++;
        else if (status === 'processing') active++;
        else if (status === 'completed' || status === 'failed') terminal++;
    });

    console.log(`Summary for ${missionId}:`);
    console.log(`TOTAL_SOURCE_PAGES: ${totalPages}`);
    console.log(`PAGE_EXTRACTIONS: ${pageExtractions}`);
    console.log(`NATIVE_EXTRACTIONS: ${nativeExtractions}`);
    console.log(`OCR_EXTRACTIONS: ${ocrExtractions}`);
    console.log(`MACHINE_VERIFIED_PAGES: ${machineVerified}`);
    console.log(`STRUCTURED_NODES: ${structuredNodes.size}`);
    console.log(`CANONICAL_ATOMS: ${canonicalAtoms.size}`);
    console.log(`TASKS: Pending=${pending}, Active=${active}, Terminal=${terminal}`);

    if (missionId.includes('RPSC')) {
        console.log('--- RPSC Tasks Detail ---');
        tasks.forEach(t => {
            const d = t.data();
            console.log(`Task: ${t.id}, Type: ${d.task_type || d.type}, Status: ${d.status}, State: ${d.state || 'N/A'}, Doc: ${d.source_document_id}, Range: ${d.page_start}-${d.page_end}, Worker: ${d.workerRevision || 'N/A'}, Output: ${d.actualOutputPath || 'N/A'}`);
        });
    }
}

async function main() {
    const app = admin.initializeApp({ projectId: 'rankcrackers-55' });
    const dbDefault = app.firestore(); // (default)
    const dbEnterprise = app.firestore('default');

    console.log('Checking (default) database...');
    await audit(dbDefault, 'neet_(ug)-2027');
    await audit(dbDefault, 'RPSC_FIRST_GRADE2026_2026_1782713222215');

    console.log('\nChecking "default" (Enterprise) database...');
    try {
        await audit(dbEnterprise, 'neet_(ug)-2027');
        await audit(dbEnterprise, 'RPSC_FIRST_GRADE2026_2026_1782713222215');
    } catch (e) {
        console.log('Error accessing Enterprise database:', e.message);
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
