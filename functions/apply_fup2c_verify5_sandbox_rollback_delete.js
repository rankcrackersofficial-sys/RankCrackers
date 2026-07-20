const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const PROJECT_ID = 'rankcrackers-55';
const EXPECTED_BRANCH = 'safety/rc-g2-pre-notification-schema';
const EXPECTED_HEAD = '45c920ea346b21777c44dd711c64a707505b6ffe';
const EXPECTED_ROLLBACK_PHRASE_HASH = '8ff3dd0e42f1837927745faa9524e024583491d61d026ba27665e449061e4a86';
const EXPECTED_WRITE_APPROVAL_HASH = '0c63d04b9d603c5f43e9c95e8ccccc2d4964b033d37fc392bf9271c8d25d3b79';
const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN.json');

function block(reason) {
  console.error(`BLOCKED: ${reason}`);
  console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_DELETE_BLOCKED');
  process.exit(1);
}

function is64CharHex(str) {
  return typeof str === 'string' && /^[0-9a-fA-F]{64}$/.test(str);
}

async function main() {
  console.log('=== FUP-2C-VERIFY5 SANDBOX ROLLBACK DELETE ===');

  // 1. Emulator check
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    block('FUP_2C_VERIFY5_ROLLBACK_BLOCKED_EMULATOR_HOST_PRESENT');
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
    block('Rollback token file does not exist.');
  }

  let token;
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf8');
    token = JSON.parse(raw);
  } catch (err) {
    block(`Failed to parse token file: ${err.message}`);
  }

  if (token.patch !== 'FUP-2C-VERIFY5-SANDBOX-ROLLBACK-DELETE-1') {
    block('Token patch ID mismatch');
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
  if (budget.create !== 0 || budget.update !== 0 || budget.delete !== 1) {
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
    block('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_DELETE_1_BLOCKED_TOKEN_EXPIRED');
  }

  const hashFields = ['rollback_approval_phrase_hash', 'target_payload_sha256', 'rollback_bundle_sha256'];
  for (const h of hashFields) {
    if (!is64CharHex(token[h])) {
      block(`Token hash field ${h} is invalid hex digest`);
    }
  }

  if (token.rollback_approval_phrase_hash !== EXPECTED_ROLLBACK_PHRASE_HASH) {
    block('Rollback approval phrase hash mismatch');
  }

  // 4. Initialize Firebase
  admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  // 5. Pre-check target existence
  const docRef = db.doc(token.target_path);
  const snap = await docRef.get();
  if (!snap.exists) {
    block('FUP_2C_VERIFY5_ROLLBACK_BLOCKED_TARGET_MISSING');
  }

  // 6. Verify target payload
  const data = snap.data();
  if (data.patch !== 'FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1') {
    block('Sandbox target patch ID mismatch');
  }
  if (data.mission_id !== 'jee_main_2026') {
    block('Sandbox target mission ID mismatch');
  }
  if (data.purpose !== 'authorization_sandbox_verification') {
    block('Sandbox target purpose mismatch');
  }
  if (data.academic_write !== false) {
    block('Sandbox target academic_write is not false');
  }
  if (data.student_visible !== false) {
    block('Sandbox target student_visible is not false');
  }
  if (data.created_by !== 'founder_authorized_second_gate') {
    block('Sandbox target created_by mismatch');
  }
  if (data.founder_approval_phrase_hash !== EXPECTED_WRITE_APPROVAL_HASH) {
    block('Sandbox target founder_approval_phrase_hash mismatch');
  }
  const targetBudget = data.mutation_budget_used || {};
  if (targetBudget.create !== 1 || targetBudget.update !== 0 || targetBudget.delete !== 0) {
    block('Sandbox target mutation budget used mismatch');
  }

  // 7. Perform sandbox delete
  try {
    await docRef.delete();
    console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_DELETE_SUCCESS');
  } catch (err) {
    block(`Firestore delete failed: ${err.message}`);
  }
}

main().catch(err => {
  console.error(err);
  console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_DELETE_BLOCKED');
  process.exit(1);
});
