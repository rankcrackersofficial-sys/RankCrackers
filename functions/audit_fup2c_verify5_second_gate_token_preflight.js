const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_LIVE_AUTH_SECOND_GATE_TOKEN.json');

const EXPECTED = {
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

function audit() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_NOT_YET_CREATED');
    process.exit(0);
  }

  let token;
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf8');
    token = JSON.parse(raw);
  } catch (err) {
    console.error('Error parsing token JSON:', err.message);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  // 1. Check all required fields exist
  const requiredFields = [
    'patch', 'mission_id', 'project_id', 'branch', 'target_path',
    'mutation_budget', 'expires_at', 'one_time_use',
    'founder_approval_phrase_hash', 'payload_sha256', 'rollback_sha256', 'bundle_sha256'
  ];

  for (const f of requiredFields) {
    if (token[f] === undefined) {
      console.error(`Missing field: ${f}`);
      console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
      process.exit(1);
    }
  }

  // 2. Validate exact metadata matching
  if (token.patch !== EXPECTED.patch) {
    console.error(`Patch mismatch: expected ${EXPECTED.patch}, got ${token.patch}`);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  if (token.mission_id !== EXPECTED.mission_id) {
    console.error(`Mission ID mismatch: expected ${EXPECTED.mission_id}, got ${token.mission_id}`);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  if (token.project_id !== EXPECTED.project_id) {
    console.error(`Project ID mismatch: expected ${EXPECTED.project_id}, got ${token.project_id}`);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  if (token.branch !== EXPECTED.branch) {
    console.error(`Branch mismatch: expected ${EXPECTED.branch}, got ${token.branch}`);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  if (token.target_path !== EXPECTED.target_path) {
    console.error(`Target path mismatch: expected ${EXPECTED.target_path}, got ${token.target_path}`);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  // 3. Validate mutation budget
  const budget = token.mutation_budget;
  if (!budget || budget.create !== EXPECTED.mutation_budget.create || budget.update !== EXPECTED.mutation_budget.update || budget.delete !== EXPECTED.mutation_budget.delete) {
    console.error('Mutation budget mismatch:', budget);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  // 4. Validate hashes are 64-char hex
  const hashFields = ['founder_approval_phrase_hash', 'payload_sha256', 'rollback_sha256', 'bundle_sha256'];
  for (const h of hashFields) {
    if (!is64CharHex(token[h])) {
      console.error(`Field ${h} is not a valid 64-character hex digest: ${token[h]}`);
      console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
      process.exit(1);
    }
  }

  // 5. Validate one_time_use is true
  if (token.one_time_use !== true) {
    console.error('one_time_use must be true');
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  // 6. Validate expires_at is in the future
  const expiresMs = Date.parse(token.expires_at);
  if (isNaN(expiresMs)) {
    console.error(`Invalid ISO timestamp for expires_at: ${token.expires_at}`);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  if (expiresMs <= Date.now()) {
    console.error(`Token expired at: ${token.expires_at}`);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_INVALID');
    process.exit(1);
  }

  console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_PREFLIGHT_READY');
}

audit();
