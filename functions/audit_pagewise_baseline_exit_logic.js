const fs = require('fs');
const path = require('path');

const AUDIT_FILES = [
  'functions/audit_pagewise_worker_runtime_safety.js',
  'functions/audit_pagewise_candidate_selector_policy.js',
  'functions/audit_pagewise_limit3_apply_readiness.js',
  'functions/audit_pagewise_hardened_limit3_result.js',
  'functions/audit_pagewise_second_hardened_limit3_result.js',
  'functions/audit_pagewise_third_hardened_limit3_result.js',
  'functions/audit_pagewise_undocumented_apply_incident.js',
  'functions/audit_pagewise_pre_p11_undocumented_incident.js',
  'functions/audit_pagewise_post_p12_result.js',
  'functions/audit_pagewise_extraction_apply_capability.js',
  'functions/audit_pagewise_queue_state.js'
];

function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R10 - BASELINE EXIT LOGIC AUDIT');
  console.log('==============================================');

  let allSafe = true;

  AUDIT_FILES.forEach(f => {
    const fullPath = path.join(__dirname, '..', f);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');

    // Look for if (mismatch)
    if (content.includes('if (mismatch)')) {
        const idx = content.indexOf('if (mismatch)');
        const searchArea = content.slice(idx, idx + 1000);
        if (!searchArea.includes('process.exit(1)')) {
            console.error(`NON-FATAL BLOCK DETECTED IN ${f}: mismatch block missing exit.`);
            allSafe = false;
        }
    }

    // Look for if (!matchTotal || ...
    if (content.includes('if (!matchTotal')) {
        const idx = content.indexOf('if (!matchTotal');
        const searchArea = content.slice(idx, idx + 1000);
        if (!searchArea.includes('process.exit(1)')) {
            console.error(`NON-FATAL BLOCK DETECTED IN ${f}: matchTotal block missing exit.`);
            allSafe = false;
        }
    }

    // Look for if (blockers.length > 0)
    if (content.includes('if (blockers.length > 0)')) {
        const idx = content.indexOf('if (blockers.length > 0)');
        const searchArea = content.slice(idx, idx + 1000);
        if (!searchArea.includes('process.exit(1)')) {
            console.error(`NON-FATAL BLOCK DETECTED IN ${f}: blockers block missing exit.`);
            allSafe = false;
        }
    }
  });

  if (!allSafe) {
    console.error('\nRC_X4E_R10_NON_FATAL_BASELINE_MISMATCH_FOUND');
    process.exit(1);
  }

  console.log('\nRC_X4E_R10_BASELINE_EXIT_LOGIC_READY');
}

audit();
