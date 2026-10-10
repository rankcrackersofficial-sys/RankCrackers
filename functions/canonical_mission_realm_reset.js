'use strict';

/**
 * One-time legacy reset tool.
 *
 * The default mode is a read-only census. Destructive mode is deliberately
 * fail-closed: it requires the expected Firebase project, an explicit full
 * backup, two independent authorization gates, and recursiveDelete support.
 * Every delete is represented in a deterministic manifest and durable progress
 * file so an interrupted operation can be resumed without repeating completed
 * work.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const EXPECTED_PROJECT_ID = 'rankcrackers-55';
const ALLOWED_PROJECT_IDS = new Set([EXPECTED_PROJECT_ID]);
const LEGACY = ['recruitments', 'student_mission_catalog'];
const ALL_MISSION_COLLECTIONS = ['mission_realms', ...LEGACY];
const CONFIRM = 'CONFIRM_CANONICAL_MISSION_REALM_RESET';
const AUTHORIZATION_ENV = 'RC_CANONICAL_MISSION_REALM_RESET_AUTHORIZATION';
const AUTHORIZATION_VALUE = 'DOMAIN_D_APPROVED';
const MANIFEST_VERSION = 1;

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

function hasArg(arg) {
  return process.argv.includes(arg);
}

function stableSerialize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableSerialize).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => {
    return JSON.stringify(key) + ':' + stableSerialize(value[key]);
  }).join(',') + '}';
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function backupFingerprint(backup) {
  const clone = jsonClone(backup);
  delete clone.generatedAt;
  delete clone.backupSha256;
  return sha256(stableSerialize(clone));
}

function getConfiguredProjectId() {
  return admin.app().options.projectId || process.env.GCLOUD_PROJECT || process.env.GCLOUD_PROJECT_ID || null;
}

function assertDestructivePreconditions() {
  const projectId = getConfiguredProjectId();
  if (!ALLOWED_PROJECT_IDS.has(projectId) || projectId !== EXPECTED_PROJECT_ID) {
    throw new Error(`FIREBASE_PROJECT_ID_NOT_ALLOWED:${projectId || 'UNRESOLVED'}:expected=${EXPECTED_PROJECT_ID}`);
  }
  if (!hasArg('--full-backup')) {
    throw new Error('FULL_BACKUP_REQUIRED_BEFORE_DESTRUCTIVE_OPERATION');
  }
  if (!hasArg(CONFIRM)) {
    throw new Error(`DESTRUCTIVE_CONFIRMATION_REQUIRED:${CONFIRM}`);
  }
  if (process.env[AUTHORIZATION_ENV] !== AUTHORIZATION_VALUE) {
    throw new Error(`INDEPENDENT_AUTHORIZATION_REQUIRED:${AUTHORIZATION_ENV}=${AUTHORIZATION_VALUE}`);
  }
  if (typeof db.recursiveDelete !== 'function') {
    throw new Error('RECURSIVE_DELETE_UNSUPPORTED:refusing_root_only_fallback');
  }
  return projectId;
}

async function collectSubtree(ref) {
  const tree = {
    path: ref.path,
    data: ref.id ? (await ref.get()).data() || {} : {},
    subcollections: {},
  };
  const subcollections = await ref.listCollections();
  subcollections.sort((a, b) => a.id.localeCompare(b.id));
  for (const subcollection of subcollections) {
    const snap = await subcollection.get();
    tree.subcollections[subcollection.id] = [];
    const docs = [...snap.docs].sort((a, b) => a.id.localeCompare(b.id));
    for (const doc of docs) {
      tree.subcollections[subcollection.id].push(await collectSubtree(doc.ref));
    }
  }
  return tree;
}

async function collect() {
  const includeFullBackup = hasArg('--full-backup') || hasArg('--apply');
  const result = {
    generatedAt: new Date().toISOString(),
    collections: {},
    union: [],
    legacyOnly: {},
    realmIds: [],
    fullMissionRealmBackupIncluded: includeFullBackup,
    fullMissionRealmBackup: {},
    fullCollectionBackupIncluded: includeFullBackup,
    fullCollectionBackup: {},
  };
  const ids = new Set();
  for (const collection of ALL_MISSION_COLLECTIONS) {
    const snap = await db.collection(collection).get();
    const docs = [...snap.docs].sort((a, b) => a.id.localeCompare(b.id));
    const rows = docs.map(doc => ({ id: doc.id, data: doc.data() }));
    result.collections[collection] = rows;
    rows.forEach(row => ids.add(row.id));
    if (includeFullBackup) {
      result.fullCollectionBackup[collection] = {};
      for (const doc of docs) {
        result.fullCollectionBackup[collection][doc.id] = await collectSubtree(doc.ref);
      }
    }
  }
  result.fullMissionRealmBackup = result.fullCollectionBackup.mission_realms || {};
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

function assertCompleteBackup(backup) {
  if (!backup.fullCollectionBackupIncluded || !backup.fullCollectionBackup) {
    throw new Error('COMPLETE_BACKUP_REQUIRED:full_collection_backup_missing');
  }
  for (const collection of ALL_MISSION_COLLECTIONS) {
    const expectedIds = (backup.collections[collection] || []).map(row => row.id).sort();
    const actualIds = Object.keys(backup.fullCollectionBackup[collection] || {}).sort();
    if (stableSerialize(expectedIds) !== stableSerialize(actualIds)) {
      throw new Error(`BACKUP_INCOMPLETE:${collection}:expected=${expectedIds.length}:actual=${actualIds.length}`);
    }
    for (const id of expectedIds) {
      const subtree = backup.fullCollectionBackup[collection][id];
      if (!subtree || subtree.path !== `${collection}/${id}` || !subtree.subcollections) {
        throw new Error(`BACKUP_INCOMPLETE:${collection}/${id}`);
      }
    }
  }
  if (stableSerialize(backup.fullMissionRealmBackup) !== stableSerialize(backup.fullCollectionBackup.mission_realms)) {
    throw new Error('BACKUP_ALIAS_MISMATCH:fullMissionRealmBackup');
  }
}

function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(tempPath, filePath);
}

function writeAndVerifyBackup(census, backupPath) {
  const backup = { ...census, backupSha256: backupFingerprint(census) };
  atomicWriteJson(backupPath, backup);
  const reread = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  assertCompleteBackup(reread);
  if (reread.backupSha256 !== backupFingerprint(reread)) {
    throw new Error('BACKUP_VERIFICATION_FAILED:sha256_mismatch');
  }
  return reread;
}

function buildManifest(backup, projectId, deleteRealms) {
  const targetCollections = deleteRealms ? [...ALL_MISSION_COLLECTIONS] : [...LEGACY];
  const operations = [];
  for (const collection of targetCollections) {
    const rows = [...(backup.collections[collection] || [])].sort((a, b) => a.id.localeCompare(b.id));
    for (const row of rows) {
      operations.push({
        operationKey: `delete:${collection}/${row.id}`,
        collection,
        path: `${collection}/${row.id}`,
        status: 'PENDING',
      });
    }
  }
  const identity = {
    version: MANIFEST_VERSION,
    projectId,
    backupSha256: backup.backupSha256,
    targetCollections,
    operations: operations.map(({ operationKey, collection, path: documentPath }) => ({
      operationKey,
      collection,
      path: documentPath,
    })),
  };
  return {
    ...identity,
    operationId: `canonical-reset-${sha256(stableSerialize(identity)).slice(0, 24)}`,
    backupFile: 'canonical_mission_realm_reset_census.json',
    operations,
  };
}

function assertManifestMatchesBackup(manifest, backup, projectId) {
  if (manifest.version !== MANIFEST_VERSION || manifest.projectId !== projectId) {
    throw new Error('MANIFEST_IDENTITY_MISMATCH');
  }
  if (manifest.backupSha256 !== backup.backupSha256) {
    throw new Error('MANIFEST_BACKUP_MISMATCH');
  }
  const allowedTargets = [LEGACY, ALL_MISSION_COLLECTIONS]
    .map(collections => stableSerialize([...collections]));
  if (!allowedTargets.includes(stableSerialize(manifest.targetCollections || []))) {
    throw new Error('MANIFEST_TARGET_COLLECTIONS_NOT_ALLOWED');
  }
  const expected = buildManifest(backup, projectId, manifest.targetCollections.includes('mission_realms'));
  const stripProgressFields = operation => {
    const { status, error, startedAt, completedAt, ...identity } = operation;
    return identity;
  };
  if (manifest.operationId !== expected.operationId ||
      stableSerialize(manifest.operations.map(stripProgressFields)) !== stableSerialize(expected.operations.map(stripProgressFields))) {
    throw new Error('MANIFEST_OPERATION_SET_MISMATCH');
  }
}

function loadProgress(progressPath, manifest) {
  if (!fs.existsSync(progressPath)) {
    return {
      version: MANIFEST_VERSION,
      operationId: manifest.operationId,
      projectId: manifest.projectId,
      backupSha256: manifest.backupSha256,
      status: 'READY',
      operations: manifest.operations.map(operation => ({ ...operation })),
    };
  }
  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  if (progress.operationId !== manifest.operationId || progress.projectId !== manifest.projectId || progress.backupSha256 !== manifest.backupSha256) {
    throw new Error('PROGRESS_OPERATION_MISMATCH:refusing_to_mix_reset_runs');
  }
  const byKey = new Map((progress.operations || []).map(operation => [operation.operationKey, operation]));
  return {
    ...progress,
    status: progress.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
    operations: manifest.operations.map(operation => ({ ...operation, ...(byKey.get(operation.operationKey) || {}) })),
  };
}

function writeProgress(progressPath, progress) {
  atomicWriteJson(progressPath, progress);
}

async function applyManifest(manifest, progressPath) {
  const progress = loadProgress(progressPath, manifest);
  progress.status = 'IN_PROGRESS';
  writeProgress(progressPath, progress);
  try {
    for (const operation of progress.operations) {
      if (operation.status === 'COMPLETED') continue;
      operation.status = 'IN_PROGRESS';
      operation.startedAt = new Date().toISOString();
      writeProgress(progressPath, progress);
      try {
        await db.recursiveDelete(db.doc(operation.path));
        operation.status = 'COMPLETED';
        operation.completedAt = new Date().toISOString();
        delete operation.error;
        writeProgress(progressPath, progress);
      } catch (error) {
        operation.status = 'FAILED';
        operation.error = error.message || String(error);
        progress.status = 'PARTIAL_FAILURE_RESUMABLE';
        writeProgress(progressPath, progress);
        throw error;
      }
    }
    progress.status = 'COMPLETED';
    writeProgress(progressPath, progress);
    return progress;
  } catch (error) {
    if (progress.status !== 'PARTIAL_FAILURE_RESUMABLE') {
      progress.status = 'FAILED_RESUMABLE';
      writeProgress(progressPath, progress);
    }
    throw error;
  }
}

async function main() {
  const apply = hasArg('--apply');
  const deleteRealms = hasArg('--delete-realms');
  const outDir = path.resolve(process.env.RC_REPORT_DIR || 'docs/architecture');
  fs.mkdirSync(outDir, { recursive: true });
  const censusPath = path.join(outDir, 'canonical_mission_realm_reset_census.json');
  const manifestPath = path.join(outDir, 'canonical_mission_realm_reset_manifest.json');
  const progressPath = path.join(outDir, 'canonical_mission_realm_reset_progress.json');

  if (apply) {
    // Validate destination and deletion capability before any destructive-mode read.
    assertDestructivePreconditions();
  }

  if (hasArg('--resume')) {
    if (!apply) throw new Error('RESUME_REQUIRES_APPLY');
    if (!fs.existsSync(manifestPath) || !fs.existsSync(censusPath)) {
      throw new Error('RESUME_ARTIFACTS_MISSING:manifest_and_verified_backup_required');
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const backup = JSON.parse(fs.readFileSync(censusPath, 'utf8'));
    assertCompleteBackup(backup);
    if (backup.backupSha256 !== backupFingerprint(backup)) throw new Error('BACKUP_VERIFICATION_FAILED:sha256_mismatch');
    assertManifestMatchesBackup(manifest, backup, getConfiguredProjectId());
    const progress = await applyManifest(manifest, progressPath);
    console.log(JSON.stringify({ status: progress.status, operationId: manifest.operationId, progressPath }, null, 2));
    return;
  }

  const census = await collect();
  if (apply) {
    // A complete, re-readable backup must be verified before a manifest is applied.
    writeAndVerifyBackup(census, censusPath);
  } else {
    atomicWriteJson(censusPath, census);
  }
  console.log(JSON.stringify({
    mode: apply ? 'APPLY_REQUESTED' : 'DRY_RUN',
    missionRealmCount: census.realmIds.length,
    unionCount: census.union.length,
    legacyOnly: census.legacyOnly,
    fullBackupVerified: apply || hasArg('--full-backup') ? Boolean(census.fullCollectionBackupIncluded) : false,
    censusPath,
  }, null, 2));

  if (!apply) return;

  const verifiedBackup = JSON.parse(fs.readFileSync(censusPath, 'utf8'));
  const projectId = getConfiguredProjectId();
  const manifest = buildManifest(verifiedBackup, projectId, deleteRealms);
  assertManifestMatchesBackup(manifest, verifiedBackup, projectId);
  atomicWriteJson(manifestPath, manifest);
  const progress = await applyManifest(manifest, progressPath);
  console.log(JSON.stringify({
    status: deleteRealms ? 'FULL_CANONICAL_MISSION_RESET_COMPLETE' : 'LEGACY_PROJECTIONS_DELETED',
    operationId: manifest.operationId,
    progressPath,
    completedOperations: progress.operations.filter(operation => operation.status === 'COMPLETED').length,
    totalOperations: progress.operations.length,
  }, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
