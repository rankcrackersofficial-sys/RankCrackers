const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    console.log('--- RC-X4E-P15 APPLY3 Authorized Rollback Executor ---');

    if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.error('RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_EMULATOR_HOST_PRESENT');
        process.exit(1);
    }

    const branch = execSync('git branch --show-current').toString().trim();
    if (branch !== 'safety/rc-g2-pre-notification-schema') {
        console.error(`RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_BRANCH_MISMATCH: ${branch}`);
        process.exit(1);
    }

    const head = execSync('git rev-parse HEAD').toString().trim();
    const expectedHead = 'f8fd1dfc235bfe162a78883ef04f96201384d2e7';
    if (head !== expectedHead) {
        console.error(`RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_HEAD_MISMATCH: ${head}`);
        process.exit(1);
    }

    const tokenPath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_APPLY3_ROLLBACK_TOKEN.json');
    if (!fs.existsSync(tokenPath)) {
        console.error('RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_TOKEN_MISSING');
        process.exit(1);
    }
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const patchValid = ['RC-X4E-P15-APPLY3-ROLLBACK-EXECUTE-1', 'RC-X4E-P15-APPLY3-ROLLBACK-EXECUTE-2'].includes(token.patch);
    const validations = [
        patchValid,
        token.rollback_id === 'rollback_p15_apply3_simulated_text_20260721_v1',
        token.project_id === 'rankcrackers-55',
        token.branch === 'safety/rc-g2-pre-notification-schema',
        token.mission_id === 'neet_(ug)-2027',
        token.document_id === 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
        JSON.stringify(token.page_deletes) === JSON.stringify([1,2,3,4,5,6,7,8,9]),
        token.task_resets.length === 3,
        token.mutation_budget.max_page_deletes === 9,
        token.mutation_budget.max_task_updates === 3,
        token.mutation_budget.max_total_writes_deletes === 12,
        token.constraints.no_other_page_deletes === true,
        token.constraints.no_other_queue_updates === true,
        token.constraints.no_parent_document_updates === true,
        token.constraints.no_syllabus_atoms === true,
        token.constraints.no_topic_nodes === true,
        token.constraints.no_student_publish === true,
        token.constraints.no_deploy === true,
        token.constraints.no_ai_ocr === true,
        token.one_time_use === true,
        token.rollback_approval_phrase_hash === '78ab93aea6850f8b34ff8380057a53593ffe994f87057b190195afe253c14228',
        new Date(token.expires_at) > new Date()
    ];

    if (validations.includes(false)) {
        console.error('RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_TOKEN_INVALID_OR_EXPIRED');
        process.exit(1);
    }

    if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
    const db = admin.firestore();

    for (const p of token.page_deletes) {
        const pageRef = db.collection('mission_realms').doc(token.mission_id)
            .collection('official_documents').doc(token.document_id)
            .collection('page_extractions').doc(String(p));
        const snap = await pageRef.get();
        if (!snap.exists) {
            console.error(`RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_PAGE_MISSING: ${p}`);
            process.exit(1);
        }
        const text = snap.data().extraction_text || '';
        if (!text.startsWith('Simulated text') || text.length > 30) {
            console.error(`RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_PAGE_NOT_SIMULATED: ${p}`);
            process.exit(1);
        }
    }

    for (const tid of token.task_resets) {
        const snap = await db.collection('ai_queue').doc(tid).get();
        if (!snap.exists) {
            console.error(`RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_TASK_MISSING: ${tid}`);
            process.exit(1);
        }
        const data = snap.data();
        if (data.status !== 'completed' || data.page_extractions_created !== 3) {
            console.error(`RC_X4E_P15_APPLY3_ROLLBACK_BLOCKED_TASK_STATE_MISMATCH: ${tid}`);
            process.exit(1);
        }
    }

    const batch = db.batch();
    for (const p of token.page_deletes) {
        const pageRef = db.collection('mission_realms').doc(token.mission_id)
            .collection('official_documents').doc(token.document_id)
            .collection('page_extractions').doc(String(p));
        batch.delete(pageRef);
    }
    for (const tid of token.task_resets) {
        const taskRef = db.collection('ai_queue').doc(tid);
        batch.update(taskRef, {
            status: 'queued',
            page_extractions_created: 0,
            rollback_marker: 'RC_X4E_P15_APPLY3_SIMULATED_TEXT_ROLLBACK',
            rollback_source: 'RC-X4E-P15-APPLY3-ROLLBACK-EXECUTE-3',
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            completed_at: admin.firestore.FieldValue.delete()
        });
    }

    await batch.commit();
    console.log('RC_X4E_P15_APPLY3_ROLLBACK_EXECUTE_SUCCESS');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
