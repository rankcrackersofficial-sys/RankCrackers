const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXACT_PHRASE = "I, Founder of RankCrackers, authorize exactly one rollback for the RC-X4E-P15-AUTH-APPLY-3 simulated text incident. I authorize deleting only page_extractions pages 1 through 9 under mission neet_(ug)-2027, document hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925. I authorize resetting only the three affected ai_queue tasks rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3, rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6, and rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9 only. I authorize a maximum rollback mutation budget of 12 writes/deletes. I do not authorize any other page_extractions delete. I do not authorize any other queue update. I do not authorize syllabus_atoms writes or deletes. I do not authorize topic_nodes writes or deletes. I do not authorize student publish. I do not authorize Firebase deploy. I do not authorize AI/OCR. I do not authorize VESTA or city changes.";

async function main() {
    const phrasePath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_APPLY3_ROLLBACK_FOUNDER_APPROVAL_PHRASE.txt');
    if (!fs.existsSync(phrasePath)) {
        console.error('RC_X4E_P15_APPLY3_ROLLBACK_TOKEN_GENERATION_BLOCKED: Missing Phrase');
        process.exit(1);
    }
    const content = fs.readFileSync(phrasePath, 'utf8').trim();
    if (content !== EXACT_PHRASE) {
        console.error('RC_X4E_P15_APPLY3_ROLLBACK_TOKEN_GENERATION_BLOCKED: Invalid Phrase');
        process.exit(1);
    }

    const phraseHash = crypto.createHash('sha256').update(content).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const token = {
        patch: 'RC-X4E-P15-APPLY3-ROLLBACK-EXECUTE-1',
        rollback_id: 'rollback_p15_apply3_simulated_text_20260721_v1',
        project_id: 'rankcrackers-55',
        branch: 'safety/rc-g2-pre-notification-schema',
        ceremony_commit: '7b109afaa3005f467e08e3399ee4594975e95c60',
        ir1_commit: '16e3439b5f8ff4096f7c4fc93d0ccf096403465d',
        affected_apply_commit: '46a38d347d94b6d5c37fb51fb847bf6e8b02f516',
        mission_id: 'neet_(ug)-2027',
        document_id: 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
        page_deletes: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        task_resets: [
            "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3",
            "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6",
            "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9"
        ],
        mutation_budget: {
            max_page_deletes: 9,
            max_task_updates: 3,
            max_total_writes_deletes: 12
        },
        constraints: {
            no_other_page_deletes: true,
            no_other_queue_updates: true,
            no_parent_document_updates: true,
            no_syllabus_atoms: true,
            no_topic_nodes: true,
            no_student_publish: true,
            no_deploy: true,
            no_ai_ocr: true
        },
        expires_at: expiresAt,
        one_time_use: true,
        rollback_approval_phrase_hash: phraseHash
    };

    token.bundle_sha256 = crypto.createHash('sha256').update(JSON.stringify(token)).digest('hex');

    fs.writeFileSync(path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_APPLY3_ROLLBACK_TOKEN.json'), JSON.stringify(token, null, 4));
    console.log('RC_X4E_P15_APPLY3_ROLLBACK_TOKEN_GENERATED');
}

main().catch(console.error);
