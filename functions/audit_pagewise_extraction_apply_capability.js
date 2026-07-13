const fs = require('fs');
const path = require('path');

function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-P5-FIX1 - PAGEWISE APPLY CAPABILITY AUDIT');
  console.log('==============================================');

  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  if (!fs.existsSync(workerPath)) {
    console.error('BLOCKER: process_pagewise_extraction_batches.js missing');
    process.exit(1);
  }

  const content = fs.readFileSync(workerPath, 'utf8');
  const blockers = [];

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

  // 4. pdf-parse v2 mapping
  if (!content.includes('const pageNum = Number(pData.num)')) {
    blockers.push('Worker does not use correct pdf-parse v2 page mapping (pData.num)');
  }

  // 5. Text safety
  if (!content.includes('NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED')) {
    blockers.push('Empty text safety check missing');
  }

  // 6. Duplicate check
  if (!content.includes('PAGE_EXTRACTION_ALREADY_EXISTS')) {
    blockers.push('Duplicate record safety check missing');
  }

  console.log(`- Firestore SDK Unified (admin.firestore): ${!content.includes('new Firestore') ? 'YES' : 'NO'}`);
  console.log(`- pdf-parse v2 mapping (pData.num): ${content.includes('pData.num') ? 'YES' : 'NO'}`);
  console.log(`- Empty text safety: ${content.includes('EMPTY_OR_UNSUPPORTED') ? 'YES' : 'NO'}`);
  console.log(`- Duplicate check: ${content.includes('ALREADY_EXISTS') ? 'YES' : 'NO'}`);
  console.log(`- Hardened selector: ${content.includes('--prefer-native-digital') ? 'YES' : 'NO'}`);

  if (blockers.length === 0) {
    console.log('\nRC_X4E_P5_FIX1_PAGEWISE_APPLY_CAPABILITY_READY');
  } else {
    console.error('\nRC_X4E_P5_FIX1_PAGEWISE_APPLY_CAPABILITY_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit();
