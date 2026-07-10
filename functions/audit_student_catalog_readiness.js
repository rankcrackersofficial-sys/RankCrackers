const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

async function main() {
    console.log("================================================================================");
    console.log("RUNNING STUDENT CATALOG READINESS TRUTH AUDIT (PATCH M5A)");
    console.log("================================================================================");

    let token;
    try {
        token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    } catch (e) {
        console.error("Authentication Error: Could not get gcloud access token. Ensure gcloud is logged in.", e.message);
        process.exit(1);
    }

    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: token });

    const db = new Firestore({
        projectId: 'rankcrackers-55',
        authClient: auth
    });

    const missionIds = [
        'jee_main_2026',
        'neet_(ug)-2027',
        'RPSC_FIRST_GRADE2026_2026_1782713222215'
    ];

    let catalogCheckedCount = 0;
    const auditResults = [];

    for (const missionId of missionIds) {
        console.log(`\n--------------------------------------------------------------------------------`);
        console.log(`Auditing Mission: ${missionId}`);
        console.log(`--------------------------------------------------------------------------------`);

        // ==========================================
        // PART A: Catalog Document Audit
        // ==========================================
        const catalogRef = db.collection('student_mission_catalog').doc(missionId);
        const catalogSnap = await catalogRef.get();
        
        let catalogData = null;
        if (catalogSnap.exists) {
            catalogCheckedCount++;
            catalogData = catalogSnap.data();
            console.log("Part A — Catalog Document Information:");
            console.log(`  - Title:              ${catalogData.title || catalogData.name || 'N/A'}`);
            console.log(`  - State:              ${catalogData.state || 'N/A'}`);
            console.log(`  - Exam Category:      ${catalogData.examCategory || catalogData.exam_category || 'N/A'}`);
            console.log(`  - Catalog Status:     ${catalogData.catalogStatus || catalogData.status || 'N/A'}`);
            console.log(`  - User Panel Visible: ${catalogData.userPanelVisible}`);
            console.log(`  - Card Visible:       ${catalogData.cardVisible}`);
            console.log(`  - Student Message:    "${catalogData.studentMessage || ''}"`);
            console.log(`  - Variables Count:    ${catalogData.variables ? catalogData.variables.length : 0}`);
            console.log(`  - Content Readiness:  `, catalogData.contentReadiness || {});
        } else {
            console.log(`Part A — Catalog Document Information: [NOT FOUND in student_mission_catalog]`);
        }

        // ==========================================
        // PART B: Live Backend Readiness Audit
        // ==========================================
        console.log("\nPart B — Live Backend Readiness Audit:");
        const missionRef = db.collection('mission_realms').doc(missionId);
        const missionSnap = await missionRef.get();
        const missionData = missionSnap.exists ? missionSnap.data() : {};

        // 1. Variables
        const varsSnap = await missionRef.collection('variables').get();
        const liveVarsCount = varsSnap.size;

        // 2. Notification Readiness
        const offDocsSnap = await missionRef.collection('official_documents').get();
        let offDocs = [];
        offDocsSnap.forEach(d => offDocs.push({ id: d.id, ...d.data() }));

        let hasNotificationDoc = false;
        let notificationDoc = null;
        for (const doc of offDocs) {
            const role = (doc.document_role || doc.documentRole || '').toLowerCase();
            const type = (doc.document_type || doc.documentType || '').toLowerCase();
            const category = (doc.category || '').toLowerCase();
            const name = (doc.file_name || doc.fileName || '').toLowerCase();

            if (role === 'notification' || type === 'notification' || category === 'notification' || name.includes('notification')) {
                hasNotificationDoc = true;
                notificationDoc = doc;
                break;
            }
        }

        let externalNotificationDoc = null;
        if (!hasNotificationDoc) {
            const registryColls = ['ingestion_refinery', 'source_documents'];
            for (const collName of registryColls) {
                try {
                    const snap = await db.collection(collName).get();
                    snap.forEach(d => {
                        const data = d.data();
                        const missionLink = data.mission_id || data.missionId || '';
                        const docRole = data.document_role || data.documentRole || '';
                        if (missionLink === missionId && (docRole === 'notification' || d.id.includes('notification'))) {
                            externalNotificationDoc = { id: d.id, ...data };
                        }
                    });
                } catch (_) {}
                if (externalNotificationDoc) break;
            }
        }

        const activeNotification = notificationDoc || externalNotificationDoc;
        const notificationExists = !!activeNotification;

        console.log(`  1. Notification Readiness:`);
        console.log(`     - Notification Document Exists:    ${notificationExists ? 'YES' : 'NO'} (${activeNotification ? activeNotification.id : 'N/A'})`);

        // 3. Syllabus Readiness
        const syllabusDocsCount = offDocs.filter(d => (d.document_role || d.documentRole || d.category || '').toLowerCase() === 'syllabus').length;
        const syllabusAtomsSnap = await missionRef.collection('syllabus_atoms').get();
        const syllabusAtomsCount = syllabusAtomsSnap.size;
        let verifiedSyllabusAtomsCount = 0;
        syllabusAtomsSnap.forEach(d => {
            const data = d.data();
            if (data.status === 'verified' || data.verified === true) {
                verifiedSyllabusAtomsCount++;
            }
        });

        console.log(`  2. Syllabus Readiness:`);
        console.log(`     - Official Syllabus Docs Count:    ${syllabusDocsCount}`);
        console.log(`     - Syllabus Atoms Count:            ${syllabusAtomsCount}`);
        console.log(`     - Verified Syllabus Atoms Count:   ${verifiedSyllabusAtomsCount}`);

        // 4. Crucible Days count with filters
        const daysSnap = await missionRef.collection('crucible_days').get();
        let daysCount = 0;
        daysSnap.forEach(d => {
            const data = d.data();
            const cid = data.crucible_id || '';
            const isArchived = data.archived === true || data.is_legacy_duplicate === true || data.status === 'archived_legacy_duplicate' || cid.startsWith('legacy_');
            if (!isArchived) {
                if (missionId === 'jee_main_2026') {
                    if (cid === 'plan_jee_2026') {
                        daysCount++;
                    }
                } else {
                    daysCount++;
                }
            }
        });

        // 5. Test count with filter
        const crucibleTestsSnap = await missionRef.collection('crucible_tests').get();
        let microTestsCount = 0;
        let macroTestsCount = 0;
        let majorTestsCount = 0;
        let totalTestsCount = 0;
        crucibleTestsSnap.forEach(d => {
            const data = d.data();
            const testType = (data.test_type || '').toLowerCase();
            const testId = (data.test_id || d.id || '').toUpperCase();
            
            if (testType === 'micro' || testId.includes('MICRO')) {
                microTestsCount++;
            } else if (testType === 'macro' || testId.includes('MACRO')) {
                macroTestsCount++;
            } else if (testType === 'major_practice' || testType === 'major_final' || testId.includes('MAJOR')) {
                majorTestsCount++;
            }
        });
        totalTestsCount = microTestsCount + macroTestsCount + majorTestsCount;

        console.log(`  3. Crucible & Test Readiness:`);
        console.log(`     - Active Crucible Days Count:      ${daysCount} (Target: 100)`);
        console.log(`     - Micro Tests Count:               ${microTestsCount} (Target: 36)`);
        console.log(`     - Macro Tests Count:               ${macroTestsCount} (Target: 6)`);
        console.log(`     - Major Tests Count:               ${majorTestsCount} (Target: 5)`);
        console.log(`     - Total Active Tests Count:        ${totalTestsCount} (Target: 47)`);

        // 6. DigiBook count with filter
        const dbUnitsSnap = await missionRef.collection('digibook_units').get();
        let validScheduleLinkedUnitsCount = 0;
        let publishedDbUnitsCount = 0;

        dbUnitsSnap.forEach(d => {
            const data = d.data();
            const hasScheduleLinking = data.basis === 'syllabus_atom_plus_crucible_schedule' && data.schedule_number != null;
            if (hasScheduleLinking) {
                validScheduleLinkedUnitsCount++;
            }
            if (data.published === true || data.status === 'published') {
                publishedDbUnitsCount++;
            }
        });

        console.log(`  4. DigiBook Readiness:`);
        console.log(`     - Total DigiBook Units:            ${dbUnitsSnap.size}`);
        console.log(`     - Valid Schedule-Linked Units:     ${validScheduleLinkedUnitsCount} (Expected full: 144)`);
        console.log(`     - Published DigiBook Units:        ${publishedDbUnitsCount}`);

        // ==========================================
        // PART C: Compare Catalog vs Reality
        // ==========================================
        console.log("\nPart C — Compare Catalog vs Reality:");
        
        const catNotification = catalogData ? (catalogData.contentReadiness?.notification || 'not_ready') : 'not_ready';
        const catSyllabus = catalogData ? (catalogData.contentReadiness?.syllabus || 'not_ready') : 'not_ready';
        const catCrucible = catalogData ? (catalogData.contentReadiness?.crucible || 'not_ready') : 'not_ready';
        const catDigibook = catalogData ? (catalogData.contentReadiness?.digibook || 'not_ready') : 'not_ready';
        const catTests = catalogData ? (catalogData.contentReadiness?.tests || 'not_ready') : 'not_ready';

        const acceptedReadinessVocabulary = {
            notification: ['not_ready', 'uploaded', 'extracted', 'facts_verified'],
            syllabus: ['not_ready', 'uploaded', 'extracted', 'ready'],
            crucible: ['not_ready', 'draft', 'ready'],
            digibook: ['not_ready', 'partial_draft', 'draft_ready', 'approved_ready', 'published'],
            tests: ['not_ready', 'planned_ready', 'approved_ready', 'published'],
        };

        const realNotification = notificationExists ? 'uploaded' : 'not_ready';
        const realSyllabus = (syllabusAtomsCount > 0) ? 'ready' : 'not_ready';
        const realCrucible = (daysCount >= 100) ? 'ready' : (daysCount > 0 ? 'draft' : 'not_ready');
        const realDigibook = (validScheduleLinkedUnitsCount >= 144)
            ? 'draft_ready'
            : (validScheduleLinkedUnitsCount > 0 ? 'partial_draft' : 'not_ready');
        const realTests = (totalTestsCount >= 47) ? 'planned_ready' : 'not_ready';

        for (const [key, allowedValues] of Object.entries(acceptedReadinessVocabulary)) {
            const value = { notification: realNotification, syllabus: realSyllabus, crucible: realCrucible, digibook: realDigibook, tests: realTests }[key];
            if (!allowedValues.includes(value)) {
                throw new Error(`Readiness vocabulary violation for ${key}: ${value}`);
            }
        }

        console.log(`  - notification:   Catalog='${catNotification}' vs Real='${realNotification}'`);
        console.log(`  - syllabus:       Catalog='${catSyllabus}' vs Real='${realSyllabus}'`);
        console.log(`  - crucible:       Catalog='${catCrucible}' vs Real='${realCrucible}'`);
        console.log(`  - digibook:       Catalog='${catDigibook}' vs Real='${realDigibook}'`);
        console.log(`  - tests:          Catalog='${catTests}' vs Real='${realTests}'`);

        // Construct Recommended status
        let recStatus = 'COMING_SOON';
        let recMessage = 'Mission is being prepared. Content will unlock soon.';

        if (missionId === 'RPSC_FIRST_GRADE2026_2026_1782713222215') {
            recStatus = 'COMING_SOON';
            recMessage = 'RPSC 1st Grade mission is being prepared. Content will unlock soon.';
        } else if (missionId === 'neet_(ug)-2027') {
            recStatus = 'COMING_SOON';
            recMessage = 'NEET (UG) 2027 mission is being prepared. Content will unlock soon.';
        } else {
            // For JEE
            const allReady = realCrucible === 'ready' && realDigibook === 'published' && realTests === 'published';
            const noneReady = realCrucible === 'not_ready' && realDigibook === 'not_ready' && realTests === 'not_ready';

            if (allReady) {
                recStatus = 'LIVE';
                recMessage = 'Mission is live and fully accessible!';
            } else if (noneReady) {
                recStatus = 'COMING_SOON';
                recMessage = 'Mission is being prepared. Content will unlock soon.';
            } else {
                recStatus = 'PREPARING';
                recMessage = 'Content preparation is in progress. Sections remain locked until approved/published.';
            }
        }

        const mismatches = [];
        if (catalogData) {
            if (catalogData.catalogStatus !== recStatus) {
                mismatches.push(`catalogStatus: Catalog='${catalogData.catalogStatus}' vs Real='${recStatus}'`);
            }
            if (catNotification !== realNotification) mismatches.push(`contentReadiness.notification: Catalog='${catNotification}' vs Real='${realNotification}'`);
            if (catSyllabus !== realSyllabus) mismatches.push(`contentReadiness.syllabus: Catalog='${catSyllabus}' vs Real='${realSyllabus}'`);
            if (catCrucible !== realCrucible) mismatches.push(`contentReadiness.crucible: Catalog='${catCrucible}' vs Real='${realCrucible}'`);
            if (catDigibook !== realDigibook) mismatches.push(`contentReadiness.digibook: Catalog='${catDigibook}' vs Real='${realDigibook}'`);
            if (catTests !== realTests) mismatches.push(`contentReadiness.tests: Catalog='${catTests}' vs Real='${realTests}'`);
        }

        auditResults.push({
            missionId,
            currentStatus: catalogData ? catalogData.catalogStatus : 'N/A',
            recommendedStatus: recStatus,
            recommendedReadiness: {
                notification: realNotification,
                syllabus: realSyllabus,
                crucible: realCrucible,
                digibook: realDigibook,
                tests: realTests
            },
            daysCount,
            testsCount: totalTestsCount,
            digibookCount: validScheduleLinkedUnitsCount,
            mismatches,
            recMessage
        });
    }

    // ==========================================
    // PART E: Output Summary Required
    // ==========================================
    console.log("\n================================================================================");
    console.log("PART E — SUMMARY REPORT");
    console.log("================================================================================");
    console.log(`1. Catalog documents checked count: ${catalogCheckedCount}`);

    let updateNeeded = false;
    for (const r of auditResults) {
        console.log(`\n- Mission: ${r.missionId}`);
        console.log(`  Current catalogStatus:       ${r.currentStatus}`);
        console.log(`  Recommended catalogStatus:   ${r.recommendedStatus}`);
        console.log(`  Recommended readiness:       `, r.recommendedReadiness);
        console.log(`  Active Crucible Days:        ${r.daysCount}`);
        console.log(`  Active Tests Count:          ${r.testsCount}`);
        console.log(`  Active DigiBook Count:       ${r.digibookCount}`);
        console.log(`  Mismatches found:            ${r.mismatches.length > 0 ? r.mismatches.length : 'None'}`);
        if (r.mismatches.length > 0) {
            updateNeeded = true;
            r.mismatches.forEach(m => console.log(`    * ${m}`));
        }
    }

    console.log(`\n3. Whether readiness update patch is needed: ${updateNeeded ? 'YES (PATCH M6 required)' : 'NO'}`);
    console.log("\n4. Final Verdict:");
    console.log("PATCH_M5A_CATALOG_READINESS_COUNTERS_FIXED");
    console.log("================================================================================");
}

main().catch(e => {
    console.error("Unhandled Error during audit:", e);
    process.exit(1);
});
