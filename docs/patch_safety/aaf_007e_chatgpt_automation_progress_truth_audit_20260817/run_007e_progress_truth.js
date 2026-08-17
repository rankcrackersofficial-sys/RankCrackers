const fs=require('fs');
const report=require('./AAF_007E_REPORT.json');
console.log(JSON.stringify({verdict:report.verdict, pass:report.verdict==='AAF_007E_AUTOMATION_PROGRESS_AND_DENOMINATOR_TRUTH_ENGINE_AUDITED'}, null, 2));
