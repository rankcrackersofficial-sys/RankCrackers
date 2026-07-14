const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const policyPath = path.join(__dirname, 'helpers', 'workerTrainingPolicy.js');
const docPath = path.join(ROOT, 'docs', 'worker_training', 'RC_WORKER_TRAINING_1_POLICY.md');

function fail(message) {
  console.error('RC_WORKER_TRAINING_1_POLICY_BLOCKED');
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(policyPath)) fail('workerTrainingPolicy.js missing');
if (!fs.existsSync(docPath)) fail('RC_WORKER_TRAINING_1_POLICY.md missing');

const policy = require(policyPath);
const requiredModes = ['SAFE_AUTO', 'MANUAL_DEBUG', 'RETRY_FAILED', 'PRO_VERIFY', 'DISABLED'];
const modes = policy.WORKER_MODES || {};
for (const mode of requiredModes) {
  if (modes[mode] !== mode) fail(`Missing worker mode: ${mode}`);
}

if (policy.DEFAULT_WORKER_MODE === modes.SAFE_AUTO) fail('SAFE_AUTO must not be default enabled in RC-WORKER-TRAINING-1');
if (![modes.MANUAL_DEBUG, modes.DISABLED].includes(policy.DEFAULT_WORKER_MODE)) fail('Default mode must be MANUAL_DEBUG or DISABLED');

const autoDetect = policy.AUTO_DETECT_POLICY || {};
if (autoDetect.DEFAULT_ALLOWED !== false) fail('AUTO_DETECT default allowed must be false');
if (autoDetect.REQUIRES_SEPARATE_APPROVAL !== true) fail('AUTO_DETECT must require separate approval');
if (autoDetect.NEVER_MIX_WITH_NORMAL_BATCH !== true) fail('AUTO_DETECT must never mix with normal batch');
if (autoDetect.MUST_HAVE_EXPLICIT_AUDIT !== true) fail('AUTO_DETECT must require explicit audit');

const batch = policy.BATCH_POLICY || {};
if (batch.MANUAL_DEBUG_LIMIT !== 3) fail('Manual debug limit must be 3');
if (batch.SAFE_AUTO_INITIAL_LIMIT !== 3) fail('SAFE_AUTO initial limit must be 3');
if (batch.MAX_RETRY_ATTEMPTS !== 2) fail('Max retry attempts must be 2');
if (batch.REQUIRE_READINESS_AUDIT !== true) fail('Readiness audit must be required');
if (batch.REQUIRE_POST_RUN_AUDIT !== true) fail('Post-run audit must be required');

const safety = policy.SAFETY_REQUIREMENTS || {};
const safetyChecks = [
  'duplicatePageCheckRequired',
  'sourceProofRequired',
  'reviewLockRequired',
  'emptyTextDetectionRequired',
  'parentSideEffectBlockRequired',
  'studentDeliveryBlockRequired',
  'baselineDriftDetectionRequired',
  'founderApprovalRequiredForPublish'
];
for (const key of safetyChecks) {
  if (safety[key] !== true) fail(`${key} must be true`);
}

const pro = policy.PRO_VERIFICATION_POLICY || {};
const categories = pro.mandatoryCategories || [];
for (const category of ['syllabus', 'PYQ', 'notification', 'answer_key', 'cutoff', 'result', 'exam_rules']) {
  if (!categories.includes(category)) fail(`Pro verification category missing: ${category}`);
}
if (pro.canBlock !== true) fail('Pro verifier must be able to block');
if (pro.canPublish !== false) fail('Pro verifier must not publish');
if (pro.founderFinalApprovalRequired !== true) fail('Founder final approval must be required');

console.log('Worker modes:', requiredModes.join(', '));
console.log('Default mode:', policy.DEFAULT_WORKER_MODE);
console.log('AUTO_DETECT default allowed:', autoDetect.DEFAULT_ALLOWED);
console.log('Manual debug limit:', batch.MANUAL_DEBUG_LIMIT);
console.log('SAFE_AUTO initial limit:', batch.SAFE_AUTO_INITIAL_LIMIT);
console.log('Mandatory Pro verification categories:', categories.join(', '));
console.log('RC_WORKER_TRAINING_1_POLICY_READY');