const cp = require('child_process');

const blockedPatterns = [
  /^docs\/patch_safety\/RC_X4E_P15_AUTH_TOKEN_3_/,
  /^docs\/patch_safety\/RC_X4E_P15_AUTH_APPLY_2_/,
  /^docs\/patch_safety\/RC_X4E_P15_AUTH_APPLY_3_/,
  /^functions\/apply_rc_x4e_p15_/,
  /^functions\/audit_rc_x4e_p15_/,
  /RC_X4E_R14/i,
  /IR4/i,
  /unrelated_validation_generated\.json$/i,
  /^functions\/(backfill_student_mission_catalog|apply_student_catalog_readiness|generic_authority_mission_materializer)\.js$/,
  /^functions\/workers\/recruitment_engine_worker\.js$/,
  /^functions\/(audit_mission_catalog_shell_contract|audit_mission_mirror_current_flow|audit_rankcrackers_path_and_rules|audit_platform_boundary|test_mission_mirror|test_unified_mission_create_publish_integration_b5)\.js$/,
  /^functions\/tmp_seed_r4e_r3_student_mission_catalog_emulator\.js$/,
  /^assets\/data\/emulator\/founder_mission_exact_production_inventory_20260811065513\.json$/
];

const allowedPatterns = [
  /^functions\/audit_repo_staged_state_guard\.js$/,
  /^functions\/audit_repo_head_freeze_guard\.js$/,
  /^functions\/callable\/handle_sentinel_action\.js$/,
  /^docs\/patch_safety\/FUP_2C_REPOGUARD4_/,
  /^docs\/patch_safety\/FUP_2C_REPOLOCK3_/,
  /^docs\/patch_safety\/FUP_2C_MIRROR2_/,
  /^docs\/patch_safety\/FUP_2C_REPOGUARD1_FIX4_/,
  /^docs\/syllabus\/FUP_2C_REPOGUARD4_HEAD_FREEZE_AND_AUTONOMOUS_NEUTRALIZATION\.md$/,
  /^docs\/syllabus\/FUP_2C_REPOLOCK3_ACCEPTED_GUARD_RESTORE\.md$/,
  /^docs\/syllabus\/FUP_2C_MIRROR2_SAFE_STUDENT_CATALOG_SHELL_BACKEND_FIX\.md$/,
  /^package\.json$/,
  /^firebase\.json$/,
  /^firestore\.rules$/,
  /^lib\/core\/firebase\/firestore_service\.dart$/,
  /^functions\/audit_canonical_mission_boundary\.js$/
];

function stagedFiles() {
  const out = cp.execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' });
  return out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => line.replace(/\\/g, '/'));
}

function main() {
  const staged = stagedFiles();
  const blockedStagedFiles = staged.filter((file) => blockedPatterns.some((pattern) => pattern.test(file)));
  const unscopedStagedFiles = staged.filter((file) => !allowedPatterns.some((pattern) => pattern.test(file)));
  const packageJsonConflict = staged.includes('package.json') && blockedStagedFiles.length > 0;
  const allowedStagedFiles = staged.filter((file) => allowedPatterns.some((pattern) => pattern.test(file)) && !blockedStagedFiles.includes(file));
  let verdict = 'REPO_STAGED_STATE_PASS';
  if (packageJsonConflict) verdict = 'REPO_STAGED_STATE_BLOCKED_PACKAGE_JSON_CONFLICT';
  else if (blockedStagedFiles.length || unscopedStagedFiles.length) verdict = 'REPO_STAGED_STATE_BLOCKED_UNRELATED_STAGED_FILES';
  const report = { stagedFiles: staged, allowedStagedFiles, blockedStagedFiles, unscopedStagedFiles, packageJsonConflict, verdict };
  console.log(JSON.stringify(report, null, 2));
  console.log(verdict);
  if (verdict !== 'REPO_STAGED_STATE_PASS') process.exit(1);
}

main();
