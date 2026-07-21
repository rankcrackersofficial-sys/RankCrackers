const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
    const tokenPath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_APPLY3_ROLLBACK_TOKEN.json');
    if (!fs.existsSync(tokenPath)) {
        console.error('RC_X4E_P15_APPLY3_ROLLBACK_TOKEN_MISSING');
        process.exit(1);
    }
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const expected = {
        patch: 'RC-X4E-P15-APPLY3-ROLLBACK-EXECUTE-1',
        rollback_id: 'rollback_p15_apply3_simulated_text_20260721_v1',
        project_id: 'rankcrackers-55',
        branch: 'safety/rc-g2-pre-notification-schema',
        ceremony_commit: '7b109afaa3005f467e08e3399ee4594975e95c60',
        ir1_commit: '16e3439b5f8ff4096f7c4fc93d0ccf096403465d',
        affected_apply_commit: '46a38d347d94b6d5c37fb51fb847bf6e8b02f516',
        mission_id: 'neet_(ug)-2027',
        document_id: 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
        one_time_use: true
    };

    let valid = true;
    for (const [key, val] of Object.entries(expected)) {
        if (token[key] !== val) {
            console.error(`Field mismatch: ${key}. Expected: ${val}, Actual: ${token[key]}`);
            valid = false;
        }
    }

    if (token.page_deletes.length !== 9) {
        console.error('Page deletes count mismatch.');
        valid = false;
    }
    if (token.task_resets.length !== 3) {
        console.error('Task resets count mismatch.');
        valid = false;
    }

    if (new Date(token.expires_at) < new Date()) {
        console.error('Token expired.');
        valid = false;
    }

    const phrasePath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_APPLY3_ROLLBACK_FOUNDER_APPROVAL_PHRASE.txt');
    const content = fs.readFileSync(phrasePath, 'utf8').trim();
    const currentHash = crypto.createHash('sha256').update(content).digest('hex');
    if (token.rollback_approval_phrase_hash !== currentHash) {
        console.error('Approval phrase hash mismatch.');
        valid = false;
    }

    if (valid) {
        console.log('RC_X4E_P15_APPLY3_ROLLBACK_TOKEN_PREFLIGHT_READY');
    } else {
        console.error('RC_X4E_P15_APPLY3_ROLLBACK_TOKEN_INVALID');
        process.exit(1);
    }
}

main().catch(console.error);
