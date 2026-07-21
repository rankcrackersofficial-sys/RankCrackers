const fs = require('fs');
const path = require('path');
async function main() {
    const tokenPath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_SECOND_GATE_TOKEN.json');
    if (!fs.existsSync(tokenPath)) {
        console.log('RC_X4E_P15_SECOND_GATE_TOKEN_NOT_YET_CREATED');
        process.exit(0);
    }
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    const expected = {
        patch: "RC-X4E-P15-AUTHORIZED-APPLY-1",
        authorization_id: "auth_p15_20260720_v5_final_neet",
        project_id: "rankcrackers-55",
        branch: "safety/rc-g2-pre-notification-schema",
        code_commit: "f82d4269e7fdafa7c80e148730056b4d91c5678b",
        authorization_commit: "d64a675b04a2cd650b4786a2a58877368d4e71a0",
        mission_id: "neet_(ug)-2027",
        document_id: "hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925",
        expected_page_extractions: 9,
        one_time_use: true
    };
    let valid = true;
    for (const [key, value] of Object.entries(expected)) {
        if (token[key] !== value) {
            console.error(`Invalid field: ${key}`);
            valid = false;
        }
    }
    if (new Date(token.expires_at) < new Date()) {
        console.error('Token EXPIRED!');
        valid = false;
    }
    if (!valid) {
        console.error('RC_X4E_P15_SECOND_GATE_TOKEN_INVALID');
        process.exit(1);
    }
    console.log('RC_X4E_P15_SECOND_GATE_TOKEN_PREFLIGHT_READY');
}
main().catch(console.error);
