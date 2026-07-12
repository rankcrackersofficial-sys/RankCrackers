const fs = require('fs');
const path = require('path');

const OFFICIAL_PATH = 'C:\\RankCrackers\\RankCrackers-55';
const ROOT = process.cwd();

function normalizePath(value) {
  return path.resolve(value).replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel) {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

function listFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['.git', '.dart_tool', 'build', 'node_modules', '.firebase', '.npm-cache'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(full, out);
    } else if (/\.(js|json|dart|md|yaml|yml|html|txt|xml|kts)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function assertContains(errors, label, content, needle) {
  if (!content.includes(needle)) errors.push(`${label} must include: ${needle}`);
}

function main() {
  console.log('==============================================');
  console.log('RANKCRACKERS PATH & FINAL RULES GUARD');
  console.log('==============================================');
  console.log(`Current working path: ${ROOT}`);
  console.log(`Official working path: ${OFFICIAL_PATH}`);

  const blockers = [];
  const warnings = [];

  if (normalizePath(ROOT) !== normalizePath(OFFICIAL_PATH)) {
    console.error('BLOCKED_WRONG_PROJECT_PATH');
    blockers.push(`Expected cwd ${OFFICIAL_PATH}, got ${ROOT}`);
  }

  if (normalizePath(ROOT).includes('vesta')) blockers.push('Current path contains VESTA.');
  if (normalizePath(ROOT).includes('city')) blockers.push('Current path contains city.');

  for (const rel of ['pubspec.yaml', 'firebase.json', 'package.json', 'lib/main.dart', 'lib/main_web.dart']) {
    if (!exists(rel)) blockers.push(`Missing project identity file: ${rel}`);
  }

  const packageJsonText = read('package.json');
  let packageJson = {};
  try {
    packageJson = packageJsonText ? JSON.parse(packageJsonText.charCodeAt(0) === 0xFEFF ? packageJsonText.slice(1) : packageJsonText) : {};
  } catch (e) {
    blockers.push(`package.json is not valid JSON: ${e.message}`);
  }
  const scripts = packageJson.scripts || {};
  if (!scripts['build:web:founder']) blockers.push('package.json missing build:web:founder script.');
  if (!scripts['deploy:web:founder']) blockers.push('package.json missing deploy:web:founder script.');
  if (scripts['build:web:founder']) {
    assertContains(blockers, 'build:web:founder', scripts['build:web:founder'], 'flutter build web -t lib/main_web.dart --release');
  }
  if (scripts['deploy:web:founder']) {
    const deploy = scripts['deploy:web:founder'];
    if (deploy.includes('flutter build web') && !deploy.includes('-t lib/main_web.dart')) {
      blockers.push('deploy:web:founder uses default flutter build web without lib/main_web.dart target.');
    }
  }

  const mainWeb = read('lib/main_web.dart');
  if (!mainWeb.includes('WebShell') && !mainWeb.includes('UnifiedCommandConsole')) {
    blockers.push('lib/main_web.dart must load WebShell or UnifiedCommandConsole.');
  }
  if (/AdminScreen\s*\(/.test(mainWeb)) {
    blockers.push('lib/main_web.dart must not use mobile AdminScreen as main entry.');
  }

  if (exists('lib/features/admin/presentation/screens/admin_screen.dart')) {
    blockers.push('Mobile admin_screen.dart must be absent.');
  }
  const appRouter = read('lib/core/router/app_router.dart');
  const hasActiveAdminRedirect = appRouter.includes('return AppRoutes.admin;') && !appRouter.match(/\/\*\s*[\s\S]*?return AppRoutes\.admin;[\s\S]*?\*\//);
  if (hasActiveAdminRedirect) {
    blockers.push('app_router.dart must not redirect founder/admin claims to mobile admin panel.');
  }
  if (!/Access Denied|Mobile Admin Console is disabled|admin.*disabled/i.test(appRouter)) {
    blockers.push('/admin mobile route must be blocked or Access Denied.');
  }

  const firestoreService = read('lib/core/firebase/firestore_service.dart');
  if (!firestoreService.includes('student_mission_catalog')) {
    blockers.push('student_mission_catalog query missing from firestore_service.dart.');
  }
  const createMissionDialog = read('lib/web/founder/mission_control/create_mission_dialog.dart');
  if (!createMissionDialog.includes('student_mission_catalog')) {
    blockers.push('create_mission_dialog.dart must mirror to student_mission_catalog.');
  }
  const editMissionDialog = read('lib/web/founder/mission_control/edit_mission_dialog.dart');
  if (!editMissionDialog.includes('student_mission_catalog')) {
    blockers.push('edit_mission_dialog.dart must mirror to student_mission_catalog.');
  }

  if (!exists('docs/RANKCRACKERS_FINAL_OPERATION_RULES.md')) {
    blockers.push('Missing docs/RANKCRACKERS_FINAL_OPERATION_RULES.md.');
  }
  if (!exists('functions/extraction_policy.js')) {
    blockers.push('MISSING_EXTRACTION_POLICY');
  } else {
    const policy = read('functions/extraction_policy.js');
    for (const needle of ['PAGE_BATCH_SIZE_DEFAULT', 'MAX_PAGES_PER_TASK', 'MAX_RETRY_PER_BATCH', "PRIMARY_EXTRACTION_LANGUAGE = 'en'"]) {
      assertContains(blockers, 'functions/extraction_policy.js', policy, needle);
    }
  }

  const notificationSchemaPresent = exists('functions/notification_schemas') || exists('functions/schemas/notification');
  if (!notificationSchemaPresent) {
    blockers.push('MISSING_NOTIFICATION_DYNAMIC_SCHEMA_SYSTEM');
  }
  if (!exists('functions/audit_notification_schema_system.js')) {
    blockers.push('Missing audit_notification_schema_system.js.');
  }
  if (!exists('functions/audit_notification_extraction_contract.js')) {
    blockers.push('Missing audit_notification_extraction_contract.js.');
  }
  if (!exists('functions/audit_notification_source_readiness.js')) {
    blockers.push('Missing audit_notification_source_readiness.js.');
  }
  if (!exists('functions/plan_notification_pagewise_batch_queue.js')) {
    blockers.push('Missing plan_notification_pagewise_batch_queue.js.');
  }
  if (!exists('functions/apply_notification_page_count_queue.js')) {
    blockers.push('Missing apply_notification_page_count_queue.js.');
  }
  if (!exists('functions/notification_schemas/notification_extraction_contract.js')) {
    blockers.push('Missing notification_extraction_contract.js.');
  }
  if (!exists('functions/notification_schemas/notification_form_draft_builder.js')) {
    blockers.push('Missing notification_form_draft_builder.js.');
  }

  if (!exists('functions/audit_s1_rpsc_syllabus_extraction_pipeline.js')) {
    blockers.push('Missing audit_s1_rpsc_syllabus_extraction_pipeline.js.');
  }
  if (!exists('functions/audit_universal_extraction_completeness.js')) {
    blockers.push('MISSING_UNIVERSAL_EXTRACTION_AUDIT');
  }
  if (!exists('functions/audit_universal_official_document_page_completeness.js')) {
    blockers.push('Missing audit_universal_official_document_page_completeness.js.');
  }
  if (!exists('functions/audit_atomic_linkage_integrity.js')) {
    blockers.push('Missing audit_atomic_linkage_integrity.js.');
  }
  if (!exists('functions/apply_universal_page_count_queue.js')) {
    blockers.push('Missing apply_universal_page_count_queue.js.');
  }
  if (!exists('functions/audit_page_count_queue_state.js')) {
    blockers.push('Missing audit_page_count_queue_state.js.');
  }
  if (!exists('functions/plan_official_document_metadata_repair.js')) {
    blockers.push('Missing plan_official_document_metadata_repair.js.');
  }
  if (!exists('functions/apply_official_document_metadata_repair.js')) {
    blockers.push('Missing apply_official_document_metadata_repair.js.');
  }
  if (!exists('functions/apply_repaired_docs_page_count_queue.js')) {
    blockers.push('Missing apply_repaired_docs_page_count_queue.js.');
  }
  if (!exists('functions/process_page_count_detection_tasks.js')) {
    blockers.push('Missing process_page_count_detection_tasks.js.');
  }
  if (!exists('functions/audit_page_count_worker_capability.js')) {
    blockers.push('Missing audit_page_count_worker_capability.js.');
  }

  const filesToScan = [
    ...listFiles(path.join(ROOT, 'functions')),
    ...listFiles(path.join(ROOT, 'lib')),
    ...listFiles(path.join(ROOT, 'docs')),
    path.join(ROOT, 'package.json'),
    path.join(ROOT, 'firebase.json'),
  ].filter((file, index, arr) => arr.indexOf(file) === index && fs.existsSync(file));

  const vestaRefs = [];
  for (const file of filesToScan) {
    const content = fs.readFileSync(file, 'utf8');
    if (/G:\\VESTA/i.test(content)) vestaRefs.push(path.relative(ROOT, file));
  }
  if (vestaRefs.length > 0) blockers.push(`VESTA references found: ${vestaRefs.join(', ')}`);

  console.log('\nGuard results:');
  console.log(`- Official path locked: ${normalizePath(ROOT) === normalizePath(OFFICIAL_PATH) ? 'YES' : 'NO'}`);
  console.log(`- Web build rule guarded: ${scripts['build:web:founder'] ? 'YES' : 'NO'}`);
  console.log(`- Android Student/User-only guard checked: YES`);
  console.log(`- M4/M6 catalog bridge guard checked: YES`);
  console.log(`- Extraction policy documented: ${exists('docs/RANKCRACKERS_FINAL_OPERATION_RULES.md') ? 'YES' : 'NO'}`);
  console.log(`- Universal extraction audit exists: ${exists('functions/audit_universal_extraction_completeness.js') ? 'YES' : 'NO'}`);
  console.log(`- Universal page completeness audit exists: ${exists('functions/audit_universal_official_document_page_completeness.js') ? 'YES' : 'NO'}`);
  console.log(`- Atomic linkage integrity audit exists: ${exists('functions/audit_atomic_linkage_integrity.js') ? 'YES' : 'NO'}`);
  console.log(`- Universal page count queue apply script: ${exists('functions/apply_universal_page_count_queue.js') ? 'PRESENT' : 'MISSING'}`);
  console.log(`- Page count queue state audit exists: ${exists('functions/audit_page_count_queue_state.js') ? 'YES' : 'NO'}`);
  console.log(`- Metadata repair planner exists: ${exists('functions/plan_official_document_metadata_repair.js') ? 'YES' : 'NO'}`);
  console.log(`- Metadata repair apply script exists: ${exists('functions/apply_official_document_metadata_repair.js') ? 'YES' : 'NO'}`);
  console.log(`- Repaired docs page count queue apply script: ${exists('functions/apply_repaired_docs_page_count_queue.js') ? 'PRESENT' : 'MISSING'}`);
  console.log(`- Page count detection worker exists: ${exists('functions/process_page_count_detection_tasks.js') ? 'YES' : 'NO'}`);
  console.log(`- Page count worker capability audit exists: ${exists('functions/audit_page_count_worker_capability.js') ? 'YES' : 'NO'}`);
  console.log(`- Notification dynamic schema system: ${warnings.includes('MISSING_NOTIFICATION_DYNAMIC_SCHEMA_SYSTEM') ? 'MISSING' : 'PRESENT'}`);
  console.log(`- Notification page count queue apply script: ${exists('functions/apply_notification_page_count_queue.js') ? 'PRESENT' : 'MISSING'}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (blockers.length > 0) {
    console.error('\nRC_G0_BLOCKED');
    blockers.forEach(blocker => console.error(`- ${blocker}`));
    process.exit(1);
  }

  console.log('\nRC_G0_PATH_AND_RULES_GUARD_PASSED');
}

main();










