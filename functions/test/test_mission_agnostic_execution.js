'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { classifyRouting } = require('../services/routing_classifier');
const { correctScientificText } = require('../services/scientific_corrector');
const { GenericB3Worker } = require('../lib/workers/genericB3Worker');

const ROOT = path.resolve(__dirname, '../..');
const legacyExecutors = [
  'functions/materialize_neet_full.js',
  'functions/materialize_neet_full_v3.js',
  'functions/materialize_neet_syllabus_final.js',
  'functions/materialize_neet_syllabus_v2.js',
  'tools/academic_factory/generate_neet_slice.js',
  'tools/academic_factory/quarantine_neet_slice.js',
  'tools/academic_factory/seed_jee_state.js',
  'functions/check_neet_draft.js',
  'functions/get_neet_docs.js',
  'functions/get_neet_tasks.js',
  'functions/read_neet_123.js',
  'functions/search_neet_atoms.js',
  'functions/find_3_jee_p15_tasks.js',
];

test('historical NEET/JEE materializers and seeding scripts fail before Firebase is loaded', () => {
  for (const filename of legacyExecutors) {
    const absolute = path.resolve(ROOT, filename);
    const source = fs.readFileSync(absolute, 'utf8');
    const guard = source.indexOf('rejectLegacyMissionSpecificExecution(');
    const adminImport = source.indexOf("require('firebase-admin')");
    assert.ok(guard >= 0, filename + ' must explicitly reject execution');
    assert.ok(adminImport < 0 || guard < adminImport, filename + ' must reject before initializing Firebase');
    const child = spawnSync(process.execPath, [absolute, '--apply'], {
      encoding: 'utf8',
      timeout: 4000,
      cwd: ROOT,
      env: { ...process.env, FIRESTORE_EMULATOR_HOST: '', GOOGLE_APPLICATION_CREDENTIALS: '',
        RUN_ON_PROD: 'true' },
    });
    assert.notEqual(child.status, 0, filename + ' must not be runnable');
    if (filename === 'functions/materialize_neet_full_v3.js') {
      // This preserved historical data fragment was already syntactically
      // incomplete before retirement. Node rejects parsing it before any
      // Firebase side effect. Keep archival bytes rather than invent a close.
      assert.match(String(child.stderr),
        /MISSION_AGNOSTIC_LEGACY_EXECUTOR_RETIRED|SyntaxError: Unexpected end of input/, filename);
    } else {
      assert.match(String(child.stderr), /MISSION_AGNOSTIC_LEGACY_EXECUTOR_RETIRED/, filename);
    }
  }
});

test('obsolete founder-upload trigger cannot fabricate NEET atoms or export a Firebase trigger', () => {
  const trigger = fs.readFileSync(path.resolve(ROOT, 'functions/src/workers/ingestionTrigger.ts'), 'utf8');
  const index = fs.readFileSync(path.resolve(ROOT, 'functions/src/index.ts'), 'utf8');
  assert.doesNotMatch(trigger, /functions\.firestore|neet_conveyor_run_ff03|realSyllabusAtoms|syllabus_atoms.*set/);
  assert.doesNotMatch(index, /export\s*\{\s*ingestionTrigger\s*\}/);
});

test('retired JEE hierarchy mutator has no direct Student/catalog or Firestore side effects', () => {
  const source = fs.readFileSync(path.resolve(ROOT, 'functions/src/test/fix_jee_hierarchy_data.ts'), 'utf8');
  assert.match(source, /LEGACY_JEE_HIERARCHY_MUTATOR_RETIRED/);
  assert.doesNotMatch(source, /admin\.firestore\(|batch\.delete|\.update\(|\.commit\(|run\(\)\.catch/);
});

test('PDF routing uses identical classification rules irrespective of exam or authority', () => {
  const body = 'The official notification details procedures, examination scope, official instructions, evidence and verification requirements. ';
  for (const header of ['National Testing Agency', 'SSC CGL', 'NEET (UG) 2027', 'RPSC First Grade']) {
    assert.equal(classifyRouting(1, header + '\n' + body, 3), 'NATIVE');
  }
  assert.equal(classifyRouting(1, 'Page 1 of 3', 3), 'SCANNED');
  assert.equal(classifyRouting(1, '', 3), 'SCANNED');
  assert.equal(classifyRouting(1, 'SUBJECT: History', 3), 'AMBIGUOUS');
  assert.equal(classifyRouting(1, body, 0), 'INVALID');
});

test('scientific transcription never rewrites any mission without Founder-reviewed evidence', async () => {
  for (const pageNumber of [1, 71, 72, 73, 75, 76, 78, 120]) {
    const raw = 'AG, Cl, Biology C3 and Physical Chemistry';
    const result = await correctScientificText(raw, pageNumber);
    assert.equal(result.correctedText, raw);
    assert.deepEqual(result.corrections, []);
    assert.equal(result.correctionState, 'UNMODIFIED_AWAITING_FOUNDER_REVIEW');
  }
});

function b3Input(missionId, authorizedSubjects = ['Philosophy']) {
  return {
    missionId,
    documentId: 'hash_' + 'b'.repeat(64),
    sourceSha256: 'b'.repeat(64),
    sourceVersionId: 'source-version-1',
    verifiedPageCorpus: [{ pageNumber: 1, text: 'SUBJECT: Philosophy\nUNIT: Logic\nTOPIC: Reasoning', isVerified: true, pageDigest: 'c'.repeat(64) }],
    authorizedScope: { papersEnabled: false, allowedSubjects: authorizedSubjects },
    documentType: 'syllabus',
    runId: 'generic_test',
  };
}

test('B3 uses the same authorized subjects for every mission ID, including unknown missions', async () => {
  const worker = new GenericB3Worker();
  for (const missionId of ['neet_(ug)-2027', 'jee_main_2026', 'ssc_cgl', 'new_unseen_exam']) {
    const nodes = await worker.materializeSyllabusStructure(b3Input(missionId));
    assert.ok(nodes.some(node => node.nodeType === 'subject' && node.subjectId === 'Philosophy'));
    assert.ok(nodes.every(node => node.missionId === missionId));
  }
});

test('B3 missing subjects and unapproved aliases fail closed rather than choosing JEE defaults', async () => {
  const worker = new GenericB3Worker();
  await assert.rejects(() => worker.materializeSyllabusStructure(b3Input('new_exam', [])),
    /B3_REJECT: authorized subjects required/);
  await assert.rejects(() => worker.materializeSyllabusStructure(b3Input('new_exam', ['Mathematics'])),
    /B3_REJECT: unauthorized subject/);
});


test('historical pilot rulebook adapters have no live examination-specific dispatch path', () => {
  const pilot = require('../services/real_source_adapter');
  const productionLike = [
    () => pilot.adapt48CS4PilotToRulebookPackage('NEET-UG-2026-EVIDENCE-BASE'),
    () => pilot.adapt48CS5PilotToRulebookPackage('jee_main_2026'),
    () => pilot.buildAllSixPilotPackages(),
    () => pilot.buildAll48CS5PilotPackages(),
  ];
  for (const execute of productionLike) {
    assert.throws(execute, /MISSION_AGNOSTIC_HARDCODED_PILOT_ADAPTER_RETIRED/);
  }
});

test('force pipeline runner never exports a particular examination as fallback identity', () => {
  const runner = require('../services/mission_force_pipeline_runner');
  assert.equal(Object.prototype.hasOwnProperty.call(runner, 'SSC_CGL'), false);
  assert.throws(() => runner.buildRunnerRequest({}), /FORCE_PIPELINE_MISSION_REQUIRED/);
});


test('B3 subject aliases never authorize undeclared curricula', async () => {
  const worker = new GenericB3Worker();
  const spoofed = b3Input('unseen_mission', ['Philosophy']);
  spoofed.authorizedScope.subjectAliases = { Philosophy: 'Physics' };
  await assert.rejects(() => worker.materializeSyllabusStructure(spoofed), /B3_REJECT: unauthorized subject/);

  const verified = b3Input('unseen_mission', ['Physics']);
  verified.authorizedScope.subjectAliases = { Philosophy: 'Physics' };
  const rows = await worker.materializeSyllabusStructure(verified);
  assert.ok(rows.some(row => row.nodeType === 'subject' && row.subjectId === 'Physics'));

  const missing = b3Input('unseen_mission');
  delete missing.authorizedScope;
  await assert.rejects(() => worker.materializeSyllabusStructure(missing),
    /B3_REJECT: authorized scope required/);
});
