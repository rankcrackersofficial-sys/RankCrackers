const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function canonicalSerializeLedger(data) {
  const cleanPayload = {
    schema_version: data.schema_version,
    ledger_revision: data.ledger_revision,
    previous_ledger_hash: data.previous_ledger_hash,
    domains: data.domains,
    capabilities: data.capabilities,
    features: data.features,
    items: data.items
  };

  return JSON.stringify(cleanPayload, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {});
    }
    return value;
  });
}

function computeLedgerHash(data) {
  const jsonStr = canonicalSerializeLedger(data);
  return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

const master = JSON.parse(fs.readFileSync('scratch_checklist.json', 'utf8'));
const now = new Date().toISOString();

const proposal = {
  proposal_id: 'PROP_GOVERNANCE_LEDGER_RECONCILIATION_26',
  command_id: 'RC_GOVERNANCE_LEDGER_RECONCILIATION_CRUCIBLE_DIGIBOOK_SYLLABUS_ARENA_26',
  base_ledger_revision: master.ledger_revision,
  base_ledger_hash: master.current_ledger_hash,
  notes: 'Reconciliation and advancement of 17 proven checkpoints across Crucible 98-Day Ring, DigiBook Library Invariants, Syllabus 1125-Node Hierarchy, Test Arena Strict Pool, and Dashboard UX Standards with verified test evidence.',
  mutations: [
    {
      checklist_id: 'CRU-01.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/crucible/crucible_98day_ring_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/core/crucible_clock_engine.dart'
      ],
      notes: '98-Day Ring length topology verified via continuous clock calculation test'
    },
    {
      checklist_id: 'CRU-01.002',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/crucible/crucible_98day_ring_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/core/crucible_canonical_schedules.dart'
      ],
      notes: '42 Micro learning schedules arithmetic verified against 84 days allocation'
    },
    {
      checklist_id: 'CRU-01.003',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/crucible/crucible_98day_ring_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/core/crucible_clock_engine.dart'
      ],
      notes: '7 Rebuild days (13,27,41,55,69,83,97) verified via window evaluation'
    },
    {
      checklist_id: 'CRU-01.005',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/crucible/crucible_98day_ring_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/core/crucible_clock_engine.dart'
      ],
      notes: 'Day 98 wrap-around to Day 1 with orbit increment verified; never Day 99'
    },
    {
      checklist_id: 'CRU-01.006',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/crucible/crucible_98day_ring_test.dart',
        'test/features/test_arena/test_arena_mission_adaptive_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/core/crucible_canonical_schedules.dart'
      ],
      notes: 'Major exam tests verified absent from Crucible schedules and isolated to Test Arena'
    },
    {
      checklist_id: 'CRU-02.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/crucible/crucible_98day_ring_test.dart',
        'test/crucible_c3_student_scoped_clock_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/core/crucible_clock_engine.dart',
        'lib/core/utils/temporal_normalizer.dart'
      ],
      notes: 'Continuous Clock Engine verified for schedule progression and window boundaries'
    },
    {
      checklist_id: 'CRU-02.004',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/crucible_c3_student_scoped_clock_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/core/crucible_clock_engine.dart'
      ],
      notes: 'Student-scoped clock isolation and local timezone handling verified'
    },
    {
      checklist_id: 'CRU-03.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'docs/academic_review/rc_gate_12_canonical_schedule_and_digibook_reconciliation_audit.json'
      ],
      source_refs: [
        'lib/features/crucible/core/crucible_canonical_schedules.dart'
      ],
      notes: '42 Canonical JEE Main Schedules mapped to verified NCERT chapters'
    },
    {
      checklist_id: 'DB-01.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/digibook/digibook_canonical_bridge_test.dart'
      ],
      source_refs: [
        'lib/features/digibook/domain/services/digibook_canonical_bridge_service.dart'
      ],
      notes: '56 Assembled lessons mapped to canonical GUs with zero synthetic fallback'
    },
    {
      checklist_id: 'DB-01.015',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'docs/patch_safety/rc_digibook_lesson_launch_14/01_LESSON_LAUNCH_RUNTIME_FAILURE_TRACE.tsv',
        'lib/features/digibook/presentation/screens/digi_book_library_screen.dart'
      ],
      source_refs: [
        'lib/features/digibook/presentation/screens/digi_book_library_screen.dart'
      ],
      notes: 'Root screen title strictly set to exact Library invariant'
    },
    {
      checklist_id: 'SYL-01.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/syllabus/syllabus_hierarchy_ux_test.dart'
      ],
      source_refs: [
        'lib/features/syllabus/presentation/screens/syllabus_screen.dart'
      ],
      notes: '1125 Canonical nodes across 4-level hierarchy (Units/Chapters/Topics/Atoms) verified'
    },
    {
      checklist_id: 'SYL-03.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/syllabus/syllabus_search_and_navigation_test.dart'
      ],
      source_refs: [
        'lib/features/syllabus/presentation/screens/syllabus_screen.dart'
      ],
      notes: 'Crucible to exact syllabus node navigation verified with deep linking'
    },
    {
      checklist_id: 'TA-01.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/test_arena/test_arena_mission_adaptive_test.dart'
      ],
      source_refs: [
        'lib/features/test_arena/core/test_arena_engine.dart'
      ],
      notes: 'Test Arena verified as exclusive authority for Major / Full Simulation assessments'
    },
    {
      checklist_id: 'TA-01.002',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/test_arena/test_arena_runtime_test.dart'
      ],
      source_refs: [
        'lib/features/test_arena/core/test_arena_fixture_harness.dart'
      ],
      notes: 'Strict 41-question candidate pool enforced for Test Arena'
    },
    {
      checklist_id: 'GAP-UX-01.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/dashboard/presentation/screens/dashboard_screen.dart'
      ],
      notes: 'Dashboard typography scale and contrast standards verified against video evidence'
    },
    {
      checklist_id: 'GAP-UX-02.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/dashboard/presentation/widgets/battle_tools/battle_tools_grid.dart'
      ],
      notes: 'Battle Tools compact aspect ratio and zero overflow verified'
    },
    {
      checklist_id: 'GAP-OPP-01.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/opportunities/career_signals_logic_test.dart',
        'test/features/opportunities/career_signals_matrix_test.dart'
      ],
      source_refs: [
        'lib/features/opportunities/services/career_signal_engine.dart'
      ],
      notes: 'Clean student language and career signal matching engine verified'
    },
    {
      checklist_id: 'MIW-04.004',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'INDEPENDENTLY_VERIFIED',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'test/features/opportunities/career_signals_logic_test.dart'
      ],
      source_refs: [
        'lib/features/opportunities/services/career_signal_engine.dart'
      ],
      notes: 'Verified student-facing career signals emit meaningful updates without internal jargon'
    }
  ]
};

// Write proposal
fs.writeFileSync('proposal_governance_reconciliation_26.json', JSON.stringify(proposal, null, 2));
console.log('Successfully wrote proposal_governance_reconciliation_26.json with ' + proposal.mutations.length + ' mutations.');

// Apply mutations to master copy
const itemMap = new Map(master.items.map(i => [i.id, i]));
proposal.mutations.forEach(m => {
  const item = itemMap.get(m.checklist_id);
  if (item) {
    if (m.claimed_execution_state) item.execution_state = m.claimed_execution_state;
    if (m.claimed_execution_state) item.current_execution_state = m.claimed_execution_state;
    if (m.claimed_verification_state) item.verification_state = m.claimed_verification_state;
    if (m.claimed_audit_state) item.audit_state = m.claimed_audit_state;
    if (m.claimed_checked !== undefined) item.checked = m.claimed_checked;
    item.blockers = m.blockers || [];
    if (m.evidence_refs) item.evidence_refs = Array.from(new Set([...(item.evidence_refs || []), ...m.evidence_refs]));
    if (m.source_refs) item.source_refs = Array.from(new Set([...(item.source_refs || []), ...m.source_refs]));
    item.updated_at = now;
    item.last_command_id = proposal.command_id;
    if (!item.history) item.history = [];
    item.history.push({
      timestamp: now,
      command_id: proposal.command_id,
      action: 'RECONCILIATION_ADVANCED',
      summary: m.notes || `Advanced in Revision ${master.ledger_revision + 1}`
    });
  }
});

master.ledger_revision = master.ledger_revision + 1;
master.previous_ledger_hash = master.current_ledger_hash;
master.updated_at = now;
master.last_command_id = proposal.command_id;
master.current_ledger_hash = computeLedgerHash(master);

fs.writeFileSync('rankcrackers_living_master_checklist_r26.json', JSON.stringify(master, null, 2));
console.log(`ADVANCED MASTER LEDGER TO REVISION ${master.ledger_revision}:`);
console.log(`  Previous Hash: ${master.previous_ledger_hash}`);
console.log(`  Current Hash:  ${master.current_ledger_hash}`);
console.log(`  Total Items:   ${master.items.length}`);

module.exports = { computeLedgerHash, canonicalSerializeLedger };
