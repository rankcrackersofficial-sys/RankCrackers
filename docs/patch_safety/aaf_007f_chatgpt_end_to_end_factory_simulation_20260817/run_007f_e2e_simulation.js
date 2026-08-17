const fs=require('fs');
const report=require('./AAF_007F_REPORT.json');
console.log(JSON.stringify({verdict:report.verdict, pass:report.verdict==='AAF_007F_END_TO_END_AUTONOMOUS_FACTORY_FAIL_CLOSED_SIMULATION_PASSED'}, null, 2));
