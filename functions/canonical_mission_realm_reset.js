'use strict';

/**
 * One-time legacy reset tool.
 *
 * Default is read-only census. Destructive mode requires the exact confirmation
 * token and should only be run after an export has been stored safely.
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const LEGACY = ['recruitments', 'student_mission_catalog'];
const CONFIRM = 'CONFIRM_CANONICAL_MISSION_REALM_RESET';

async function collectSubtree(ref) {
  const tree = { path: ref.path, data: ref.id ? (await ref.get()).data() || {} : {}, subcollections: {} };
  for (const subcollection of await ref.listCollections()) {
    const snap = await subcollection.get();
    tree.subcollections[subcollection.id] = [];
    for (const doc of snap.docs) {
      tree.subcollections[subcollection.id].push(await collectSubtree(doc.ref));
    }
  }
  return tree;
}

async function collect() {
  const includeFullBackup = process.argv.includes('--full-backup') || process.argv.includes('--apply');
  const result = {
    generatedAt: new Date().toISOString(),
    collections: {},
    union: [],
    legacyOnly: {},
    realmIds: [],
    fullMissionRealmBackupIncluded: includeFullBackup,
    fullMissionRealmBackup: {},
  };
  const ids = new Set();
  for (const collection of ['mission_realms', ...LEGACY]) {
    const snap = await db.collection(collection).get();
    const rows = snap.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    result.collections[collection] = rows;
    rows.forEach(row => ids.add(row.id));
    if (collection === 'mission_realms' && includeFullBackup) {
      for (const doc of snap.docs) {
        result.fullMissionRealmBackup[doc.id] = await collectSubtree(doc.ref);
      }
    }
  }
  result.realmIds = result.collections.mission_realms.map(row => row.id);
  result.union = [...ids].sort();
  for (const collection of LEGACY) {
    result.legacyOnly[collection] = result.collections[collection]
      .map(row => row.id)
      .filter(id => !result.realmIds.includes(id))
      .sort();
  }
  return result;
}

async function deleteRootCollection(collection, recursive = true) {
  const snap = await db.collection(collection).get();
  let deleted = 0;
  if (recursive && typeof db.recursiveDelete === 'function') {
    for (const doc of snap.docs) {
      await db.recursiveDelete(doc.ref);
      deleted += 1;
    }
    return deleted;
  }
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(400, snap.docs.length - i);
  }
  return deleted;
}

async function main() {
  const census = await collect();
  const outDir = path.resolve(process.env.RC_REPORT_DIR || 'docs/architecture');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'canonical_mission_realm_reset_census.json'), JSON.stringify(census, null, 2));
  console.log(JSON.stringify({
    mode: process.argv.includes('--apply') ? 'APPLY_REQUESTED' : 'DRY_RUN',
    missionRealmCount: census.realmIds.length,
    unionCount: census.union.length,
    legacyOnly: census.legacyOnly,
    censusPath: path.join(outDir, 'canonical_mission_realm_reset_census.json'),
  }, null, 2));

  if (!process.argv.includes('--apply')) return;
  if (!process.argv.includes(CONFIRM)) throw new Error(`DESTRUCTIVE_CONFIRMATION_REQUIRED:${CONFIRM}`);
  const deleted = {};
  for (const collection of LEGACY) deleted[collection] = await deleteRootCollection(collection);
  if (process.argv.includes('--delete-realms')) {
    deleted.mission_realms = await deleteRootCollection('mission_realms');
  }
  console.log(JSON.stringify({
    status: process.argv.includes('--delete-realms')
      ? 'FULL_CANONICAL_MISSION_RESET_COMPLETE'
      : 'LEGACY_PROJECTIONS_DELETED',
    deleted,
    recursiveDeleteUsed: typeof db.recursiveDelete === 'function',
  }, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
