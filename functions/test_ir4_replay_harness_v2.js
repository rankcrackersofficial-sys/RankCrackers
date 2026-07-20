const fs = require('fs');
const path = require('path');

async function testReplay(args) {
    console.log(`Replaying command with args: ${args.join(' ')}`);

    // 1. Argument Parsing
    const applyIndex = args.indexOf('--apply');
    const confirmation = applyIndex >= 0 ? args[applyIndex + 1] : '';
    const APPLY_CONFIRMATION = 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION';
    const isApplyMode = applyIndex >= 0 && confirmation === APPLY_CONFIRMATION;

    if (!isApplyMode) {
        console.log('REJECTED: Missing or invalid apply confirmation.');
        return 'FAIL_CLOSED';
    }

    // 2. Authorization Artifact Check (Remediation Gate)
    const authPath = path.join(__dirname, 'verification/write_authorization/verify5_p15_auth.json');
    if (!fs.existsSync(authPath)) {
        console.log('REJECTED: Missing phase authorization artifact (verify5_p15_auth.json).');
        return 'FAIL_CLOSED';
    }

    // 3. Status/Replay Check (Logic check)
    // In a real script, we would check if tasks are already completed.
    console.log('ACCEPTED (Unexpectedly)');
    return 'FAIL_OPEN';
}

async function runTests() {
    console.log('--- RC-X4E-IR4 REPLAY PARITY TESTS ---');
    const results = [];

    // Case 1: Exact incident command (Missing auth artifact)
    const incidentArgs = ['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION'];
    results.push({ case: 'incident_command', result: await testReplay(incidentArgs) });

    // Case 2: Incident command with limit
    results.push({ case: 'incident_with_limit', result: await testReplay(['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION', '--limit', '3']) });

    // Case 3: Wrong confirmation phrase
    results.push({ case: 'wrong_phrase', result: await testReplay(['--apply', 'WRONG_PHRASE']) });

    console.log('\n--- Replay Summary ---');
    results.forEach(r => console.log(`${r.case}: ${r.result}`));
}

runTests().catch(console.error);
