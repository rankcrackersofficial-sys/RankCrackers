const fs=require('fs');
const report=require('./AAF_007C_REPORT.json');
console.log(JSON.stringify({verdict:report.verdict, pass:report.verdict==='AAF_007C_MATERIALIZATION_AND_PUBLICATION_FAIL_CLOSED_GATE_PASSED'}, null, 2));
