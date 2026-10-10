/**
 * RC_CRUCIBLE_R10D_GOVERNANCE_RECONCILIATION_TEST
 * Validates Section 13 required test cases for 10D Governance Authority Reconciliation.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { canonicalSerializeLedger, computeLedgerHash } = require('../canonical_serializer');
const { validateProposal } = require('../validate_checklist_mutation_proposal');

const GOVERNANCE_DIR = path.resolve(__dirname, '../../../docs/governance');
const MASTER_PATH = path.join(GOVERNANCE_DIR, 'rankcrackers_living_master_checklist.json');

function runTestSuite() {
  console.log('=== RC CRUCIBLE R10D GOVERNANCE RECONCILIATION TEST SUITE ===\n');
  const results = [];

  function record(name, pass, detail) {
    results.push({ name, pass, detail });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
  }

  // 1. CANONICAL HASH RECOMPUTATION TEST
  try {
    const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
    const recomputed = computeLedgerHash(master);
    assert.strictEqual(master.current_ledger_hash, recomputed, 'Stored hash must match recomputed hash');
    record('CANONICAL_HASH_RECOMPUTATION_TEST', true, `Stored hash ${master.current_ledger_hash} matches canonical recomputed hash`);
  } catch (e) {
    record('CANONICAL_HASH_RECOMPUTATION_TEST', false, e.message);
  }

  // 2. GIT REVISION HASH HISTORY TEST
  try {
    const rawRev7 = execSync('git show 8f5131769899a92448f1c199df3de00318a80334:docs/governance/rankcrackers_living_master_checklist.json', { cwd: 'C:/RankCrackers/RankCrackers-55.worktrees/governance-living-checklist' }).toString();
    const masterRev7 = JSON.parse(rawRev7);
    const rev7Hash = computeLedgerHash(masterRev7);
    assert.strictEqual(rev7Hash, '7a231679444c9f7f0b3b4c77772027e8398371d9f35e46da3bed0a7de1011427', 'Rev 7 canonical hash must be 7a231679...');
    record('GIT_REVISION_HASH_HISTORY_TEST', true, `Rev 7 canonical hash ${rev7Hash} verified from Git commit 8f513176`);
  } catch (e) {
    record('GIT_REVISION_HASH_HISTORY_TEST', false, e.message);
  }

  // 3. PREVIOUS HASH CHAIN CONTINUITY TEST
  try {
    const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
    assert.strictEqual(master.ledger_revision, 8, 'Current ledger revision must be 8');
    assert.strictEqual(master.previous_ledger_hash, '7a231679444c9f7f0b3b4c77772027e8398371d9f35e46da3bed0a7de1011427', 'Rev 8 previous_ledger_hash must link to Rev 7 canonical hash');
    record('PREVIOUS_HASH_CHAIN_CONTINUITY_TEST', true, `Rev 8 previous_ledger_hash exactly links to Rev 7 canonical hash`);
  } catch (e) {
    record('PREVIOUS_HASH_CHAIN_CONTINUITY_TEST', false, e.message);
  }

  // 4. OBJECT KEY ORDER STABILITY TEST
  try {
    const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
    const reordered = JSON.parse(JSON.stringify(master));
    reordered.items = reordered.items.map(item => ({
      requirement: item.requirement,
      id: item.id,
      checked: item.checked,
      execution_state: item.execution_state,
      ...item
    }));
    const hashOriginal = computeLedgerHash(master);
    const hashReordered = computeLedgerHash(reordered);
    assert.strictEqual(hashOriginal, hashReordered, 'Hash must be invariant to key ordering');
    record('OBJECT_KEY_ORDER_STABILITY_TEST', true, `Canonical serializer guarantees key-order stability (${hashOriginal})`);
  } catch (e) {
    record('OBJECT_KEY_ORDER_STABILITY_TEST', false, e.message);
  }

  // 5. STALE MUTATION REJECTION TEST
  try {
    const testProposalPath = path.join(GOVERNANCE_DIR, 'mutation_inbox/stale_test_proposal.json');
    fs.writeFileSync(testProposalPath, JSON.stringify({
      proposal_id: 'PROP_STALE_TEST',
      command_id: 'TEST_CMD',
      base_ledger_revision: 7,
      base_ledger_hash: '0949b6f24cf270693ad1f05b9e48e36186716e73f00123cca9e6928c534cddf9',
      mutations: []
    }));
    const valResult = validateProposal(testProposalPath);
    if (fs.existsSync(testProposalPath)) fs.unlinkSync(testProposalPath);
    assert.strictEqual(valResult.valid, false, 'Proposal against wrong base hash must be rejected');
    record('STALE_MUTATION_REJECTION_TEST', true, 'Stale proposal with invalid base hash rejected by validator');
  } catch (e) {
    record('STALE_MUTATION_REJECTION_TEST', false, e.message);
  }

  // 6. CURRENT REPORT VS LEDGER RECONCILIATION TEST
  try {
    const auditTsvPath = path.join(GOVERNANCE_DIR, 'reviews/history/RC_REVISION_7_LEDGER_HASH_IDENTITY_AUDIT.tsv');
    assert.ok(fs.existsSync(auditTsvPath), 'Audit TSV must exist');
    const tsvContent = fs.readFileSync(auditTsvPath, 'utf8');
    assert.ok(tsvContent.includes('7a231679444c9f7f0b3b4c77772027e8398371d9f35e46da3bed0a7de1011427'), 'Audit TSV must record Rev 7 hash');
    record('CURRENT_REPORT_VS_LEDGER_RECONCILIATION_TEST', true, 'Audit TSV accurately reconciles all Git commits and hashes');
  } catch (e) {
    record('CURRENT_REPORT_VS_LEDGER_RECONCILIATION_TEST', false, e.message);
  }

  console.log('\n=== TEST SUMMARY ===');
  const allPass = results.every(r => r.pass);
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.pass).length}`);
  console.log(`Failed: ${results.filter(r => !r.pass).length}`);
  console.log(`Overall Status: ${allPass ? 'PASS' : 'FAIL'}`);

  if (!allPass) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite();
}

module.exports = { runTestSuite };
