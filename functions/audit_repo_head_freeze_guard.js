const cp = require('child_process');
const fs = require('fs');

const expectedHead = process.argv[2];
const expectedBranch = 'safety/rc-g2-pre-notification-schema';
const freezeMarkerPath = 'docs/patch_safety/FUP_2C_REPOGUARD4_NO_AUTONOMOUS_FREEZE.md';
const blockedPatterns = [
  /^docs\/patch_safety\/RC_X4E_P15_AUTH_TOKEN_3_/,
  /^docs\/patch_safety\/RC_X4E_P15_AUTH_APPLY_2_/,
  /^functions\/apply_rc_x4e_p15_/,
  /^functions\/audit_rc_x4e_p15_/,
  /RC_X4E_R14/i,
  /IR4/i
];

function execGit(args) {
  return cp.execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function stagedFiles() {
  const out = execGit(['diff', '--cached', '--name-only']);
  return out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => line.replace(/\\/g, '/'));
}

function main() {
  if (!expectedHead) {
    console.error('Usage: node functions/audit_repo_head_freeze_guard.js <expectedHead>');
    process.exit(1);
  }
  const currentHead = execGit(['rev-parse', 'HEAD']);
  const branch = execGit(['branch', '--show-current']);
  const staged = stagedFiles();
  const blockedStagedFiles = staged.filter((file) => blockedPatterns.some((pattern) => pattern.test(file)));
  const freezeMarker = fs.existsSync(freezeMarkerPath);
  const headStable = currentHead === expectedHead;
  let verdict = 'REPO_HEAD_FREEZE_PASS';
  if (!headStable || branch !== expectedBranch) verdict = 'REPO_HEAD_FREEZE_BLOCKED_HEAD_SHIFT';
  else if (blockedStagedFiles.length) verdict = 'REPO_HEAD_FREEZE_BLOCKED_STAGED_FILES';
  else if (!freezeMarker) verdict = 'REPO_HEAD_FREEZE_BLOCKED_MISSING_MARKER';
  const report = { expectedHead, currentHead, branch, headStable, stagedFiles: staged, blockedStagedFiles, freezeMarker, verdict };
  console.log(JSON.stringify(report, null, 2));
  console.log(verdict);
  if (verdict !== 'REPO_HEAD_FREEZE_PASS') process.exit(1);
}

main();
