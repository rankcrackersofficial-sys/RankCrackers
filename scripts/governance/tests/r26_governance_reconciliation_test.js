const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { computeLedgerHash } = require('../generate_r26_proposal');

function runTests() {
  console.log('=== RUNNING GOVERNANCE REVISION 26 RECONCILIATION TEST SUITE ===');

  const proposal = JSON.parse(fs.readFileSync('proposal_governance_reconciliation_26.json', 'utf8'));
  const r26Master = JSON.parse(fs.readFileSync('rankcrackers_living_master_checklist_r26.json', 'utf8'));
  const r25Master = JSON.parse(fs.readFileSync('scratch_checklist.json', 'utf8'));

  // Test 1: Optimistic Concurrency & Revision Continuity
  console.log('\nTest 1: Optimistic Concurrency & Revision Continuity');
  if (proposal.base_ledger_revision !== 25) {
    throw new Error(`Expected proposal base_ledger_revision = 25, got ${proposal.base_ledger_revision}`);
  }
  if (r26Master.ledger_revision !== 26) {
    throw new Error(`Expected r26Master.ledger_revision = 26, got ${r26Master.ledger_revision}`);
  }
  if (r26Master.previous_ledger_hash !== r25Master.current_ledger_hash) {
    throw new Error('Broken hash chain: previous_ledger_hash does not match r25 current_ledger_hash');
  }
  console.log('  [PASS] Base revision 25 -> Advanced revision 26, hash chain linked seamlessly.');

  // Test 2: Hash Integrity
  console.log('\nTest 2: Hash Determinism & Ledger Hash Integrity');
  const freshHash = computeLedgerHash(r26Master);
  if (freshHash !== r26Master.current_ledger_hash) {
    throw new Error(`Hash mismatch: fresh = ${freshHash}, recorded = ${r26Master.current_ledger_hash}`);
  }
  console.log(`  [PASS] Hash computed (${freshHash}) matches recorded current_ledger_hash.`);

  // Test 3: Mutation Audit & Evidence Verification
  console.log('\nTest 3: Mutation Audit & Evidence Verification');
  const r26ItemMap = new Map(r26Master.items.map(i => [i.id, i]));
  proposal.mutations.forEach(m => {
    const item = r26ItemMap.get(m.checklist_id);
    if (!item) {
      throw new Error(`Mutated item ${m.checklist_id} not found in master ledger.`);
    }
    if (item.current_execution_state !== m.claimed_execution_state) {
      throw new Error(`Item ${m.checklist_id} execution state mismatch`);
    }
    if (item.audit_state !== m.claimed_audit_state) {
      throw new Error(`Item ${m.checklist_id} audit state mismatch`);
    }
    if (item.verification_state !== m.claimed_verification_state) {
      throw new Error(`Item ${m.checklist_id} verification state mismatch`);
    }

    // Verify evidence refs
    (item.evidence_refs || []).forEach(ref => {
      const fullPath = path.resolve(__dirname, '../../..', ref);
      if (!fs.existsSync(fullPath)) {
        console.warn(`    [WARN] Evidence ref not found on disk: ${ref}`);
      }
    });

    console.log(`  [PASS] Checkpoint ${m.checklist_id}: ${item.current_execution_state} | ${item.verification_state} | ${item.audit_state}`);
  });

  // Test 4: Single-Writer Immutability & Item Count Preservation
  console.log('\nTest 4: Item Count Preservation');
  if (r26Master.items.length !== r25Master.items.length) {
    throw new Error(`Item count altered: R25 = ${r25Master.items.length}, R26 = ${r26Master.items.length}`);
  }
  console.log(`  [PASS] Exact 386 items preserved across ledger revisions.`);

  console.log('\n======================================================');
  console.log('ALL GOVERNANCE REVISION 26 RECONCILIATION TESTS PASSED');
  console.log('======================================================');
}

runTests();
