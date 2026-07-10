const fs = require('fs');
const path = require('path');
const { BASE_NOTIFICATION_SCHEMA, validateSourceProofRequirement } = require('./notification_schemas/base_notification_schema');
const { EXAM_ARCHETYPE_SCHEMAS } = require('./notification_schemas/exam_archetype_schemas');
const { VARIABLE_PACKS, validateVariablePacks } = require('./notification_schemas/variable_packs');
const { selectNotificationSchema } = require('./notification_schemas/schema_selector');

const ROOT = path.join(__dirname, '..');
const SCHEMA_DIR = path.join(__dirname, 'notification_schemas');

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function archetypeFieldBlockers() {
  const blockers = [];
  for (const [archetype, schema] of Object.entries(EXAM_ARCHETYPE_SCHEMAS)) {
    for (const section of schema.sections || []) {
      for (const field of section.fields || []) {
        if (field.source_proof_required !== true) blockers.push(`${archetype}.${section.name}.${field.field_key} missing source_proof_required: true`);
        if (!Array.isArray(field.verification_action) || !['approve', 'edit', 'send_back'].every(action => field.verification_action.includes(action))) {
          blockers.push(`${archetype}.${section.name}.${field.field_key} missing verification actions`);
        }
      }
    }
  }
  return blockers;
}

function runSelectorSamples() {
  const samples = [
    {
      name: 'JEE Main notification',
      expected: 'entrance_exam_single',
      input: { exam_name: 'JEE Main 2026', authority: 'NTA Engineering', document_type: 'notification', detected_keywords: ['joint entrance'] },
    },
    {
      name: 'NEET UG notification',
      expected: 'entrance_exam_single',
      input: { exam_name: 'NEET UG 2027', authority: 'NTA Medical', document_type: 'notification', detected_keywords: ['medical entrance'] },
    },
    {
      name: 'RPSC 1st Grade single recruitment',
      expected: 'recruitment_single_exam',
      input: { exam_name: 'RPSC 1st Grade', authority: 'RPSC', document_type: 'notification', detected_keywords: ['single recruitment', 'post'] },
    },
    {
      name: 'RPSC variable-heavy recruitment',
      expected: 'recruitment_variable_heavy',
      input: { exam_name: 'RPSC 1st Grade', authority: 'RPSC', document_type: 'notification', detected_keywords: ['subject-wise', 'department-wise', 'category breakup'] },
    },
    {
      name: 'RPSC amendment notice',
      expected: 'amendment_notice',
      input: { exam_name: 'RPSC 1st Grade', authority: 'RPSC', document_type: 'amendment', detected_keywords: ['correction'] },
    },
    {
      name: 'RPSC result/cutoff/answer key notice',
      expected: 'result_cutoff_answer_key_notice',
      input: { exam_name: 'RPSC 1st Grade', authority: 'RPSC', document_type: 'answer_key', detected_keywords: ['result', 'cutoff'] },
    },
    {
      name: 'unknown notification',
      expected: 'base_notification_only',
      input: { exam_name: 'Unknown Exam', authority: 'Unknown Authority', document_type: 'notification', detected_keywords: [] },
    },
  ];
  return samples.map(sample => {
    const result = selectNotificationSchema(sample.input);
    return {
      name: sample.name,
      expected: sample.expected,
      actual: result.selected_archetype,
      pass: result.selected_archetype === sample.expected,
      reason: result.reason,
      confidence: result.confidence,
      fallback_used: result.fallback_used,
    };
  });
}

function main() {
  console.log('==============================================');
  console.log('RC-N0 NOTIFICATION SCHEMA SYSTEM AUDIT');
  console.log('==============================================');
  console.log('Mode: local schema audit only - no Firestore writes, no extraction run');

  const blockers = [];
  if (!fs.existsSync(SCHEMA_DIR)) blockers.push('functions/notification_schemas folder missing.');
  for (const rel of [
    'functions/notification_schemas/base_notification_schema.js',
    'functions/notification_schemas/exam_archetype_schemas.js',
    'functions/notification_schemas/variable_packs.js',
    'functions/notification_schemas/schema_selector.js',
    'functions/notification_schemas/README.md',
  ]) {
    if (!exists(rel)) blockers.push(`${rel} missing.`);
  }

  blockers.push(...validateSourceProofRequirement(BASE_NOTIFICATION_SCHEMA));
  blockers.push(...archetypeFieldBlockers());
  blockers.push(...validateVariablePacks(VARIABLE_PACKS));

  const expectedArchetypes = [
    'entrance_exam_single',
    'recruitment_single_exam',
    'recruitment_variable_heavy',
    'amendment_notice',
    'result_cutoff_answer_key_notice',
    'base_notification_only',
  ];
  for (const archetype of expectedArchetypes) {
    if (!EXAM_ARCHETYPE_SCHEMAS[archetype]) blockers.push(`Missing archetype: ${archetype}`);
  }

  const selectorResults = runSelectorSamples();
  for (const result of selectorResults) {
    if (!result.pass) blockers.push(`Selector failed ${result.name}: expected ${result.expected}, got ${result.actual}`);
  }

  console.log('\nSelector sample results:');
  console.log(JSON.stringify(selectorResults, null, 2));

  console.log('\nSchema counts:');
  console.log(JSON.stringify({
    base_fields: BASE_NOTIFICATION_SCHEMA.fields.length,
    archetypes: Object.keys(EXAM_ARCHETYPE_SCHEMAS).length,
    variable_packs: Object.keys(VARIABLE_PACKS).length,
  }, null, 2));

  console.log('\nConfirmations:');
  console.log('- no Firestore writes');
  console.log('- no extraction run');
  console.log('- source proof required for base fields');
  console.log('- source proof required for archetype fields');
  console.log('- variable packs include source proof fields');

  if (blockers.length > 0) {
    console.error('\nRC_N0_BLOCKED');
    blockers.forEach(blocker => console.error(`- ${blocker}`));
    process.exit(1);
  }

  console.log('\nRC_N0_NOTIFICATION_SCHEMA_SYSTEM_READY');
}

main();
