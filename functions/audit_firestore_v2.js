const admin = require('firebase-admin');

async function audit(db, missionId) {
    console.log(`\n=== Auditing Mission: ${missionId} ===`);

    // Check mission_realms
    const realmRef = db.collection('mission_realms').doc(missionId);
    const realmSnap = await realmRef.get();

    if (!realmSnap.exists) {
        console.log(`[!] Mission ${missionId} document NOT FOUND in mission_realms`);
    } else {
        console.log(`[+] Mission ${missionId} found in mission_realms`);
        console.log('Data:', JSON.stringify(realmSnap.data(), null, 2));
    }

    const officialDocs = await realmRef.collection('official_documents').get();
    console.log(`[+] Official Documents: ${officialDocs.size}`);

    let totalPages = 0;
    let pageExtractionsCount = 0;
    let nativeExtractions = 0;
    let ocrExtractions = 0;
    let machineVerified = 0;

    for (const doc of officialDocs.docs) {
        const data = doc.data();
        const docPages = data.expected_physical_pages || 0;
        totalPages += docPages;
        console.log(`    - Document: ${doc.id}, Pages: ${docPages}, Type: ${data.document_type}`);

        const extractions = await doc.ref.collection('page_extractions').get();
        pageExtractionsCount += extractions.size;
        console.log(`      - Extractions found: ${extractions.size}`);

        extractions.forEach(e => {
            const eData = e.data();
            if (eData.extraction_method === 'native_pdf_text') nativeExtractions++;
            if (eData.extraction_method === 'VISION_OCR_PAGEWISE' || eData.extraction_method === 'hybrid_routing_v1') ocrExtractions++;
            if (eData.review_status === 'machine_verified' || eData.review_status === 'verified') machineVerified++;
        });
    }

    const structuredNodes = await realmRef.collection('structured_nodes').get();
    const canonicalAtoms = await realmRef.collection('canonical_atoms').get();

    console.log(`[+] Structured Nodes: ${structuredNodes.size}`);
    console.log(`[+] Canonical Atoms: ${canonicalAtoms.size}`);

    const tasks = await db.collection('ai_queue').get();
    let pending = 0, active = 0, terminal = 0;
    let missionTasks = [];

    tasks.forEach(t => {
        const d = t.data();
        if (d.mission_id === missionId) {
            missionTasks.push({id: t.id, ...d});
            const status = d.status;
            if (status === 'pending' || status === 'queued' || status === 'received') pending++;
            else if (status === 'processing') active++;
            else if (status === 'completed' || status === 'failed') terminal++;
        }
    });

    console.log(`[+] AI Queue Tasks: ${missionTasks.length} (Pending: ${pending}, Active: ${active}, Terminal: ${terminal})`);

    if (missionId.includes('RPSC') || missionTasks.length > 0) {
        console.log('--- Task Details ---');
        missionTasks.forEach(t => {
            console.log(`    Task: ${t.id}, Type: ${t.task_type || t.type}, Status: ${t.status}, Doc: ${t.source_document_id}, Range: ${t.page_start}-${t.page_end}, Worker: ${t.workerRevision || 'N/A'}`);
        });
    }
}

async function main() {
    if (admin.apps.length === 0) {
        admin.initializeApp({ projectId: 'rankcrackers-55' });
    }
    const db = admin.firestore();

    await audit(db, 'neet_(ug)-2027');
    await audit(db, 'RPSC_FIRST_GRADE2026_2026_1782713222215');
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
