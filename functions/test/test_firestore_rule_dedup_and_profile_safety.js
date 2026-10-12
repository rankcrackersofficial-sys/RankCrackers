'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8');

function topLevelMatches(source) {
  const found = [];
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^    match\s+(\/\S+)\s*\{/);
    if (match) found.push(match[1]);
  }
  return found;
}

test('Firestore authorization has no duplicate top-level match routes', () => {
  const matchPaths = topLevelMatches(rules);
  assert.ok(matchPaths.length > 40, 'Expected full production rules, not a stub');
  assert.equal(new Set(matchPaths).size, matchPaths.length,
    'A duplicate rule can OR a weaker allow expression into a protected route');
});

test('student profile create and update require the verified canonical phone claim', () => {
  assert.match(rules, /function hasVerifiedCanonicalPhoneClaim\(\)/);
  assert.match(rules, /function isSafeStudentProfileCreate\(userId\)/);
  assert.match(rules, /function isSafeStudentProfileUpdate\(userId\)/);
  assert.match(rules, /allow create:\s*if isFounder\(\) \|\| isSafeStudentProfileCreate\(userId\)/);
  assert.match(rules, /allow update:\s*if isFounder\(\) \|\| isSafeStudentProfileUpdate\(userId\)/);
  assert.doesNotMatch(rules, /allow create:\s*if request\.auth != null && request\.auth\.uid == userId\s*;/);
  assert.doesNotMatch(rules, /allow update:\s*if request\.auth != null && request\.auth\.uid == userId/);
  assert.match(rules, /'role', 'accessLevel', 'founder', 'admin'/);
  assert.match(rules, /request\.resource\.data\.mobile == request\.auth\.token\.phone_number/);
});

test('verified source authority cannot be overwritten by client Firestore writes', () => {
  for (const pathSnippet of [
    'match /official_documents/{docId}', 'match /source_pairs/{pairId}',
    'match /source_slots/{slotId}', 'match /current_syllabus_projection/{unitId}',
  ]) assert.ok(rules.includes(pathSnippet), pathSnippet);
  const sourcePairBlock = rules.split('match /source_pairs/{pairId} {')[1]?.split('\n      }')[0] || '';
  assert.match(sourcePairBlock, /allow\s+write:\s*if false/);
});


test('hidden mission subcollections require parent Student visibility', () => {
  assert.match(rules, /function isStudentVisibleMission\(realmId\)/);
  const snippets = [
    'match /mission_realms/{realmId}', 'match /structured_nodes/{nodeId}',
    'match /timeline/{milestoneId}', 'match /updates/{updateId}',
  ];
  for (const snippet of snippets) {
    const start = rules.indexOf(snippet);
    assert.ok(start >= 0, snippet);
    const end = rules.indexOf('\n      }', start);
    const block = rules.slice(start, end < start ? start + 500 : end);
    assert.match(block, /isStudentVisibleMission\(realmId\)/,
      'Student access must follow parent realm: ' + snippet);
  }
});


test('Test Arena updates cannot transfer ownership or alter immutable paper and clock identity', () => {
  const block = rules.split('match /test_arena_attempts/{attemptId} {')[1]?.split('match /test_arena_results/')[0] || '';
  assert.match(block, /request\.resource\.data\.uid == request\.auth\.uid/);
  for (const key of ['attemptId', 'eventId', 'paperId', 'paperVersionHash',
    'scoringPolicyVersion', 'startedAt', 'targetEndAt']) {
    assert.ok(block.includes("'" + key + "'"), key + ' must be immutable');
  }
});

test('opportunity matches require both existing and proposed ownership', () => {
  const block = rules.split('match /opportunity_matches/{matchId} {')[1]?.split('match /users/')[0] || '';
  assert.match(block, /allow update:\s*if isFounder\(\)/);
  assert.match(block, /resource\.data\.uid == request\.auth\.uid/);
  assert.match(block, /request\.resource\.data\.uid == request\.auth\.uid/);
  assert.doesNotMatch(block, /allow write:/);
});
