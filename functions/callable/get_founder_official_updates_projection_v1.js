/**
 * 🔱 FOUNDER OFFICIAL UPDATES PROJECTION V1 CALLABLE
 * Command: RC-AUTHORITY-WATCH-R4A-FOUNDER-GOVERNED-PROJECTION-RUNTIME-ENDPOINT-AG1-20260916
 *
 * Laws:
 *   - Strictly Founder clearance required: auth.token.founder === true.
 *   - Student / Non-Founder: DENIED with permission-denied.
 *   - Unauthenticated: DENIED with unauthenticated.
 *   - Pure deterministic projection layer over raw events without modifying physical stored fields.
 *   - Zero mutation: strictly read-only execution (0 Firestore writes).
 *   - Controlled summary windows: SINCE_LAST_CLEAN_SCAN, TODAY_IST, LAST_6_HOURS_IST.
 *   - Window filtering on "new" events strictly uses governed trusted admission evidence, NEVER raw discoveredAt alone.
 *   - Truthful review state: reviewStateSupported = false, unreviewedTrustedCount = null.
 *   - Zero client injection of trust state or mission binding.
 */

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {
  buildFounderGovernedProjection,
  projectAuthorityEvent,
} = require('../services/authority_intelligence/trusted_founder_projection');
const { TRUST_STATES } = require('../services/authority_intelligence/registry_schema');

const PROJECTION_VERSION = 'R4A_20260916';
const TIMEZONE_IST = 'Asia/Kolkata';
const ALLOWED_WINDOWS = Object.freeze([
  'SINCE_LAST_CLEAN_SCAN',
  'TODAY_IST',
  'LAST_6_HOURS_IST',
]);

/**
 * Asserts caller holds active Founder authorization.
 * Denies student, non-founder, and unauthenticated callers before any Firestore read.
 */
function assertFounderAuthorized(auth) {
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');
  }
  if (!auth.token || auth.token.founder !== true) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required.');
  }
}

/**
 * Safely parses any Firestore Timestamp, serialized Timestamp object, ISO string, or Date.
 */
function parseTimestampToIso(val) {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch (_) {
      return null;
    }
  }
  if (typeof val === 'object') {
    if (val._seconds !== undefined || val.seconds !== undefined) {
      const sec = val._seconds !== undefined ? val._seconds : val.seconds;
      const nsec = val._nanoseconds !== undefined ? val._nanoseconds : (val.nanoseconds || 0);
      const d = new Date(sec * 1000 + Math.floor(nsec / 1000000));
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Computes window boundaries based on requested window identifier and anchor timestamp.
 */
function computeWindowBoundaries(window, now, lastCleanRunIso, minBaselineIso) {
  const nowIso = now.toISOString();
  let windowStartIso = null;
  const windowEndIso = nowIso;

  if (window === 'SINCE_LAST_CLEAN_SCAN') {
    windowStartIso = lastCleanRunIso || minBaselineIso || null;
  } else if (window === 'TODAY_IST') {
    // Asia/Kolkata is UTC + 5:30 (330 minutes)
    const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const startOfTodayIstUtcMs =
      Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0) - IST_OFFSET_MS;
    windowStartIso = new Date(startOfTodayIstUtcMs).toISOString();
  } else if (window === 'LAST_6_HOURS_IST') {
    windowStartIso = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
  }

  return { windowStartIso, windowEndIso };
}

/**
 * Resolves the governed trusted boundary ISO timestamp for a projected event.
 * Enforces: NEVER uses raw discoveredAt alone to establish freshness.
 */
function getGovernedTrustedBoundaryIso(projected, rawEvt) {
  if (projected.trustState !== TRUST_STATES.TRUSTED_CURRENT) {
    return null;
  }
  return (
    projected.freshnessEvidence?.boundaryIso ||
    projected.freshnessProof?.provenPublicationDate ||
    rawEvt?.admissionTimestamp ||
    rawEvt?.publicationDate ||
    (projected.freshnessProof?.isFresh ? (rawEvt?.discoveredAtIso || rawEvt?.discoveredAt) : null) ||
    null
  );
}

/**
 * Evaluates Watch worker health state.
 */
function evaluateWatchHealthState(watchDocData) {
  if (!watchDocData) return 'UNKNOWN';
  if (
    watchDocData.status === 'DEGRADED' ||
    (watchDocData.failedAuthorities !== undefined && watchDocData.failedAuthorities > 0) ||
    watchDocData.success === false
  ) {
    return 'DEGRADED';
  }
  if (
    watchDocData.status === 'ONLINE' ||
    watchDocData.success === true ||
    (watchDocData.completedAuthorities > 0 && watchDocData.failedAuthorities === 0)
  ) {
    return 'HEALTHY';
  }
  return 'UNKNOWN';
}

/**
 * Core execution engine for Founder Official Updates Projection V1.
 * Pure server-side read-only; zero mutation to database or inputs.
 */
async function executeFounderOfficialUpdatesProjection({
  db = null,
  window = 'SINCE_LAST_CLEAN_SCAN',
  nowIso = null,
  rawEvents = null,
  watchDocData = null,
} = {}) {
  const now = nowIso ? new Date(nowIso) : new Date();
  const generatedAt = now.toISOString();

  // 1. Retrieve Authority Watch worker state and telemetry
  let resolvedWatchData = watchDocData;
  if (!resolvedWatchData && db) {
    try {
      const watchSnap = await db.collection('worker_registry').doc('authority_watch').get();
      if (watchSnap && watchSnap.exists) {
        resolvedWatchData = watchSnap.data();
      }
    } catch (_) {
      resolvedWatchData = null;
    }
  }

  // 2. Extract run evidence
  const runEvidence = resolvedWatchData ? {
    lastRunAt: parseTimestampToIso(resolvedWatchData.lastRunAt) || null,
    lastSuccessAt: parseTimestampToIso(resolvedWatchData.lastSuccessAt) || null,
    status: resolvedWatchData.status || null,
    success: typeof resolvedWatchData.success === 'boolean' ? resolvedWatchData.success : null,
    totalAuthorities: Number(resolvedWatchData.totalAuthorities || 0),
    attemptedAuthorities: Number(resolvedWatchData.attemptedAuthorities || 0),
    completedAuthorities: Number(resolvedWatchData.completedAuthorities || 0),
    completedWithErrorsAuthorities: Number(resolvedWatchData.completedWithErrorsAuthorities || 0),
    failedAuthorities: Number(resolvedWatchData.failedAuthorities || 0),
    notReachedAuthorities: Number(resolvedWatchData.notReachedAuthorities || 0),
    totalNewEvents: Number(resolvedWatchData.totalNewEvents || 0),
    totalDuplicates: Number(resolvedWatchData.totalDuplicates || 0),
    totalCandidatesDetected: Number(resolvedWatchData.totalCandidatesDetected || 0),
    totalErrors: Number(resolvedWatchData.totalErrors || 0),
    durationMs: Number(resolvedWatchData.durationMs || 0),
  } : {
    lastRunAt: null,
    lastSuccessAt: null,
    status: 'UNKNOWN',
    success: null,
    totalAuthorities: 0,
    attemptedAuthorities: 0,
    completedAuthorities: 0,
    completedWithErrorsAuthorities: 0,
    failedAuthorities: 0,
    notReachedAuthorities: 0,
    totalNewEvents: 0,
    totalDuplicates: 0,
    totalCandidatesDetected: 0,
    totalErrors: 0,
    durationMs: 0,
  };

  // 3. Extract baseline evidence
  const rawBaselines = (resolvedWatchData && resolvedWatchData.authorityBaselines) || {};
  const authorityBaselines = {};
  const baselineIsoList = [];
  for (const [authKey, rawVal] of Object.entries(rawBaselines)) {
    const iso = parseTimestampToIso(rawVal);
    if (iso) {
      authorityBaselines[authKey] = iso;
      baselineIsoList.push(iso);
    }
  }
  baselineIsoList.sort();

  const baselineEvidence = {
    authorityBaselines,
    totalBaselines: Object.keys(authorityBaselines).length,
    minBaselineIso: baselineIsoList.length > 0 ? baselineIsoList[0] : null,
    maxBaselineIso: baselineIsoList.length > 0 ? baselineIsoList[baselineIsoList.length - 1] : null,
  };

  // 4. Resolve last clean run timestamp
  const lastCleanAuthorityWatchRunAt =
    parseTimestampToIso(resolvedWatchData?.lastSuccessAt) ||
    (resolvedWatchData?.success === true ? parseTimestampToIso(resolvedWatchData?.lastRunAt) : null) ||
    null;

  // 5. Compute window boundary timestamps
  const { windowStartIso, windowEndIso } = computeWindowBoundaries(
    window,
    now,
    lastCleanAuthorityWatchRunAt,
    baselineEvidence.minBaselineIso
  );

  // 6. Retrieve raw authority events
  let rawList = [];
  if (Array.isArray(rawEvents)) {
    rawList = rawEvents;
  } else if (db) {
    const eventsSnap = await db.collection('authority_intelligence_events').get();
    if (eventsSnap && eventsSnap.docs) {
      rawList = eventsSnap.docs.map((doc) => ({
        eventId: doc.id,
        ...doc.data(),
      }));
    }
  }

  // 7. Perform deterministic R4 governed projection
  const projectionResult = buildFounderGovernedProjection(rawList, {
    forwardWindowStart: windowStartIso,
    forwardWindowEnd: windowEndIso,
  });

  const projections = projectionResult.projections || [];

  // 8. Filter trusted events within requested window using governed boundary
  const trustedInWindow = [];
  for (let i = 0; i < projections.length; i++) {
    const p = projections[i];
    const raw = rawList[i];
    if (p.trustState !== TRUST_STATES.TRUSTED_CURRENT) {
      continue;
    }
    const boundary = getGovernedTrustedBoundaryIso(p, raw);
    if (!boundary) {
      continue;
    }
    if (windowStartIso && boundary < windowStartIso) {
      continue;
    }
    if (windowEndIso && boundary > windowEndIso) {
      continue;
    }
    trustedInWindow.push({ projected: p, boundary });
  }

  // 9. Derive aggregate metrics
  const trustedCurrentCount = trustedInWindow.length;
  let newestTrustedEventAt = null;
  if (trustedCurrentCount > 0) {
    trustedInWindow.sort((a, b) => (a.boundary > b.boundary ? -1 : a.boundary < b.boundary ? 1 : 0));
    newestTrustedEventAt = trustedInWindow[0].boundary;
  }

  const affectedAuthorities = new Set();
  const affectedMissions = new Set();
  for (const item of trustedInWindow) {
    const p = item.projected;
    if (p.authorityKey) {
      affectedAuthorities.add(p.authorityKey);
    }
    if (p.exactMissionBinding?.isBound && p.exactMissionBinding?.missionId) {
      affectedMissions.add(p.exactMissionBinding.missionId);
    }
  }

  const watchHealthState = evaluateWatchHealthState(resolvedWatchData);
  const contentAlertEligible = trustedCurrentCount > 0;
  const healthAlertEligible = watchHealthState === 'DEGRADED';

  // 10. Construct strict versioned response envelope
  return {
    projectionVersion: PROJECTION_VERSION,
    generatedAt,
    window,
    timezone: TIMEZONE_IST,
    trustedCurrentCount,
    newestTrustedEventAt,
    affectedAuthorityCount: affectedAuthorities.size,
    affectedMissionCount: affectedMissions.size,
    lastCleanAuthorityWatchRunAt,
    lastSuccessfulProjectionAt: generatedAt,
    watchHealthState,
    contentAlertEligible,
    healthAlertEligible,
    reviewStateSupported: false,
    unreviewedTrustedCount: null,
    events: projections,
    runEvidence,
    baselineEvidence,
  };
}

/**
 * Cloud Function Callable HTTPS entry point.
 */
const getFounderOfficialUpdatesProjectionV1 = functions.https.onCall(async (data, context) => {
  const auth = context ? context.auth : null;

  // 1. Strict Founder security authorization BEFORE any Firestore read
  assertFounderAuthorized(auth);

  // 2. Validate window parameter
  let rawWindow = 'SINCE_LAST_CLEAN_SCAN';
  if (data && data.window !== undefined && data.window !== null) {
    rawWindow = String(data.window).trim();
  }
  if (!ALLOWED_WINDOWS.includes(rawWindow)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid window parameter "${rawWindow}". Allowed values: ${ALLOWED_WINDOWS.join(', ')}.`
    );
  }

  // 3. Execute bounded projection (0 writes, pure server-authoritative)
  const db = (data && typeof data.__injectedDb === 'object' && typeof data.__injectedDb.collection === 'function')
    ? data.__injectedDb
    : admin.firestore();
  return await executeFounderOfficialUpdatesProjection({
    db,
    window: rawWindow,
  });
});

module.exports = {
  PROJECTION_VERSION,
  TIMEZONE_IST,
  ALLOWED_WINDOWS,
  assertFounderAuthorized,
  parseTimestampToIso,
  computeWindowBoundaries,
  getGovernedTrustedBoundaryIso,
  evaluateWatchHealthState,
  executeFounderOfficialUpdatesProjection,
  getFounderOfficialUpdatesProjectionV1,
};
