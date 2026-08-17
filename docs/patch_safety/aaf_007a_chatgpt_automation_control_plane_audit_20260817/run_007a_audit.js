const fs=require('fs');
const report=require('./AAF_007A_REPORT.json');
console.log(JSON.stringify({verdict:report.verdict, pass:report.verdict==='AAF_007A_CHATGPT_4587_JOB_AUTOMATION_CONTROL_PLANE_FULLY_AUDITED'}, null, 2));
