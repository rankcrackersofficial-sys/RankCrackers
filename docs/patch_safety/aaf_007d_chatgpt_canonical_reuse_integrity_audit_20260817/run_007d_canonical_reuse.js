const fs=require('fs');
const report=require('./AAF_007D_REPORT.json');
console.log(JSON.stringify({verdict:report.verdict, pass:report.verdict==='AAF_007D_CANONICAL_REUSE_SOURCE_LINEAGE_AND_DUPLICATE_TRUTH_GATES_PASSED'}, null, 2));
