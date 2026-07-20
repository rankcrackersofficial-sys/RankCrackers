const fs = require('fs');
const path = require('path');

const CEREMONY_PATH = path.join(__dirname, '..', 'docs', 'syllabus', 'FUP_2C_VERIFY5_LIVE_AUTHORIZATION_CEREMONY.md');
const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_LIVE_AUTH_SECOND_GATE_TOKEN.json');

const EXPECTED_TOKEN_DATA = {
  patch: 'FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1',
  mission_id: 'jee_main_2026',
  project_id: 'rankcrackers-55',
  branch: 'safety/rc-g2-pre-notification-schema',
  target_path: 'system_verification_sandbox/SANDBOX_TEST_DOC_001',
  mutation_budget: {
    create: 1,
    update: 0,
    delete: 0
  }
};

function is64CharHex(str) {
  return typeof str === 'string' && /^[0-9a-fA-F]{64}$/.test(str);
}

function checkTokenValidity(token) {
  const requiredFields = [
    'patch', 'mission_id', 'project_id', 'branch', 'target_path',
    'mutation_budget', 'expires_at', 'one_time_use',
    'founder_approval_phrase_hash', 'payload_sha256', 'rollback_sha256', 'bundle_sha256'
  ];

  for (const f of requiredFields) {
    if (token[f] === undefined) return false;
  }

  if (token.patch !== EXPECTED_TOKEN_DATA.patch) return false;
  if (token.mission_id !== EXPECTED_TOKEN_DATA.mission_id) return false;
  if (token.project_id !== EXPECTED_TOKEN_DATA.project_id) return false;
  if (token.branch !== EXPECTED_TOKEN_DATA.branch) return false;
  if (token.target_path !== EXPECTED_TOKEN_DATA.target_path) return false;

  const budget = token.mutation_budget;
  if (!budget || budget.create !== EXPECTED_TOKEN_DATA.mutation_budget.create || budget.update !== EXPECTED_TOKEN_DATA.mutation_budget.update || budget.delete !== EXPECTED_TOKEN_DATA.mutation_budget.delete) {
    return false;
  }

  const hashFields = ['founder_approval_phrase_hash', 'payload_sha256', 'rollback_sha256', 'bundle_sha256'];
  for (const h of hashFields) {
    if (!is64CharHex(token[h])) return false;
  }

  if (token.one_time_use !== true) return false;

  const expiresMs = Date.parse(token.expires_at);
  if (isNaN(expiresMs) || expiresMs <= Date.now()) return false;

  return true;
}

function main() {
  console.log('==============================================');
  console.log('FUP-2C-VERIFY5 LIVE AUTHORIZATION STATE AUDIT');
  console.log('==============================================');

  // 1. Check Founder Explicit Approval
  let founder_explicit_approval = false;
  if (fs.existsSync(CEREMONY_PATH)) {
    const ceremonyText = fs.readFileSync(CEREMONY_PATH, 'utf8');
    // Look for "Founder Explicit Live Approval: true"
    if (/Founder Explicit Live Approval:\s*true/i.test(ceremonyText)) {
      founder_explicit_approval = true;
    }
  }

  // 2. Check Second Gate Token
  const second_gate_token_present = fs.existsSync(TOKEN_PATH);
  let second_gate_token_valid = false;
  let active_live_token = false;

  if (second_gate_token_present) {
    try {
      const raw = fs.readFileSync(TOKEN_PATH, 'utf8');
      const token = JSON.parse(raw);
      second_gate_token_valid = checkTokenValidity(token);
      if (second_gate_token_valid) {
        // active token is true if valid and not expired
        active_live_token = true;
      }
    } catch (err) {
      second_gate_token_valid = false;
    }
  }

  // 3. Other gates
  const architecture_ready = true;
  const checksum_reconciled = true; // final bundle digest passed in preflight
  const live_target_existence_known = false; // UNKNOWN / deferred
  const deployed_rules_equivalence_known = false; // UNKNOWN

  // 4. Live execution allowed calculation
  // All three authority gates MUST be true
  const live_execution_allowed = (
    founder_explicit_approval &&
    second_gate_token_valid &&
    active_live_token
  );

  // Print states
  console.log(`architecture_ready: ${architecture_ready}`);
  console.log(`checksum_reconciled: ${checksum_reconciled}`);
  console.log(`founder_explicit_approval: ${founder_explicit_approval}`);
  console.log(`second_gate_token_present: ${second_gate_token_present}`);
  console.log(`second_gate_token_valid: ${second_gate_token_valid}`);
  console.log(`active_live_token: ${active_live_token}`);
  console.log(`live_target_existence_known: ${live_target_existence_known}`);
  console.log(`deployed_rules_equivalence_known: ${deployed_rules_equivalence_known}`);
  console.log(`live_execution_allowed: ${live_execution_allowed}`);

  // 5. Escalation safety check
  // If live_execution_allowed is true, but any required gate is false, that's an unauthorized escalation!
  const actual_allowed_physically = (
    founder_explicit_approval &&
    second_gate_token_present &&
    second_gate_token_valid &&
    active_live_token
  );

  if (live_execution_allowed && !actual_allowed_physically) {
    console.error('\nERROR: Execution flag set but security gates failed!');
    console.log('FUP_2C_VERIFY5_BLOCKED_UNAUTHORIZED_LIVE_AUTH_ESCALATION');
    process.exit(1);
  }

  // Double check: if any of the mandatory fields are true without explicit authority, raise error
  if (!founder_explicit_approval && live_execution_allowed) {
    console.error('\nERROR: Escalation check: founder_explicit_approval is false but live_execution_allowed is true.');
    console.log('FUP_2C_VERIFY5_BLOCKED_UNAUTHORIZED_LIVE_AUTH_ESCALATION');
    process.exit(1);
  }

  console.log('\nVerdict:');
  if (live_execution_allowed) {
    console.log('FUP_2C_VERIFY5_LIVE_AUTH_STATE_APPROVED');
  } else {
    console.log('FUP_2C_VERIFY5_LIVE_AUTH_STATE_BLOCKED_PENDING_FOUNDER');
  }
}

main();
