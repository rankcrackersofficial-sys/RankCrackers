const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PHRASE_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_SANDBOX_ROLLBACK_APPROVAL_PHRASE.txt');

const EXPECTED_PHRASE = "I, Founder of RankCrackers, authorize exactly one sandbox verification delete at system_verification_sandbox/SANDBOX_TEST_DOC_001. I do not authorize syllabus_atoms writes or deletes. I do not authorize topic_nodes writes or deletes. I do not authorize page_extractions writes or deletes. I do not authorize student publish. I do not authorize Crucible or DigiBook generation. I do not authorize production academic mutation.";

function main() {
  if (!fs.existsSync(PHRASE_PATH)) {
    console.error('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_APPROVAL_PHRASE_MISSING');
    process.exit(1);
  }

  try {
    const text = fs.readFileSync(PHRASE_PATH, 'utf8').replace(/\r\n/g, '\n').trim();
    if (text !== EXPECTED_PHRASE) {
      console.error('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_APPROVAL_PHRASE_INVALID');
      process.exit(1);
    }

    const hash = crypto.createHash('sha256').update(EXPECTED_PHRASE).digest('hex');
    console.log('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_APPROVAL_PHRASE_VALID');
    console.log(`rollback_approval_phrase_hash: ${hash}`);
  } catch (err) {
    console.error('FUP_2C_VERIFY5_SANDBOX_ROLLBACK_APPROVAL_PHRASE_INVALID');
    process.exit(1);
  }
}

main();
