const fs = require('fs');
const path = require('path');

function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-P5-FIX2 - PAGEWISE APPLY CAPABILITY AUDIT');
  console.log('==============================================');

  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  const runtimeAuditPath = path.join(__dirname, 'audit_pagewise_worker_runtime_safety.js');

  const blockers = [];

  if (!fs.existsSync(workerPath)) {
    blockers.push('process_pagewise_extraction_batches.js missing');
  } else {
    const content = fs.readFileSync(workerPath, 'utf8');
    // 1. SDK Unification
    if (content.includes("require('@google-cloud/firestore')") || content.includes('new Firestore')) {
      blockers.push('Worker uses direct Firestore SDK instead of firebase-admin');
    }
    if (!content.includes('admin.firestore()')) {
      blockers.push('Worker does not use admin.firestore()');
    }
    // 2. Apply locked
    if (!content.includes('CONFIRM_PROCESS_PAGEWISE_EXTRACTION')) blockers.push('Apply mode not locked with confirmation phrase');
    if (!content.includes('cli.limit !== 3')) blockers.push('Apply mode must be locked to limit 3');
    // 3. Hardened Selector
    if (!content.includes('--prefer-native-digital')) blockers.push('Hardened selector flag --prefer-native-digital missing');
    if (!content.includes('--allow-auto-detect')) blockers.push('Auto-detect control flag --allow-auto-detect missing');
  }

  if (!fs.existsSync(runtimeAuditPath)) {
    blockers.push('audit_pagewise_worker_runtime_safety.js missing');
  } else {
    const content = fs.readFileSync(runtimeAuditPath, 'utf8');
    const mixedSigs = ['@google-cloud/firestore', 'google-auth-library', 'new Firestore(', 'authClient', 'OAuth2Client'];
    for (const sig of mixedSigs) {
      if (content.includes(sig)) {
        blockers.push(`Runtime audit file contains prohibited mixed SDK signature: ${sig}`);
      }
    }
    if (!content.includes('admin.firestore()')) {
        blockers.push('Runtime audit does not use admin.firestore()');
    }
  }

  if (blockers.length === 0) {
    console.log('\nRC_X4E_P5_FIX2_PAGEWISE_APPLY_CAPABILITY_READY');
  } else {
    console.error('\nRC_X4E_P5_FIX2_PAGEWISE_APPLY_CAPABILITY_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit();
