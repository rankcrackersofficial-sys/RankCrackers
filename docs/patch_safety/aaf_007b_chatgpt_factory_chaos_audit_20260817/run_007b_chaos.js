const fs=require('fs');
const report=require('./AAF_007B_REPORT.json');
console.log(JSON.stringify({verdict:report.verdict, pass:report.verdict==='AAF_007B_FACTORY_LEASE_RETRY_CONCURRENCY_AND_IDEMPOTENCY_CHAOS_GATES_PASSED'}, null, 2));
