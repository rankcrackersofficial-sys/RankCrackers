'use strict';

const fs = require('fs');
const path = require('path');
const { plan } = require('./materialization_engine.cjs');

const fixtureF = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/fixture_f_multi_paper_family.json'), 'utf8'));

const missionId = fixtureF.identity.missionId;
const targetPath = 'mission_realms/' + missionId + '/canonical_profile/current';

// Dry run against empty state (initial creation)
const stateEmpty = {
  [missionId]: {
    missionRealmExists: true,
    canonicalProfile: null
  }
};

const allowlist = {
  allowedMutations: [
    {
      path: targetPath,
      operation: 'CREATE'
    }
  ]
};

const dryRunPlan = plan(fixtureF, stateEmpty, allowlist);

const output = {
  gate: 'RC_CANONICAL_MISSION_PROFILE_MATERIALIZATION_ENGINE_46A6',
  executionMode: 'DRY_RUN_VALIDATION_ONLY',
  productionWritesAttempted: 0,
  isProductionWritePermitted: false,
  targetDocumentPath: dryRunPlan.targetDocumentPath,
  changeType: dryRunPlan.changeType,
  isNoOp: dryRunPlan.isNoOp,
  plannedWritesCount: dryRunPlan.plannedWritesCount,
  profileHash: dryRunPlan.profileHash,
  validationSummary: dryRunPlan.validationSummary,
  sourceEvidenceSummary: dryRunPlan.sourceEvidenceSummary,
  academicMetrics: dryRunPlan.academicMetrics,
  s2Readiness: dryRunPlan.s2Readiness,
  fieldDiffsCount: dryRunPlan.fieldDiffs.length,
  fieldDiffsSample: dryRunPlan.fieldDiffs.slice(0, 5)
};

const outPath = path.resolve(__dirname, '../../docs/academic_review/46a6_dry_run_example.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log('Successfully wrote docs/academic_review/46a6_dry_run_example.json');
