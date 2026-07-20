const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PHRASE_PATH = path.join(__dirname, '..', 'docs', 'patch_safety', 'FUP_2C_VERIFY5_FOUNDER_APPROVAL_PHRASE.txt');

const EXPECTED_PHRASE = "I, Founder of RankCrackers, authorize exactly one sandbox verification write to system_verification_sandbox/SANDBOX_TEST_DOC_001. I do not authorize syllabus_atoms writes. I do not authorize topic_nodes writes. I do not authorize student publish. I do not authorize Crucible or DigiBook generation. I do not authorize production academic mutation.";

function audit() {
  if (!fs.existsSync(PHRASE_PATH)) {
    console.log('FUP_2C_VERIFY5_FOUNDER_APPROVAL_PHRASE_MISSING');
    process.exit(1);
  }

  let content;
  try {
    content = fs.readFileSync(PHRASE_PATH, 'utf8');
  } catch (err) {
    console.error('Error reading phrase file:', err.message);
    console.log('FUP_2C_VERIFY5_FOUNDER_APPROVAL_PHRASE_MISSING');
    process.exit(1);
  }

  // Normalize line endings and trim whitespace
  const normalizedContent = content.replace(/\r\n/g, '\n').trim();

  if (normalizedContent !== EXPECTED_PHRASE) {
    console.error('Phrase mismatch!');
    console.error(`Expected: "${EXPECTED_PHRASE}"`);
    console.error(`Got     : "${normalizedContent}"`);
    console.log('FUP_2C_VERIFY5_FOUNDER_APPROVAL_PHRASE_INVALID');
    process.exit(1);
  }

  const hash = crypto.createHash('sha256').update(EXPECTED_PHRASE).digest('hex');
  console.log('FUP_2C_VERIFY5_FOUNDER_APPROVAL_PHRASE_VALID');
  console.log(`founder_approval_phrase_hash: ${hash}`);
}

audit();
