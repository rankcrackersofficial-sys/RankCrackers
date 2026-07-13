const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-P5 - CANDIDATE SELECTOR POLICY AUDIT');
  console.log('==============================================');

  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  const content = fs.readFileSync(workerPath, 'utf8');

  const checkers = [
    '--prefer-native-digital',
    '--allow-auto-detect',
    'SKIPPED_AUTO_DETECT_NOT_ALLOWED',
    'SKIPPED_NATIVE_TEXT_PROBE_EMPTY',
    'SKIPPED_RECENT_EMPTY_NATIVE_TEXT_FAILURE_DOCUMENT',
    'extractPagesNatively(bytes, task.page_start, task.page_start)',
    'recentFailuresDocIds.has(task.document_id)'
  ];

  console.log('Static Policy Check:');
  let staticValid = true;
  for (const check of checkers) {
    const exists = content.includes(check);
    console.log(`- ${check}: ${exists ? 'PRESENT' : 'MISSING'}`);
    if (!exists) staticValid = false;
  }

  if (!staticValid) {
    console.error('RC_X4E_P5_STATIC_POLICY_INVALID');
    process.exit(1);
  }

  console.log('\nLive Selector Simulation (Dry-Run):');
  try {
    const output = cp.execSync('node functions/process_pagewise_extraction_batches.js --dry-run --limit 3 --prefer-native-digital', { encoding: 'utf8' });
    console.log('--- Simulation Output Start ---');
    console.log(output);
    console.log('--- Simulation Output End ---');

    if (output.includes('mission_id: AUTO_DETECT') && !output.includes('Allow AUTO_DETECT: YES')) {
        console.error('BLOCKER: AUTO_DETECT selected in prefer-native-digital mode without allow flag');
        process.exit(1);
    }

    if (!output.includes('Prefer Native Digital: YES')) {
        console.error('BLOCKER: Dry-run did not acknowledge prefer-native-digital mode');
        process.exit(1);
    }

    if (output.includes('SKIPPED_AUTO_DETECT_NOT_ALLOWED') || output.includes('SKIPPED_RECENT_EMPTY_NATIVE_TEXT_FAILURE_DOCUMENT')) {
        console.log('Selector successfully skipped unsafe/scanned candidates.');
    } else {
        console.log('Note: No unsafe candidates were encountered or logged during this simulation.');
    }

  } catch (e) {
    console.error('Simulation Failed:', e.message);
    process.exit(1);
  }

  console.log('\nRC_X4E_P5_CANDIDATE_SELECTOR_POLICY_READY');
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
