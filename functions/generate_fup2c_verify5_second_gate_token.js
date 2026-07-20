const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PHRASE_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_FOUNDER_APPROVAL_PHRASE.txt');
const TOKEN_OUT_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_LIVE_AUTH_SECOND_GATE_TOKEN.json');

const EXPECTED_PHRASE = "I, Founder of RankCrackers, authorize exactly one sandbox verification write to system_verification_sandbox/SANDBOX_TEST_DOC_001. I do not authorize syllabus_atoms writes. I do not authorize topic_nodes writes. I do not authorize student publish. I do not authorize Crucible or DigiBook generation. I do not authorize production academic mutation.";

function generate() {
  if (!fs.existsSync(PHRASE_PATH)) {
    console.error('Founder approval phrase file is missing.');
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_GENERATION_BLOCKED');
    process.exit(1);
  }

  let phraseContent;
  try {
    phraseContent = fs.readFileSync(PHRASE_PATH, 'utf8');
  } catch (err) {
    console.error('Error reading phrase file:', err.message);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_GENERATION_BLOCKED');
    process.exit(1);
  }

  const normalizedPhrase = phraseContent.replace(/\r\n/g, '\n').trim();

  if (normalizedPhrase !== EXPECTED_PHRASE) {
    console.error('Founder approval phrase mismatch/invalid.');
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_GENERATION_BLOCKED');
    process.exit(1);
  }

  const founder_approval_phrase_hash = crypto.createHash('sha256').update(EXPECTED_PHRASE).digest('hex');

  // Define verification payload
  const expiresAtMs = Date.now() + 30 * 60 * 1000; // 30 minutes in future
  const expires_at = new Date(expiresAtMs).toISOString();

  const intendedPayload = {
    verified_at: new Date().toISOString(),
    verification_status: "SUCCESS",
    verification_runner: "FUP-2C-VERIFY5",
    purpose: "sandbox verification create only"
  };

  // Bind Payload checksum
  const payloadBindStr = JSON.stringify({
    project_id: "rankcrackers-55",
    branch: "safety/rc-g2-pre-notification-schema",
    mission_id: "jee_main_2026",
    target_path: "system_verification_sandbox/SANDBOX_TEST_DOC_001",
    mutation_budget: { create: 1, update: 0, delete: 0 },
    payload: intendedPayload
  });
  const payload_sha256 = crypto.createHash('sha256').update(payloadBindStr).digest('hex');

  // Bind Rollback checksum
  const rollbackBindStr = JSON.stringify({
    target_path: "system_verification_sandbox/SANDBOX_TEST_DOC_001",
    mutation_budget_delete: 1,
    original_create_token_identity: payload_sha256
  });
  const rollback_sha256 = crypto.createHash('sha256').update(rollbackBindStr).digest('hex');

  // Bind Bundle checksum
  const bundleBindStr = JSON.stringify({
    founder_approval_phrase_hash: founder_approval_phrase_hash,
    payload_sha256: payload_sha256,
    rollback_sha256: rollback_sha256,
    expires_at: expires_at,
    one_time_use: true
  });
  const bundle_sha256 = crypto.createHash('sha256').update(bundleBindStr).digest('hex');

  const tokenObj = {
    patch: "FUP-2C-VERIFY5-LIVE-WRITE-SANDBOX-1",
    mission_id: "jee_main_2026",
    project_id: "rankcrackers-55",
    branch: "safety/rc-g2-pre-notification-schema",
    target_path: "system_verification_sandbox/SANDBOX_TEST_DOC_001",
    mutation_budget: {
      create: 1,
      update: 0,
      delete: 0
    },
    expires_at: expires_at,
    one_time_use: true,
    founder_approval_phrase_hash: founder_approval_phrase_hash,
    payload_sha256: payload_sha256,
    rollback_sha256: rollback_sha256,
    bundle_sha256: bundle_sha256
  };

  try {
    fs.writeFileSync(TOKEN_OUT_PATH, JSON.stringify(tokenObj, null, 2), 'utf8');
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_GENERATED');
  } catch (err) {
    console.error('Failed to write token file:', err.message);
    console.log('FUP_2C_VERIFY5_SECOND_GATE_TOKEN_GENERATION_BLOCKED');
    process.exit(1);
  }
}

generate();
