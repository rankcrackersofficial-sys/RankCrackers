'use strict';

// I2B2-D is the narrow Firestore binding for the already-accepted I2B2-B/C
// pure layers. It owns persistence and the two-phase Firestore time anchor;
// it does not initialize Firebase, expose a callable, or authorize clients.
const i1 = require('./taught_content_authority_i1');
const i2a = require('./taught_content_authority_i2a');
const coordinator = require('./taught_content_execution_coordinator_i2b2b');
const lifecycle = require('./taught_content_execution_lifecycle_i2b2c');

const INTENT_SCHEMA = 'i2b2d-lifecycle-time-intent-v1';
const INTENT_COLLECTION = 'lifecycle_time_intents';

const FAILURE_CODES = Object.freeze({
  ...coordinator.FAILURE_CODES,
  ...lifecycle.FAILURE_CODES,
  ADAPTER_DEPENDENCY_INVALID: 'I2B2D_ADAPTER_DEPENDENCY_INVALID',
  ADAPTER_PATH_INVALID: 'I2B2D_ADAPTER_PATH_INVALID',
  LIFECYCLE_TIME_INTENT_CONFLICT: 'I2B2D_LIFECYCLE_TIME_INTENT_CONFLICT',
  LIFECYCLE_TIME_INTENT_MISSING: 'I2B2D_LIFECYCLE_TIME_INTENT_MISSING',
  LIFECYCLE_TIME_UNRESOLVED: 'I2B2D_LIFECYCLE_TIME_UNRESOLVED',
  LIFECYCLE_TIME_MALFORMED: 'I2B2D_LIFECYCLE_TIME_MALFORMED',
  LIFECYCLE_TIME_INTENT_IDENTITY_MISMATCH: 'I2B2D_LIFECYCLE_TIME_INTENT_IDENTITY_MISMATCH',
  LIFECYCLE_TIME_CAS_CONFLICT: 'I2B2D_LIFECYCLE_TIME_CAS_CONFLICT',
  LIFECYCLE_TIME_INTENT_REQUIRED: 'I2B2D_LIFECYCLE_TIME_INTENT_REQUIRED',
});

function fail(code, message) {
  const error = new Error(`${code}: ${message || code}`);
  error.code = code;
  throw error;
}

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireString(value, field) {
  if (!requiredString(value)) fail(FAILURE_CODES.ADAPTER_DEPENDENCY_INVALID, `${field} is required`);
  return value.trim();
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object' && typeof value.toMillis !== 'function') {
    return Object.keys(value).reduce((out, key) => {
      out[key] = clone(value[key]);
      return out;
    }, {});
  }
  return value;
}

function sameValue(a, b) {
  if (a === b) return true;
  if (a && b && typeof a.toMillis === 'function' && typeof b.toMillis === 'function') {
    return a.toMillis() === b.toMillis();
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => sameValue(value, b[index]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    return aKeys.length === bKeys.length && aKeys.every((key, index) => key === bKeys[index] && sameValue(a[key], b[key]));
  }
  return false;
}

function snapshotData(snapshot) {
  if (!snapshot || snapshot.exists === false || typeof snapshot.data !== 'function') return null;
  return snapshot.data();
}

function resolvedMillis(value) {
  if (!value || typeof value.toMillis !== 'function' || typeof value.toDate !== 'function') {
    fail(FAILURE_CODES.LIFECYCLE_TIME_UNRESOLVED, 'authoritative intent timestamp is not a resolved Firestore Timestamp');
  }
  const milliseconds = value.toMillis();
  if (!Number.isFinite(milliseconds)) fail(FAILURE_CODES.LIFECYCLE_TIME_MALFORMED, 'authoritative intent timestamp is not finite');
  return milliseconds;
}

function assertPath(path) {
  if (!requiredString(path) || path.startsWith('/') || path.endsWith('/') || path.includes('//') || path.split('/').some(segment => !requiredString(segment) || segment === '.' || segment === '..')) {
    fail(FAILURE_CODES.ADAPTER_PATH_INVALID, 'Firestore path is invalid');
  }
  return path;
}

function operationName(operation) {
  if (!['claim', 'renew', 'takeover'].includes(operation)) {
    fail(FAILURE_CODES.ADAPTER_DEPENDENCY_INVALID, 'unsupported lifecycle operation');
  }
  return operation;
}

function requestOf(input) {
  if (input && input.request && typeof input.request === 'object') return input.request;
  return input || {};
}

function expectedNumber(value, field, required) {
  if (value === undefined && !required) return 0;
  if (!Number.isInteger(value) || value < 0) fail(FAILURE_CODES.EXECUTION_STATUS_CONFLICT, `${field} must be a non-negative integer`);
  return value;
}

function lifecycleExpectations(operation, input) {
  const value = input || {};
  const expectedStatusVersion = expectedNumber(value.expectedStatusVersion, 'expectedStatusVersion', true);
  const expectedFencingToken = expectedNumber(value.expectedFencingToken === undefined ? value.fencingToken : value.expectedFencingToken, 'expectedFencingToken', operation !== 'claim');
  const expectedLeaseGeneration = expectedNumber(value.expectedLeaseGeneration === undefined ? value.leaseGeneration : value.expectedLeaseGeneration, 'expectedLeaseGeneration', operation !== 'claim');
  return Object.freeze({
    expectedStatusVersion,
    expectedFencingToken,
    expectedLeaseGeneration,
    expectedLeaseOwner: value.expectedLeaseOwner === undefined ? value.leaseOwner : value.expectedLeaseOwner,
  });
}

function immutableIntentView(document) {
  if (!document) return null;
  const copy = { ...document };
  delete copy.authoritativeTime;
  delete copy.phase;
  return copy;
}

function createDefaultFieldValue() {
  try {
    // Requiring Admin is side-effect free; initialization remains owned by
    // functions/index.js. A caller may inject FieldValue for deterministic tests.
    const admin = require('firebase-admin');
    return admin.firestore.FieldValue;
  } catch (error) {
    fail(FAILURE_CODES.ADAPTER_DEPENDENCY_INVALID, 'firebase-admin FieldValue is unavailable');
  }
}

function createAdapter(options) {
  const value = options || {};
  const db = value.db;
  const authorityReader = value.authorityReader;
  const FieldValue = value.FieldValue || createDefaultFieldValue();
  if (!db || typeof db.doc !== 'function' || typeof db.runTransaction !== 'function') {
    fail(FAILURE_CODES.ADAPTER_DEPENDENCY_INVALID, 'initialized Firestore db is required');
  }
  if (!authorityReader || typeof authorityReader.readCurrentReservationAuthority !== 'function') {
    fail(FAILURE_CODES.ADAPTER_DEPENDENCY_INVALID, 'server authorityReader is required');
  }
  if (!FieldValue || typeof FieldValue.serverTimestamp !== 'function') {
    fail(FAILURE_CODES.ADAPTER_DEPENDENCY_INVALID, 'FieldValue.serverTimestamp is required');
  }

  function ref(path) {
    return db.doc(assertPath(path));
  }

  function missingAsNull(snapshot) {
    return snapshot && snapshot.exists !== false ? snapshot : null;
  }

  function facade(rawTransaction, boundIntent) {
    const reads = new Map();
    const tx = {
      get: async path => {
        const normalized = assertPath(path);
        const snapshot = await rawTransaction.get(ref(normalized));
        reads.set(normalized, snapshot);
        return missingAsNull(snapshot);
      },
      create: (path, data) => rawTransaction.create(ref(path), data),
      set: (path, data, options) => options === undefined
        ? rawTransaction.set(ref(path), data)
        : rawTransaction.set(ref(path), data, options),
      delete: path => rawTransaction.delete(ref(path)),
      update: async (path, patch, expected) => {
        const normalized = assertPath(path);
        const snapshot = reads.get(normalized);
        if (!snapshot || snapshot.exists === false) fail(FAILURE_CODES.LIFECYCLE_TIME_CAS_CONFLICT, 'CAS update requires a prior existing transaction read');
        const current = snapshot.data() || {};
        const expectedFields = expected && expected.expected ? expected.expected : expected;
        if (!expectedFields || typeof expectedFields !== 'object') fail(FAILURE_CODES.LIFECYCLE_TIME_CAS_CONFLICT, 'CAS expected fields are required');
        for (const [field, expectedValue] of Object.entries(expectedFields)) {
          if (!sameValue(current[field], expectedValue)) fail(FAILURE_CODES.LIFECYCLE_TIME_CAS_CONFLICT, `CAS field changed: ${field}`);
        }
        return rawTransaction.update(ref(normalized), patch);
      },
    };
    if (boundIntent) {
      tx.intentPath = boundIntent.path;
    }
    return Object.freeze(tx);
  }

  async function runTransaction(callback, transactionOptions) {
    if (typeof callback !== 'function') fail(FAILURE_CODES.ADAPTER_DEPENDENCY_INVALID, 'transaction callback is required');
    return db.runTransaction(rawTransaction => callback(facade(rawTransaction)), transactionOptions);
  }

  async function reservationRunTransaction(callback) {
    return db.runTransaction(rawTransaction => callback(Object.freeze({
      get: async path => snapshotData(await rawTransaction.get(ref(path))),
      create: (path, data) => rawTransaction.create(ref(path), data),
    })));
  }

  async function get(path) {
    return missingAsNull(await ref(path).get());
  }

  async function create(path, data) {
    return ref(path).create(data);
  }

  async function set(path, data, options) {
    return options === undefined ? ref(path).set(data) : ref(path).set(data, options);
  }

  async function update(path, patch) {
    return ref(path).update(patch);
  }

  async function deleteDocument(path) {
    return ref(path).delete();
  }

  async function casUpdate(path, patch, expected) {
    return runTransaction(async tx => {
      await tx.get(path);
      await tx.update(path, patch, expected);
      return { ok: true, committed: true };
    });
  }

  async function authorityFor(request, context) {
    let snapshot;
    try {
      snapshot = await authorityReader.readCurrentReservationAuthority(clone(request), clone(context));
    } catch (error) {
      const wrapped = new Error(error && error.message ? error.message : coordinator.FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE);
      wrapped.code = error && error.code ? error.code : coordinator.FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE;
      throw wrapped;
    }
    const validation = coordinator.validateAuthoritySnapshot(request, snapshot);
    if (!validation.ok) fail(validation.code, 'authority validation failed before lifecycle intent');
    return { snapshot, validation };
  }

  function intentDetails(operation, input, context, validation) {
    const request = requestOf(input);
    const expectations = lifecycleExpectations(operation, input);
    const artifacts = coordinator.buildArtifacts(request, validation.registry);
    const base = {
      schemaVersion: INTENT_SCHEMA,
      executionId: artifacts.executionId,
      realmId: request.realmId,
      missionId: request.missionId,
      subjectId: request.subjectId,
      operation,
      expectedStatusVersion: expectations.expectedStatusVersion,
      expectedFencingToken: expectations.expectedFencingToken,
      expectedLeaseGeneration: expectations.expectedLeaseGeneration,
      expectedLeaseOwner: expectations.expectedLeaseOwner === undefined ? null : expectations.expectedLeaseOwner,
      replacementOwner: operation === 'takeover' ? context.workerInstanceId : null,
      executorId: context.executorId,
      executorVersion: context.executorVersion,
      authorizationVersion: validation.registry.authorizationVersion,
      issuerId: validation.registry.issuerId,
      requestFingerprint: artifacts.requestFingerprint,
      idempotencyKey: artifacts.idempotencyKey,
    };
    const immutableFingerprint = i1.sha256(base);
    const intentId = i1.identity('lifecycle_time_intent', base);
    const executionPath = i2a.buildTeachingExecutionPath({
      identity: request.missionIdentity,
      realmId: request.realmId,
      executionId: artifacts.executionId,
    });
    return Object.freeze({
      ...base,
      intentId,
      immutableFingerprint,
      path: `${executionPath}/${INTENT_COLLECTION}/${intentId}`,
      document: Object.freeze({
        ...base,
        intentId,
        immutableFingerprint,
        phase: 'NON_AUTHORITATIVE_INTENT',
        authoritativeTime: FieldValue.serverTimestamp(),
      }),
      artifacts,
      validation,
    });
  }

  async function createLifecycleTimeIntent(operationInput, input, context) {
    const operation = operationName(operationInput);
    const prepared = await authorityFor(requestOf(input), context);
    const details = intentDetails(operation, input, context, prepared.validation);
    const outcome = await runTransaction(async tx => {
      const existing = await tx.get(details.path);
      if (existing) {
        const existingData = snapshotData(existing);
        if (!existingData || existingData.immutableFingerprint !== details.immutableFingerprint || !sameValue(immutableIntentView(existingData), immutableIntentView(details.document))) {
          fail(FAILURE_CODES.LIFECYCLE_TIME_INTENT_CONFLICT, 'deterministic intent identity conflicts');
        }
        return { created: false };
      }
      await tx.create(details.path, details.document);
      return { created: true };
    });
    const resolved = await readResolvedLifecycleTimeIntent(details);
    return Object.freeze({
      ...resolved,
      created: outcome.created,
      artifacts: details.artifacts,
      validation: details.validation,
      operation,
    });
  }

  async function readResolvedLifecycleTimeIntent(detailsOrPath) {
    const path = typeof detailsOrPath === 'string' ? detailsOrPath : detailsOrPath.path;
    const expected = typeof detailsOrPath === 'string' ? null : detailsOrPath;
    const snapshot = await get(path);
    if (!snapshot) fail(FAILURE_CODES.LIFECYCLE_TIME_INTENT_MISSING, 'lifecycle time intent does not exist');
    const document = snapshotData(snapshot);
    if (!document || document.phase !== 'NON_AUTHORITATIVE_INTENT') fail(FAILURE_CODES.LIFECYCLE_TIME_INTENT_IDENTITY_MISMATCH, 'intent phase is invalid');
    if (expected && (document.intentId !== expected.intentId || document.immutableFingerprint !== expected.immutableFingerprint || !sameValue(immutableIntentView(document), immutableIntentView(expected.document)))) {
      fail(FAILURE_CODES.LIFECYCLE_TIME_INTENT_IDENTITY_MISMATCH, 'resolved intent identity changed');
    }
    const authoritativeTimeMs = resolvedMillis(document.authoritativeTime);
    return Object.freeze({ path, snapshot, document, authoritativeTime: document.authoritativeTime, authoritativeTimeMs });
  }

  function boundTransactionStore(resolved) {
    return Object.freeze({
      runTransaction: callback => db.runTransaction(async rawTransaction => {
        const transaction = facade(rawTransaction, resolved);
        const intentSnapshot = await rawTransaction.get(ref(resolved.path));
        if (!intentSnapshot || intentSnapshot.exists === false) fail(FAILURE_CODES.LIFECYCLE_TIME_INTENT_MISSING, 'intent disappeared before final CAS');
        const currentIntent = intentSnapshot.data();
        if (!currentIntent || currentIntent.intentId !== resolved.document.intentId || currentIntent.immutableFingerprint !== resolved.document.immutableFingerprint) {
          fail(FAILURE_CODES.LIFECYCLE_TIME_INTENT_IDENTITY_MISMATCH, 'intent changed before final CAS');
        }
        resolvedMillis(currentIntent.authoritativeTime);
        return callback(transaction);
      }),
    });
  }

  async function finalizeLifecycleTransition(operation, input, context) {
    const resolved = await createLifecycleTimeIntent(operation, input, context);
    const dependencies = {
      transactionStore: boundTransactionStore(resolved),
      authorityReader,
      serverTime: { now: async () => resolved.authoritativeTimeMs },
    };
    const method = operation === 'claim' ? lifecycle.claimTeachingExecution
      : operation === 'renew' ? lifecycle.renewTeachingExecution
        : lifecycle.takeoverTeachingExecution;
    return method(input, context, dependencies);
  }

  async function reserveTeachingExecution(request, context) {
    return coordinator.reserveTeachingExecution(request, context, { transactionStore: { runTransaction: reservationRunTransaction }, authorityReader });
  }

  return Object.freeze({
    INTENT_SCHEMA,
    INTENT_COLLECTION,
    FAILURE_CODES,
    runTransaction,
    get,
    create,
    set,
    update,
    delete: deleteDocument,
    casUpdate,
    createLifecycleTimeIntent,
    readResolvedLifecycleTimeIntent,
    finalizeLifecycleTransition,
    claimTeachingExecution: (input, context) => finalizeLifecycleTransition('claim', input, context),
    renewTeachingExecution: (input, context) => finalizeLifecycleTransition('renew', input, context),
    takeoverTeachingExecution: (input, context) => finalizeLifecycleTransition('takeover', input, context),
    reserveTeachingExecution,
  });
}

module.exports = Object.freeze({
  INTENT_SCHEMA,
  INTENT_COLLECTION,
  FAILURE_CODES,
  createAdapter,
});
