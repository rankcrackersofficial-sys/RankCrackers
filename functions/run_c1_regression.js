const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const suites = [
  'test_mission_cycle_store.js',
  'test_mission_source_preflight.js',
  'test_mission_enrichment_worker.js',
  'test_mission_cycle_lifecycle.js',
  'test_mission_enrichment_guardrails.js',
  'test_mission_enrichment_orchestrator_kernel.js',
  'test_mission_enrichment_stage_graph.js',
  'test_canonical_mission_identity_b1.js',
  'test_authority_intelligence_foundation.js'
];

console.log('=== RUNNING FULL C1 10-SUITE REGRESSION FLOOR ===\n');

let totalTests = 0;
let passedSuites = 0;
const results = [];

suites.forEach((suite, idx) => {
  const suitePath = path.join(__dirname, suite);
  if (!fs.existsSync(suitePath)) {
    // extract from safety/rc-backend-source-trust-p2a-ag1
    try {
      const code = cp.execSync(`git show safety/rc-backend-source-trust-p2a-ag1:functions/${suite}`).toString();
      fs.writeFileSync(suitePath, code);
    } catch (e) {
      console.error(`Missing suite: ${suite}`);
      results.push({ suite, count: 0, status: 'MISSING' });
      return;
    }
  }

  try {
    const out = cp.execSync(`node ${suite}`, { cwd: __dirname }).toString();
    // Count assertions / test completions
    const passMatches = out.match(/PASS|pass|assert|ok|✓|completed/gi) || [];
    // Count lines or specific outputs
    console.log(`Suite [${idx + 1}/10] ${suite}: PASS`);
    passedSuites++;
    results.push({ suite, status: 'PASS', output: out.trim().split('\n').pop() });
  } catch (e) {
    console.error(`Suite [${idx + 1}/10] ${suite}: FAIL`, e.message);
    results.push({ suite, status: 'FAIL', error: e.message });
  }
});

console.log('\n=== C1 REGRESSION SUMMARY ===');
console.log(`Suites Passed: ${passedSuites} / ${suites.length}`);
results.forEach(r => console.log(` - ${r.suite}: ${r.status} (${r.output || r.error})`));
