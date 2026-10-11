'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

test('Android release signing has no committed passwords or hardcoded keystore', () => {
  const gradle = fs.readFileSync(path.resolve(root, 'android/app/build.gradle.kts'), 'utf8');
  for (const envKey of ['RC_ANDROID_KEY_ALIAS', 'RC_ANDROID_KEY_PASSWORD',
    'RC_ANDROID_STORE_FILE', 'RC_ANDROID_STORE_PASSWORD']) {
    assert.ok(gradle.includes('providers.environmentVariable("' + envKey + '")'), envKey);
  }
  assert.match(gradle, /RC_ANDROID_RELEASE_SIGNING_REQUIRED/);
  assert.match(gradle, /if \(isReleaseInvocation && !hasReleaseSigning\)/);
  assert.doesNotMatch(gradle, /keyPassword\s*=\s*"[^"]+"/);
  assert.doesNotMatch(gradle, /storePassword\s*=\s*"[^"]+"/);
  assert.doesNotMatch(gradle, /storeFile\s*=\s*file\("[^"]+\.jks"\)/);
});

test('release keystores, credentials and key.properties are absent from tracked source', () => {
  const filesToCheck = ['android/app/rank_crackers.jks',
    'android/app/key.properties', 'android/key.properties'];
  for (const relative of filesToCheck) {
    assert.equal(fs.existsSync(path.resolve(root, relative)), false,
      'Signing secrets must not be committed: ' + relative);
  }
});
