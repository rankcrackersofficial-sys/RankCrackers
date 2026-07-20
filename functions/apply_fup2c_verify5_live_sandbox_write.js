const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const PROJECT_ID = 'rankcrackers-55';
const EXPECTED_BRANCH = 'safety/rc-g2-pre-notification-schema';
const EXPECTED_HEAD = '67d52662af437f53cb5e1bbe98539b48c6299fea';
const EXPECTED_APPROVAL_HASH = '0c63d04b9d603c5f43e9c95e8ccccc2d4964b033d37fc392bf9271c8d25d3b79';
const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_LIVE_AUTH_SECOND_GATE_TOKEN.json');

function block(reason) {
  console.error(`BLOCKED: ${reason}`);
  console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_BLOCKED');
  process.exit(1);
}

function is64CharHex(str) {
  return typeof str === 'string' && /^[0-9a-fA-F]{64}$/.test(str);
}

async function main() {
  console.log('=== FUP-2C-VERIFY5 LIVE SANDBOX WRITE EXECUTION ===');

  // 1. Emulator check
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    block('FUP_2C_VERIFY5_BLOCKED_EMULATOR_HOST_PRESENT');
  }

  // 2. Git branch and commit checks
  let branch = '';
  let head = '';
  try {
    branch = execSync('git branch --show-current').toString().trim();
    head = execSync('git rev-parse HEAD').toString().trim();
  } catch (err) {
    block(`Failed to query git state: ${err.message}`);
  }

  if (branch !== EXPECTED_BRANCH) {
    block(`Branch mismatch. Expected ${EXPECTED_BRANCH}, got ${branch}`);
  }
  if (head !== EXPECTED_HEAD) {
    block(`HEAD commit mismatch. Expected ${EXPECTED_HEAD}, got ${head}`);
  }

  // 3. Token file validation
  if (!fs.existsSync(TOKEN_PATH)) {
    block('Token file does not exist.');
  }

  let token;
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf8');
    token = JSON.parse(raw);
  } catch (err) {
    block(`Failed to parse token file: ${err.message}`);
  }

  if (token.patch !== 'FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1') {
    block('Token patch ID mismatch');
  }
  if (token.mission_id !== 'jee_main_2026') {
    block('Token mission ID mismatch');
  }
  if (token.project_id !== PROJECT_ID) {
    block('Token project ID mismatch');
  }
  if (token.branch !== EXPECTED_BRANCH) {
    block('Token branch mismatch');
  }
  if (token.target_path !== 'system_verification_sandbox/SANDBOX_TEST_DOC_001') {
    block('Token target path mismatch');
  }
  const budget = token.mutation_budget || {};
  if (budget.create !== 1 || budget.update !== 0 || budget.delete !== 0) {
    block('Token mutation budget mismatch');
  }
  if (token.one_time_use !== true) {
    block('Token one_time_use is not true');
  }

  const expiresMs = Date.parse(token.expires_at);
  if (isNaN(expiresMs)) {
    block('Token expires_at is not a valid timestamp');
  }
  if (expiresMs <= Date.now()) {
    block('FUP_2C_VERIFY5_LIVE_WRITE_SANDBOX_1_BLOCKED_TOKEN_EXPIRED');
  }

  const hashFields = ['founder_approval_phrase_hash', 'payload_sha256', 'rollback_sha256', 'bundle_sha256'];
  for (const h of hashFields) {
    if (!is64CharHex(token[h])) {
      block(`Token hash field ${h} is invalid hex digest`);
    }
  }

  // 4. Founder phrase hash check
  if (token.founder_approval_phrase_hash !== EXPECTED_APPROVAL_HASH) {
    block('Founder approval phrase hash mismatch');
  }

  // 5. Initialize Firebase
  admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  // 6. Pre-check target existence
  const docRef = db.doc(token.target_path);
  const snap = await docRef.get();
  if (snap.exists) {
    block('FUP_2C_VERIFY5_BLOCKED_TARGET_ALREADY_EXISTS');
  }

  // 7. Perform sandbox write
  const payload = {
    patch: "FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1",
    mission_id: "jee_main_2026",
    purpose: "authorization_sandbox_verification",
    academic_write: false,
    student_visible: false,
    created_by: "founder_authorized_second_gate",
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    token_bundle_sha256: token.bundle_sha256,
    founder_approval_phrase_hash: EXPECTED_APPROVAL_HASH,
    mutation_budget_used: {
      create: 1,
      update: 0,
      delete: 0
    }
  };

  try {
    await docRef.set(payload);
    console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_SUCCESS');
  } catch (err) {
    block(`Firestore write failed: ${err.message}`);
  }
}

main().catch(err => {
  console.error(err);
  console.log('FUP_2C_VERIFY5_LIVE_SANDBOX_WRITE_BLOCKED');
  process.exit(1);
});
