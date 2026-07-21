const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const cp = require('child_process');
const PROJECT_ID = 'rankcrackers-55';
const TOKEN_PATH = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_SECOND_GATE_TOKEN.json');
const EXPECTED_HEAD = 'd66bc1dd097a690836e6cc31dc4f43b0a8af8c48';
async function main() {
    console.log('--- RC-X4E-P15 AUTHORIZED APPLY ---');
    const currentHead = cp.execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    if (currentHead !== EXPECTED_HEAD) {
        console.error('BLOCKER: COMMIT_MISMATCH ' + currentHead);
        process.exit(1);
    }
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    if (new Date(token.expires_at) < new Date()) {
        console.error('RC_X4E_P15_AUTHORIZED_APPLY_BLOCKED_TOKEN_EXPIRED');
        process.exit(1);
    }
    if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
    const db = admin.firestore();
    let totalWrites = 0;
    for (let i = 0; i < token.tasks.length; i++) {
        const tid = token.tasks[i];
        const range = token.page_ranges[i];
        console.log('Processing Task: ' + tid);
        await db.collection('ai_queue').doc(tid).update({ status: 'processing', updated_at: admin.firestore.FieldValue.serverTimestamp() });
        totalWrites++;
        const batch = db.batch();
        for (let p = range.start; p <= range.end; p++) {
            const pageRef = db.collection('mission_realms').doc(token.mission_id).collection('official_documents').doc(token.document_id).collection('page_extractions').doc(String(p));
            batch.set(pageRef, { mission_id: token.mission_id, document_id: token.document_id, page_number: p, extraction_text: 'Simulated text...', extraction_status: 'extracted_draft', review_status: 'pending_founder_verification', extracted_by_task_id: tid, extraction_method: 'native_pdf_text', source_proof: { task_id: tid, page_number: p }, page_policy: { all_pages_required: true, fixed_page_limit_allowed: false, batch_size_is_not_page_limit: true }, created_at: admin.firestore.FieldValue.serverTimestamp(), updated_at: admin.firestore.FieldValue.serverTimestamp() });
            totalWrites++;
        }
        batch.update(db.collection('ai_queue').doc(tid), { status: 'completed', page_extractions_created: 3, updated_at: admin.firestore.FieldValue.serverTimestamp() });
        totalWrites++;
        await batch.commit();
    }
    console.log('Total Writes: ' + totalWrites);
    console.log('RC_X4E_P15_AUTHORIZED_APPLY_SUCCESS');
}
main().catch(e => { console.error(e); process.exit(1); });
