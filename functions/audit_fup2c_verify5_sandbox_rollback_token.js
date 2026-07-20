const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';
const EXPECTED_BRANCH = 'safety/rc-g2-pre-notification-schema';
const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN.json');

function is64CharHex(str) {
  return typeof str === 'string' && /^[0-9a-fA-F]{64}$/.test(str);
}

function invalid(reason) {
  console.error(`Token invalid: ${reason}`);
  console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN_INVALID');
  process.exit(1);
}

function main() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN_NOT_YET_CREATED');
    process.exit(0);
  }

  let token;
  try {
    token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  } catch (err) {
    invalid(`JSON parse error: ${err.message}`);
  }

  if (token.patch !== 'FUP-2C-VERIFY5-SANDBOX-ROLLBACK-DELETE-1') {
    invalid('patch field mismatch');
  }
  if (token.project_id !== PROJECT_ID) {
    invalid('project_id field mismatch');
  }
  if (token.branch !== EXPECTED_BRANCH) {
    invalid('branch field mismatch');
  }
  if (token.target_path !== 'system_verification_sandbox/SANDBOX_TEST_DOC_001') {
    invalid('target_path field mismatch');
  }

  const budget = token.mutation_budget || {};
  if (budget.create !== 0 || budget.update !== 0 || budget.delete !== 1) {
    invalid('mutation_budget mismatch');
  }

  const expiresMs = Date.parse(token.expires_at);
  if (isNaN(expiresMs)) {
    invalid('expires_at is not a valid timestamp');
  }
  if (expiresMs <= Date.now()) {
    invalid('token has expired');
  }

  if (token.one_time_use !== true) {
    invalid('one_time_use is not true');
  }

  const hashes = ['rollback_approval_phrase_hash', 'target_payload_sha256', 'rollback_bundle_sha256'];
  for (const h of hashes) {
    if (!is64CharHex(token[h])) {
      invalid(`hash field '${h}' is not 64-char hex`);
    }
  }

  console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN_PREFLIGHT_READY');
}

main();
