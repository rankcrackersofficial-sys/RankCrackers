'use strict';

const assert = require('assert');
const {
  canonicalMissionPath,
  buildCanonicalMissionRealm,
  buildCanonicalOfficialDocument,
  assertCanonicalWritePath,
} = require('../services/canonical_mission_realm_store');

assert.strictEqual(canonicalMissionPath('jee_main_2027'), 'mission_realms/jee_main_2027');
assert.throws(() => canonicalMissionPath(''), /CANONICAL_MISSION_ID_REQUIRED/);

const realm = buildCanonicalMissionRealm({
  missionId: 'jee_main_2027',
  title: 'JEE Main',
  status: 'ACTIVE',
  userPanelVisible: true,
}, {}, '2026-10-10T00:00:00.000Z');

assert.strictEqual(realm.id, 'jee_main_2027');
assert.strictEqual(realm.realm_id, 'jee_main_2027');
assert.strictEqual(realm.visibilityGate.studentVisible, true);
assert.strictEqual(realm.visibilityGate.catalogVisible, true);
assert.strictEqual(realm.updatedAt, '2026-10-10T00:00:00.000Z');

const official = buildCanonicalOfficialDocument({
  sourceId: 'notification-1',
  documentType: 'NOTIFICATION',
  documentStatus: 'PUBLISHED',
}, 'jee_main_2027', '2026-10-10T00:00:00.000Z');

assert.strictEqual(official.documentId, 'notification-1');
assert.strictEqual(official.canonicalMissionPath, 'mission_realms/jee_main_2027');
assert.strictEqual(official.documentStatus, 'PUBLISHED');
assertCanonicalWritePath('mission_realms/jee_main_2027/official_documents/notification-1');
assert.throws(() => assertCanonicalWritePath('recruitments/jee_main_2027'), /NON_CANONICAL_MISSION_WRITE_BLOCKED/);

console.log('canonical mission realm store tests passed');
