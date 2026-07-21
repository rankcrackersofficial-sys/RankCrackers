const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EXACT_PHRASE = "I, Founder of RankCrackers, authorize exactly one controlled pagewise native extraction apply for mission neet_(ug)-2027, document hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925, tasks rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3, rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6, and rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9 only. I authorize a maximum mutation budget of 15 writes. I do not authorize AUTO_DETECT. I do not authorize syllabus_atoms writes. I do not authorize topic_nodes writes. I do not authorize student publish. I do not authorize Crucible or DigiBook generation. I do not authorize Firebase deploy. I do not authorize AI/OCR. I do not authorize VESTA or city changes.";
async function main() {
    const phrasePath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_FOUNDER_APPROVAL_PHRASE.txt');
    if (!fs.existsSync(phrasePath)) {
        console.error('RC_X4E_P15_SECOND_GATE_TOKEN_GENERATION_BLOCKED: Missing Founder Approval Phrase');
        process.exit(1);
    }
    const content = fs.readFileSync(phrasePath, 'utf8').trim();
    if (content !== EXACT_PHRASE) {
        console.error('RC_X4E_P15_SECOND_GATE_TOKEN_GENERATION_BLOCKED: Invalid Founder Approval Phrase');
        process.exit(1);
    }
    const phraseHash = crypto.createHash('sha256').update(content).digest('hex');
    const token = {
        "patch": "RC-X4E-P15-AUTHORIZED-APPLY-1",
        "authorization_id": "auth_p15_20260720_v5_final_neet",
        "project_id": "rankcrackers-55",
        "branch": "safety/rc-g2-pre-notification-schema",
        "code_commit": "f82d4269e7fdafa7c80e148730056b4d91c5678b",
        "authorization_commit": "d64a675b04a2cd650b4786a2a58877368d4e71a0",
        "mission_id": "neet_(ug)-2027",
        "document_id": "hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925",
        "tasks": [
            "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3",
            "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6",
            "rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9"
        ],
        "page_ranges": [
            { "start": 1, "end": 3 },
            { "start": 4, "end": 6 },
            { "start": 7, "end": 9 }
        ],
        "expected_page_extractions": 9,
        "mutation_budget": {
            "max_total_writes": 15,
            "max_tasks": 3,
            "max_page_creates": 9,
            "queue_task_updates_allowed": true,
            "retry_allowed": false,
            "replacement_task_allowed": false
        },
        "constraints": {
            "prefer_native_digital": true,
            "allow_auto_detect": false,
            "ai_ocr_allowed": false,
            "syllabus_atoms_allowed": false,
            "topic_nodes_allowed": false,
            "student_publish_allowed": false,
            "deploy_allowed": false
        },
        "expires_at": new Date(Date.now() + 30 * 60000).toISOString(),
        "one_time_use": true,
        "founder_approval_phrase_hash": phraseHash,
        "queue_digest": "6586a746c2f6486207e297f121294982a7e693df9d0d8ca73183ad2baf19fa17",
        "page_digest": "1926a7ba2ba94bcf53149ee0d2eaba0ca6910261202837bb9d7f91833a927ea5",
        "dry_run_digest": "39fcaac534ecb0724c551c3ffa3a2559b576f4929e01d66c7df2bb489eeb78a7"
    };
    const bundleJson = JSON.stringify(token, null, 2);
    token.bundle_sha256 = crypto.createHash('sha256').update(bundleJson).digest('hex');
    const tokenPath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_SECOND_GATE_TOKEN.json');
    fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
    console.log('RC_X4E_P15_SECOND_GATE_TOKEN_GENERATED');
}
main().catch(console.error);
