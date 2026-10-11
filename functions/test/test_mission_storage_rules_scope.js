'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('official source Storage rules stay inside the bucket match and are server-write-only', () => {
  const file = fs.readFileSync(path.resolve(__dirname, '../../storage.rules'), 'utf8');
  const lines = file.split(/\r?\n/);
  let depth = 0;
  let bucketDepth = null;
  let officialDepth = null;
  let officialBlock = '';
  let collecting = false;
  for (const line of lines) {
    const code = line.split('//')[0];
    const before = depth;
    if (/^\s*match\s+\/b\/\{bucket\}\/o\s+\{/.test(code)) {
      assert.equal(before, 1, 'Bucket rule must be directly inside storage service');
      bucketDepth = before + 1;
    }
    if (/^\s*match\s+\/mission_realms\/\{realmId\}\/official_documents\//.test(code)) {
      assert.equal(before, 2, 'Official source rule must be nested under /b/{bucket}/o');
      officialDepth = before + 1;
      collecting = true;
    }
    if (collecting) officialBlock += line + '\n';
    for (const char of code) {
      if (char === '{') depth++;
      if (char === '}') depth--;
      assert.ok(depth >= 0, 'Unmatched closing Storage rules brace');
    }
    if (collecting && depth < officialDepth) collecting = false;
  }
  assert.equal(depth, 0, 'Storage rules braces must balance');
  assert.equal(bucketDepth, 2);
  assert.equal(officialDepth, 3);
  assert.match(officialBlock, /allow\s+write:\s*if\s+false\s*;/);
  assert.match(officialBlock, /request\.auth\.token\.founder\s*==\s*true/);
  assert.doesNotMatch(file, /match\s+\/mission_source_staging\//,
    'Do not authorize arbitrary client staging uploads without scoped server authorization');
});

test('emulator ports are distinct for Auth, Storage, Firestore and Functions', () => {
  const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../firebase.json'), 'utf8'));
  const names = ['auth', 'storage', 'firestore', 'functions'];
  const ports = names.map(name => {
    const emulator = config.emulators?.[name];
    assert.ok(emulator && Number.isInteger(emulator.port), name + ' needs an explicit port');
    assert.equal(emulator.host, '127.0.0.1', name + ' must bind locally');
    return emulator.port;
  });
  assert.equal(new Set(ports).size, ports.length);
});


test('canonical source pairs are Founder-readable and never client-writable', () => {
  const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8');
  const realmStart = rules.indexOf('match /mission_realms/{realmId} {');
  const pairStart = rules.indexOf('match /source_pairs/{pairId} {', realmStart);
  assert.ok(realmStart >= 0 && pairStart > realmStart, 'Mission-scoped source-pair rule required');
  const pairEnd = rules.indexOf('}', pairStart);
  const scopedRule = rules.slice(pairStart, pairEnd);
  assert.match(scopedRule, /request\.auth\.token\.founder\s*==\s*true/);
  assert.match(scopedRule, /allow\s+write:\s*if\s+false\s*;/);
  assert.doesNotMatch(scopedRule, /allow\s+(create|update|delete)/);
});
