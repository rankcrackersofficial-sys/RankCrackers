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

files.forEach(f => {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const has34 = content.includes('34');
        const has31 = content.includes('31');
        const hasP13 = content.includes('P13');
        const hasWT4 = content.includes('WT4');
        const importsApply = content.includes('require') && content.includes('process_pagewise_extraction_batches');
        console.log(`${f}|${has34}|${has31}|${hasP13}|${hasWT4}|${importsApply}`);
    } else {
        console.log(`${f}|MISSING`);
    }
});
