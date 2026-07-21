const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EXACT_PHRASE = "I, Founder of RankCrackers, authorize exactly one controlled pagewise native extraction apply for mission neet_(ug)-2027, document hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925, tasks rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3, rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6, and rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9 only. I authorize a maximum mutation budget of 15 writes. I do not authorize AUTO_DETECT. I do not authorize syllabus_atoms writes. I do not authorize topic_nodes writes. I do not authorize student publish. I do not authorize Crucible or DigiBook generation. I do not authorize Firebase deploy. I do not authorize AI/OCR. I do not authorize VESTA or city changes.";
async function main() {
    const phrasePath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_FOUNDER_APPROVAL_PHRASE.txt');
    if (!fs.existsSync(phrasePath)) {
        console.error('RC_X4E_P15_FOUNDER_APPROVAL_PHRASE_MISSING');
        process.exit(1);
    }
    const content = fs.readFileSync(phrasePath, 'utf8').trim();
    if (content !== EXACT_PHRASE) {
        console.error('RC_X4E_P15_FOUNDER_APPROVAL_PHRASE_INVALID');
        process.exit(1);
    }
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    console.log('RC_X4E_P15_FOUNDER_APPROVAL_PHRASE_VALID');
    console.log(`founder_approval_phrase_hash: ${hash}`);
}
main().catch(console.error);
