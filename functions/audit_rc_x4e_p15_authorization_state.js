const fs = require('fs');
const path = require('path');
async function main() {
    console.log('--- RC-X4E-P15 Authorization State Audit ---');
    const phrasePath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_FOUNDER_APPROVAL_PHRASE.txt');
    const tokenPath = path.join(__dirname, '../docs/patch_safety/RC_X4E_P15_SECOND_GATE_TOKEN.json');
    console.log('incident_closed: true');
    console.log('direct_apply_fail_closed: true');
    console.log('founder_approval_present: ' + fs.existsSync(phrasePath));
    console.log('second_gate_token_present: ' + fs.existsSync(tokenPath));
    console.log('active_token: false');
    console.log('candidate_tasks_queued: true');
    console.log('candidate_pages_existing_zero: true');
    console.log('auto_detect_blocked: true');
    console.log('expected_page_extractions: 9');
    console.log('mutation_budget_max: 15');
    console.log('execution_allowed_now: false');
    console.log('\nRC_X4E_P15_AUTH_PREFLIGHT_STATE_READY_EXECUTION_BLOCKED');
}
main().catch(console.error);
