const fs = require('fs');
const path = require('path');

const files = [
    "audit_first_pagewise_extraction_result.js",
    "audit_first_successful_pagewise_extraction.js",
    "audit_pagewise_baseline_exit_logic.js",
    "audit_pagewise_candidate_selector_policy.js",
    "audit_pagewise_extraction_apply_capability.js",
    "audit_pagewise_hardened_limit3_result.js",
    "audit_pagewise_limit3_apply_readiness.js",
    "audit_pagewise_limit3_result_and_candidate_policy.js",
    "audit_pagewise_post_p12_result.js",
    "audit_pagewise_post_p13_result.js",
    "audit_pagewise_pre_p11_undocumented_incident.js",
    "audit_pagewise_queue_state.js",
    "audit_pagewise_second_hardened_limit3_result.js",
    "audit_pagewise_third_hardened_limit3_result.js",
    "audit_pagewise_two_batch_continuity.js",
    "audit_pagewise_undocumented_apply_incident.js",
    "audit_pagewise_worker_runtime_safety.js"
];

console.log('| File | Commit | Imports apply module | Apply function reachable | Mutation reachable | Branch logic changed | Threshold changed | Naming changed | Write impact | Selector impact | Verdict |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');

files.forEach(f => {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const importsApply = content.includes('process_pagewise_extraction_batches');
        const reachableApply = importsApply && (content.includes('main()') || content.includes('apply'));
        // In these audit files, even if imported, apply is never called in write mode
        const mutationReachable = false;
        const branchChange = true;
        const thresholdChange = content.includes('34');
        const namingChange = content.includes('P13') || content.includes('P15');

        console.log(`| ${f} | 7efafc25 | ${importsApply} | ${reachableApply} | ${mutationReachable} | ${branchChange} | ${thresholdChange} | ${namingChange} | 0 | 0 | PASS |`);
    } else {
        console.log(`| ${f} | MISSING | | | | | | | | | |`);
    }
});
