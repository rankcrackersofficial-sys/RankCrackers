const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXACT_PHRASE = "I, Founder of RankCrackers, authorize exactly one rollback for the RC-X4E-P15-AUTH-APPLY-3 simulated text incident. I authorize deleting only page_extractions pages 1 through 9 under mission neet_(ug)-2027, document hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925. I authorize resetting only the three affected ai_queue tasks rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3, rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6, and rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9 only. I authorize a maximum rollback mutation budget of 12 writes/deletes. I do not authorize any other page_extractions delete. I do not authorize any other queue update. I do not authorize syllabus_atoms writes or deletes. I do not authorize topic_nodes writes or deletes. I do not authorize student publish. I do not authorize Firebase deploy. I do not authorize AI/OCR. I do not authorize VESTA or city changes.";

async function main() {
    const phrasePath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_APPLY3_ROLLBACK_FOUNDER_APPROVAL_PHRASE.txt');

    if (!fs.existsSync(phrasePath)) {
        console.log('RC_X4E_P15_APPLY3_ROLLBACK_APPROVAL_PHRASE_MISSING');
        process.exit(0);
    }

    const content = fs.readFileSync(phrasePath, 'utf8').trim();
    if (content !== EXACT_PHRASE) {
        console.error('RC_X4E_P15_APPLY3_ROLLBACK_APPROVAL_PHRASE_INVALID');
        process.exit(1);
    }

    const hash = crypto.createHash('sha256').update(content).digest('hex');
    console.log('RC_X4E_P15_APPLY3_ROLLBACK_APPROVAL_PHRASE_VALID');
    console.log(`rollback_approval_phrase_hash: ${hash}`);
}

main().catch(console.error);
