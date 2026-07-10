const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

async function main() {
    console.log("=========================================");
    console.log("APPLY STUDENT CATALOG READINESS STATUS (PATCH M6)");
    console.log("=========================================");

    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const applyConfirm = args.includes('--apply') && args.includes('CONFIRM_APPLY_STUDENT_CATALOG_READINESS');

    if (!dryRun && !applyConfirm) {
        console.error("Error: Must specify either --dry-run or --apply CONFIRM_APPLY_STUDENT_CATALOG_READINESS");
        process.exit(1);
    }

    let token;
    try {
        token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    } catch (e) {
        console.error("Authentication Error: Could not get gcloud access token.", e.message);
        process.exit(1);
    }

    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: token });

    const db = new Firestore({
        projectId: 'rankcrackers-55',
        authClient: auth
    });

    const updates = {
        'jee_main_2026': {
            catalogStatus: "PREPARING",
            contentReadiness: {
                notification: "not_ready",
                syllabus: "ready",
                crucible: "ready",
                digibook: "partial_draft",
                tests: "planned_ready"
            },
            studentMessage: "JEE Main mission preparation is in progress. Crucible plan and tests are prepared; DigiBook content is still being completed."
        },
        'neet_(ug)-2027': {
            catalogStatus: "COMING_SOON",
            contentReadiness: {
                notification: "not_ready",
                syllabus: "not_ready",
                crucible: "not_ready",
                digibook: "not_ready",
                tests: "not_ready"
            },
            studentMessage: "NEET mission is being prepared. Content will unlock soon."
        },
        'RPSC_FIRST_GRADE2026_2026_1782713222215': {
            catalogStatus: "COMING_SOON",
            contentReadiness: {
                notification: "uploaded",
                syllabus: "not_ready",
                crucible: "not_ready",
                digibook: "not_ready",
                tests: "not_ready"
            },
            studentMessage: "RPSC 1st Grade mission is being prepared. Notification is linked; syllabus and learning plan will unlock after verification."
        }
    };

    let count = 0;

    for (const [id, payload] of Object.entries(updates)) {
        const docRef = db.collection('student_mission_catalog').doc(id);
        const docSnap = await docRef.get();
        
        let currentStatus = "N/A";
        let currentReadiness = {};
        if (docSnap.exists) {
            const data = docSnap.data();
            currentStatus = data.catalogStatus || data.status || "N/A";
            currentReadiness = data.contentReadiness || {};
        }

        console.log(`\n- Mission: ${id}`);
        console.log(`  Current catalogStatus:  ${currentStatus}`);
        console.log(`  Proposed catalogStatus: ${payload.catalogStatus}`);
        console.log(`  Current readiness:      `, currentReadiness);
        console.log(`  Proposed readiness:     `, payload.contentReadiness);
        console.log(`  Proposed message:       "${payload.studentMessage}"`);

        if (dryRun) {
            console.log(`  [DRY RUN] No Firestore write.`);
        } else if (applyConfirm) {
            console.log(`  [APPLY] Updating student_mission_catalog/${id}...`);
            await docRef.set({
                catalogStatus: payload.catalogStatus,
                status: payload.catalogStatus, // for compatibility
                contentReadiness: payload.contentReadiness,
                studentMessage: payload.studentMessage,
                updatedAt: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { merge: true });
            count++;
        }
    }

    console.log("\n-----------------------------------------");
    console.log(`Summary: Dry Run=${dryRun}, Apply Confirm=${applyConfirm}, Docs Updated Count=${count}`);
}

main().catch(console.error);
