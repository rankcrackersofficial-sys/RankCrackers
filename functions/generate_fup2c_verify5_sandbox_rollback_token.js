const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ID = 'rankcrackers-55';
const EXPECTED_BRANCH = 'safety/rc-g2-pre-notification-schema';
const PHRASE_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_SANDBOX_ROLLBACK_APPROVAL_PHRASE.txt');
const TOKEN_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN.json');

const EXPECTED_PHRASE = "I, Founder of RankCrackers, authorize exactly one sandbox verification delete at system_verification_sandbox/SANDBOX_TEST_DOC_001. I do not authorize syllabus_atoms writes or deletes. I do not authorize topic_nodes writes or deletes. I do not authorize page_extractions writes or deletes. I do not authorize student publish. I do not authorize Crucible or DigiBook generation. I do not authorize production academic mutation.";

function block(reason) {
  console.error(`BLOCKED: ${reason}`);
  console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN_GENERATION_BLOCKED');
  process.exit(1);
}

function main() {
  if (!fs.existsSync(PHRASE_PATH)) {
    block('Rollback phrase file does not exist');
  }

  const phraseText = fs.readFileSync(PHRASE_PATH, 'utf8').replace(/\r\n/g, '\n').trim();
  if (phraseText !== EXPECTED_PHRASE) {
    block('Rollback phrase mismatch');
  }

  const phraseHash = crypto.createHash('sha256').update(EXPECTED_PHRASE).digest('hex');

  // Calculate target payload SHA256 of stable target path as identity
  const targetPath = 'system_verification_sandbox/SANDBOX_TEST_DOC_001';
  const targetPayloadHash = crypto.createHash('sha256').update(targetPath).digest('hex');

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes in future

  // Calculate rollback bundle SHA256 binding the token parameters
  const bundlePayload = [
    phraseHash,
    targetPayloadHash,
    expiresAt,
    'true',
    targetPath
  ].join('|');
  const bundleHash = crypto.createHash('sha256').update(bundlePayload).digest('hex');

  const token = {
    patch: "FUP-2C-VERIFY5-SANDBOX-ROLLBACK-DELETE-1",
    project_id: PROJECT_ID,
    branch: EXPECTED_BRANCH,
    target_path: targetPath,
    mutation_budget: {
      create: 0,
      update: 0,
      delete: 1
    },
    expires_at: expiresAt,
    one_time_use: true,
    rollback_approval_phrase_hash: phraseHash,
    target_payload_sha256: targetPayloadHash,
    rollback_bundle_sha256: bundleHash
  };

  try {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), 'utf8');
    console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_TOKEN_GENERATED');
  } catch (err) {
    block(`Failed to write token file: ${err.message}`);
  }
}

main();
