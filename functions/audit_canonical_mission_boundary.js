'use strict';

/**
 * Canonical mission boundary guard.
 *
 * A mission is one document under mission_realms/{missionId}. The old
 * recruitments and student_mission_catalog projections are retired. This
 * audit is deliberately source-based so a future worker cannot quietly
 * recreate them after a data reset.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const legacyFiles = [
  'functions/workers/recruitment_engine_worker.js',
  'functions/backfill_student_mission_catalog.js',
  'functions/apply_student_catalog_readiness.js',
  'functions/generic_authority_mission_materializer.js',
  'functions/audit_platform_boundary.js',
  'functions/tmp_seed_r4e_r3_student_mission_catalog_emulator.js',
  'assets/data/emulator/founder_mission_exact_production_inventory_20260811065513.json',
];

const runtimeFiles = [
  'functions/index.js',
  'functions/workers/promotion_worker.js',
  'functions/callable/handle_sentinel_action.js',
  'functions/services/mission_creation_fast_path.js',
  'lib/core/firebase/firestore_service.dart',
  'lib/core/backend/recruitment_repository.dart',
  'lib/features/auth/presentation/providers/mission_realm_provider.dart',
  'lib/web/founder/mission_control/founder_mission_inventory.dart',
  'lib/web/founder/mission_control/mission_control_room.dart',
  'lib/main_web.dart',
];

const forbiddenRuntimePatterns = [
  /\.collection\(['"]recruitments['"]\)/,
  /\.collection\(['"]student_mission_catalog['"]\)/,
  /recruitment_engine_worker/,
  /studentMissionCatalogCollection/,
  /streamStudentMissionCatalogRecruitments/,
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const failures = [];
for (const file of legacyFiles) {
  if (exists(file)) failures.push(`RETIRED_FILE_PRESENT:${file}`);
}

for (const file of runtimeFiles) {
  if (!exists(file)) {
    failures.push(`RUNTIME_FILE_MISSING:${file}`);
    continue;
  }
  const source = read(file);
  for (const pattern of forbiddenRuntimePatterns) {
    if (pattern.test(source)) failures.push(`LEGACY_RUNTIME_REFERENCE:${file}:${pattern}`);
  }
}

const materializer = read('functions/services/generic_mission_materializer.js');
if (!materializer.includes('LEGACY_MISSION_PROJECTION_PATH_RETIRED')) {
  failures.push('MATERIALIZER_NOT_FAIL_CLOSED');
}
if (!read('functions/services/mission_creation_fast_path.js').includes('canonicalOnly: true')) {
  failures.push('FAST_PATH_NOT_CANONICAL_ONLY');
}

const inventory = read('lib/web/founder/mission_control/founder_mission_inventory.dart');
if (!inventory.includes(".collection('mission_realms')")) {
  failures.push('FOUNDER_INVENTORY_NOT_MISSION_REALMS_BACKED');
}
if (!inventory.includes('MissionInventorySummary.fromRealms')) {
  failures.push('FOUNDER_INVENTORY_SUMMARY_NOT_DERIVED_FROM_SAME_SNAPSHOT');
}

const promotionWorker = read('functions/workers/promotion_worker.js');
if (!promotionWorker.includes("collection('mission_realms')")) {
  failures.push('PROMOTION_WORKER_NOT_CANONICAL_REALM_BOUND');
}

const verdict = failures.length === 0
  ? 'CANONICAL_MISSION_BOUNDARY_PASS'
  : 'CANONICAL_MISSION_BOUNDARY_BLOCKED';
const report = {
  canonicalCollection: 'mission_realms',
  retiredCollections: ['recruitments', 'student_mission_catalog'],
  legacyFiles,
  runtimeFiles,
  failures,
  verdict,
};
console.log(JSON.stringify(report, null, 2));
console.log(verdict);
if (failures.length) process.exit(1);
