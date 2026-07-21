const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
const { KNOWN_PILOT_IDS } = require('./canonical_mission_registry');

async function main() {
    console.log("RUNNING STUDENT MISSION CATALOG BACKFILL SCRIPT (PATCH M5A)");

    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const applyConfirm = args.includes('--apply') && args.includes('CONFIRM_BACKFILL_STUDENT_MISSION_CATALOG');

    if (!dryRun && !applyConfirm) {
        console.error("Error: Must specify either --dry-run or --apply CONFIRM_BACKFILL_STUDENT_MISSION_CATALOG");
        process.exit(1);
    }

    let token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: token });

    const db = new Firestore({
        projectId: 'rankcrackers-55',
        authClient: auth
    });

    const missionIds = Array.from(KNOWN_PILOT_IDS);

    const now = new Date().toISOString();

    for (const id of missionIds) {
        const docRef = db.collection('mission_realms').doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            console.warn(`Warning: Mission ${id} not found in mission_realms`);
            continue;
        }

        const data = docSnap.data();
        
        // Fetch variables subcollection
        const varsSnap = await docRef.collection('variables').get();
        const variables = [];
        varsSnap.forEach(d => {
            const v = d.data();
            if (v.status !== 'archived') {
                variables.push({
                    id: d.id,
                    name: v.displayName || v.name || '',
                    code: v.subjectCode || v.code || '',
                    status: v.status || 'active',
                    paperType: v.paperType || 'Paper 2'
                });
            }
        });

        // 1. Notification document link check
        const offDocsSnap = await docRef.collection('official_documents').get();
        let offDocs = [];
        offDocsSnap.forEach(d => offDocs.push({ id: d.id, ...d.data() }));

        let hasNotificationDoc = false;
        for (const doc of offDocs) {
            const role = (doc.document_role || doc.documentRole || '').toLowerCase();
            const type = (doc.document_type || doc.documentType || '').toLowerCase();
            const category = (doc.category || '').toLowerCase();
            const name = (doc.file_name || doc.fileName || '').toLowerCase();

            if (role === 'notification' || type === 'notification' || category === 'notification' || name.includes('notification')) {
                hasNotificationDoc = true;
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
                        if (missionLink === id && (docRole === 'notification' || d.id.includes('notification'))) {
                            externalNotificationDoc = { id: d.id, ...data };
                        }
                    });
                } catch (_) {}
                if (externalNotificationDoc) break;
            }
        }

        const notificationExists = hasNotificationDoc || !!externalNotificationDoc;

        // 2. Crucible Days count with filters
        const daysSnap = await docRef.collection('crucible_days').get();
        let daysCount = 0;
        daysSnap.forEach(d => {
            const data = d.data();
            const cid = data.crucible_id || '';
            const isArchived = data.archived === true || data.is_legacy_duplicate === true || data.status === 'archived_legacy_duplicate' || cid.startsWith('legacy_');
            if (!isArchived) {
                if (id === 'jee_main_2026') {
                    if (cid === 'plan_jee_2026') {
                        daysCount++;
                    }
                } else {
                    daysCount++;
                }
            }
        });

        // 3. Test count with filter
        const crucibleTestsSnap = await docRef.collection('crucible_tests').get();
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

        // 4. DigiBook count with filter
        const dbUnitsSnap = await docRef.collection('digibook_units').get();
        let validScheduleLinkedUnitsCount = 0;
        dbUnitsSnap.forEach(d => {
            const data = d.data();
            const hasScheduleLinking = data.basis === 'syllabus_atom_plus_crucible_schedule' && data.schedule_number != null;
            if (hasScheduleLinking) {
                validScheduleLinkedUnitsCount++;
            }
        });

        // Apply readiness rules
        let catalogStatus = 'COMING_SOON';
        let studentMessage = '';
        let readiness = {
            notification: notificationExists ? 'uploaded' : 'not_ready',
            syllabus: 'not_ready',
            crucible: 'not_ready',
            digibook: 'not_ready',
            tests: 'not_ready'
        };

        const isRPSC = id === 'RPSC_FIRST_GRADE2026_2026_1782713222215';
        const isNEET = id === 'neet_(ug)-2027';

        if (isRPSC) {
            catalogStatus = 'COMING_SOON';
            studentMessage = 'RPSC 1st Grade mission is being prepared. Content will unlock soon.';
        } else if (isNEET) {
            catalogStatus = 'COMING_SOON';
            studentMessage = 'NEET (UG) 2027 mission is being prepared. Content will unlock soon.';
        } else {
            // For JEE
            readiness.crucible = (daysCount >= 100) ? 'ready' : 'not_ready';
            readiness.syllabus = (daysCount > 0) ? 'ready' : 'not_ready';
            readiness.digibook = (validScheduleLinkedUnitsCount >= 144) ? 'ready' : 'not_ready';
            readiness.tests = (totalTestsCount >= 47) ? 'ready' : 'not_ready';

            const allReady = readiness.crucible === 'ready' && readiness.digibook === 'ready' && readiness.tests === 'ready';
            const noneReady = readiness.crucible === 'not_ready' && readiness.digibook === 'not_ready' && readiness.tests === 'not_ready';

            if (allReady) {
                catalogStatus = 'LIVE';
                studentMessage = 'Mission is live and fully accessible!';
            } else if (noneReady) {
                catalogStatus = 'COMING_SOON';
                studentMessage = 'Mission is being prepared. Content will unlock soon.';
            } else {
                catalogStatus = 'PREPARING';
                studentMessage = 'Content preparation is in progress. Some sections are unlocked.';
            }
        }

        const catalogPayload = buildCatalogPayload(id, data, variables, readiness, catalogStatus, studentMessage, now);

        if (dryRun) {
            console.log(`[DRY RUN] Would write student_mission_catalog/${id}:`);
            console.log(JSON.stringify(catalogPayload, null, 2));
        } else if (applyConfirm) {
            console.log(`[APPLY] Writing student_mission_catalog/${id}...`);
            await db.collection('student_mission_catalog').doc(id).set(catalogPayload, { merge: true });
        }
    }

    console.log("Backfill operation complete.");
}

function buildCatalogPayload(id, data, variables, readiness, catalogStatus, studentMessage, now) {
    return {
        mission_id: id,
        id: id,
        title: data.name || data.title || '',
        name: data.name || data.title || '',
        subtitle: data.titleHindi || '',
        titleHindi: data.titleHindi || '',
        state: data.state || 'Rajasthan',
        examCategory: data.examCategory || data.exam_category || 'competitive',
        exam_category: data.examCategory || data.exam_category || 'competitive',
        target_year: data.year || data.exam_year || 2026,
        year: data.year || data.exam_year || 2026,
        exam_year: data.year || data.exam_year || 2026,
        exam_id: data.code || id,
        code: data.code || id,
        recruitment_id: id,
        recruitmentGroupId: id,
        boardId: data.organizationCode || 'RPSC',
        organizationCode: data.organizationCode || 'RPSC',
        cardVisible: true,
        userPanelVisible: true,
        status: catalogStatus, // for compatibility
        catalogStatus: catalogStatus,
        contentReadiness: readiness,
        studentMessage: studentMessage,
        sortOrder: data.priority || 0,
        priority: data.priority || 0,
        variables: variables,
        created_at: data.createdAt || data.created_at || now,
        createdAt: data.createdAt || data.created_at || now,
        updated_at: now,
        updatedAt: now
    };
}

module.exports = {
    buildCatalogPayload
};

if (require.main === module) {
    main().catch(console.error);
}
