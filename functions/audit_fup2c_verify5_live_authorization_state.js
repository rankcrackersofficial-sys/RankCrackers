const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PHRASE_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_FOUNDER_APPROVAL_PHRASE.txt');
const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_LIVE_AUTH_SECOND_GATE_TOKEN.json');

const EXPECTED_PHRASE = "I, Founder of RankCrackers, authorize exactly one sandbox verification write to system_verification_sandbox/SANDBOX_TEST_DOC_001. I do not authorize syllabus_atoms writes. I do not authorize topic_nodes writes. I do not authorize student publish. I do not authorize Crucible or DigiBook generation. I do not authorize production academic mutation.";

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

  // 1. Check Founder Explicit Approval Phrase
  let founder_explicit_approval = false;
  if (fs.existsSync(PHRASE_PATH)) {
    try {
      const phraseText = fs.readFileSync(PHRASE_PATH, 'utf8').replace(/\r\n/g, '\n').trim();
      if (phraseText === EXPECTED_PHRASE) {
        founder_explicit_approval = true;
      }
    } catch (err) {
      founder_explicit_approval = false;
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
  // MUST remain false in this patch/script under all circumstances
  const live_execution_allowed = false;

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
  // If live_execution_allowed ever becomes true, block
  if (live_execution_allowed) {
    console.error('\nERROR: Execution flag set but security gates failed!');
    console.log('FUP_2C_VERIFY5_BLOCKED_UNAUTHORIZED_LIVE_AUTH_ESCALATION');
    process.exit(1);
  }

  console.log('\nVerdict:');
  const token_ready = founder_explicit_approval && second_gate_token_valid && active_live_token;
  if (token_ready) {
    console.log('FUP_2C_VERIFY5_LIVE_AUTH_STATE_TOKEN_READY_EXECUTION_STILL_BLOCKED');
  } else {
    console.log('FUP_2C_VERIFY5_LIVE_AUTH_STATE_BLOCKED_PENDING_FOUNDER');
  }
}

main();
