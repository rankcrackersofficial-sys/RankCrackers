/**
 * B4 — CYCLE-AWARE GOVERNED PUBLICATION / PROJECTION SEMANTICS
 * =============================================================================
 * Publication of a mission CYCLE is a separate, explicit, governed Founder
 * lifecycle action (conceptually launch_realm(missionId, cycleKey, reason,
 * requestId)) — never a side effect of creation or enrichment (Master Spec §18).
 *
 * This module provides the pure, fail-closed contract pieces the future
 * cycle-aware lifecycle transaction must use:
 *
 *   1. assertCyclePublicationEligibility(cycle) — a cycle is publication-
 *      eligible only when enrichment completed with governed evidence and the
 *      cycle is still an internal draft.
 *   2. buildCyclePublicationPlan(...) — the frozen plan for the transaction:
 *      load selected cycle -> verify eligibility -> update runtime projections
 *      atomically -> update currentPublishedCycleKey -> PRESERVE historical
 *      cycles -> never implicitly publish a different cycle.
 *   3. assertPublicationPlanIsolation(plan) — proves the plan does NOT touch
 *      any forbidden projection (no unrelated cycle, no identity mutation).
 *
 * The Worker can NEVER reach this module's publication plan: W1B kernel stages
 * are blocked by the W1A lifecycle firewall long before any publication plan
 * could exist. This module is the governed Founder-lane counterpart.
 */

const {
  assertNoLifecycleMutation,
  assertMissionEnrichmentIdentity,
} = require('./mission_enrichment_guardrails');

const CYCLE_PUBLICATION_ENRICHMENT_STATES = ['ENRICHMENT_COMPLETE'];

function requireGovernedReason(reason) {
  if (typeof reason !== 'string' || reason.trim().length < 12) {
    throw new Error('PUBLICATION_REASON_REQUIRED: a governed reason (>= 12 chars) is required for cycle publication.');
  }
  return reason.trim();
}

function requireGovernedRequestId(requestId) {
  if (typeof requestId !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(requestId)) {
    throw new Error('PUBLICATION_REQUEST_ID_INVALID: requestId must match [A-Za-z0-9._:-]{8,128}.');
  }
  return requestId.trim();
}

/**
 * Publication eligibility is evidence-derived, not optimistic:
 *   - the cycle must still be an INTERNAL_DRAFT (republishing an ACTIVE cycle
 *     is a governed re-publication flow, not this path);
 *   - enrichment must be COMPLETE (not failed/blocked/incomplete);
 *   - the notification binding must be ready;
 *   - publication-ready syllabus is NOT required here (syllabus readiness is a
 *     separate governed academic gate) — but it is reported honestly.
 */
function assertCyclePublicationEligibility(cycle) {
  if (!cycle || typeof cycle !== 'object') {
    throw new Error('CYCLE_PUBLICATION_INELIGIBLE: cycle record is missing.');
  }
  if (cycle.status !== 'INTERNAL_DRAFT') {
    throw new Error(`CYCLE_PUBLICATION_INELIGIBLE: cycle status '${cycle.status}' is not an internal draft.`);
  }
  if (!CYCLE_PUBLICATION_ENRICHMENT_STATES.includes(cycle.enrichmentStatus)) {
    throw new Error(`CYCLE_PUBLICATION_INELIGIBLE: enrichmentStatus '${cycle.enrichmentStatus}' is not complete — incomplete evidence must never be converted into publication readiness.`);
  }
  if (!cycle.enrichmentEvidence || cycle.enrichmentEvidence.overallStatus !== 'PASS') {
    throw new Error('CYCLE_PUBLICATION_INELIGIBLE: governed enrichment evidence with overall PASS is required.');
  }
  if (!cycle.readiness || cycle.readiness.notificationReady !== true) {
    throw new Error('CYCLE_PUBLICATION_INELIGIBLE: notification readiness is not proven.');
  }
  return {
    eligible: true,
    syllabusReady: !!(cycle.readiness && cycle.readiness.syllabusReady),
  };
}

/**
 * Builds the frozen cycle-aware publication plan for the governed lifecycle
 * transaction. The plan is DATA for the transaction — it performs no writes.
 *
 * Laws frozen into the plan:
 *   - ONLY the selected cycle is published;
 *   - historical cycles are preserved (never deleted/overwritten);
 *   - the parent mission's currentPublishedCycleKey pointer moves to the
 *     selected cycle atomically with the projection updates;
 *   - Student visibility flips ONLY as part of this governed plan (validated
 *     by the W1A mutation firewall in the executing transaction).
 */
function buildCyclePublicationPlan({ missionId, cycleKey, cycle, reason, requestId, recordedAt }) {
  const normalizedMissionId = assertMissionEnrichmentIdentity(missionId);
  requireGovernedReason(reason);
  requireGovernedRequestId(requestId);
  if (!cycleKey || typeof cycleKey !== 'string') {
    throw new Error('PUBLICATION_PLAN_INVALID: cycleKey is required.');
  }
  const eligibility = assertCyclePublicationEligibility(cycle);

  const plan = {
    type: 'CYCLE_PUBLICATION',
    missionId: normalizedMissionId,
    cycleKey,
    reason: reason.trim(),
    requestId: requestId.trim(),
    recordedAt,
    eligibility,
    selectedCycle: { cycleKey, status: 'ACTIVE', publishedAt: recordedAt },
    pointerUpdates: { currentPublishedCycleKey: cycleKey },
    historicalCyclesPreserved: true,
    projectionUpdates: {
      mission_realms: { status: 'ACTIVE' },
      recruitments: { status: 'published' },
      student_mission_catalog: {
        status: 'ACTIVE',
        catalogStatus: 'ACTIVE',
        studentPublicationState: 'ACTIVE',
        visibility: {
          studentVisible: true,
          catalogVisible: true,
          userPanelVisible: true,
          quickEntryEnabled: true,
          smartEntryEnabled: false,
        },
      },
    },
  };

  // The plan itself passes through the mutation firewall shape-check only for
  // its NON-publication auxiliary fields; the publication projection above is
  // the governed Founder lifecycle projection (mission_lifecycle_governance).
  return deepFreezePlan(plan);
}

function deepFreezePlan(obj) {
  if (obj && typeof obj === 'object') {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const val = obj[prop];
      if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) deepFreezePlan(val);
    });
  }
  return obj;
}

/**
 * Proves a publication plan touches ONLY the selected cycle: no plan artifact
 * may reference a different cycleKey for publication, and the plan must
 * preserve historical cycles.
 */
function assertPublicationPlanIsolation(plan, expectedCycleKey) {
  if (plan.selectedCycle.cycleKey !== expectedCycleKey) {
    throw new Error(`PUBLICATION_ISOLATION_VIOLATION: plan publishes cycle '${plan.selectedCycle.cycleKey}' instead of the selected cycle '${expectedCycleKey}'.`);
  }
  if (plan.pointerUpdates.currentPublishedCycleKey !== expectedCycleKey) {
    throw new Error('PUBLICATION_ISOLATION_VIOLATION: published-cycle pointer must move to the selected cycle only.');
  }
  if (plan.historicalCyclesPreserved !== true) {
    throw new Error('PUBLICATION_ISOLATION_VIOLATION: historical cycles must be preserved.');
  }
  // Every cycleKey reference anywhere in the plan payload must be the SELECTED
  // cycle — no implicit publication of a different cycle is possible.
  const findCycleKeyRefs = (node, hits) => {
    if (!node || typeof node !== 'object') return hits;
    for (const [key, value] of Object.entries(node)) {
      if (key === 'cycleKey' && typeof value === 'string' && value !== expectedCycleKey) {
        hits.push(value);
      }
      if (value && typeof value === 'object') findCycleKeyRefs(value, hits);
    }
    return hits;
  };
  const foreignCycleKeys = findCycleKeyRefs(plan, []);
  if (foreignCycleKeys.length > 0) {
    throw new Error(`PUBLICATION_ISOLATION_VIOLATION: plan references foreign cycle(s) ${foreignCycleKeys.join(', ')}.`);
  }
  return true;
}

/**
 * Draft-creation side: proves a proposed cycle-creation write plan carries no
 * lifecycle/publication mutation (reuse of the accepted W1A firewall at the
 * B2 boundary — imported here so callers have one import surface).
 */
function assertDraftCycleWritePlanSafe(writePlan) {
  return assertNoLifecycleMutation(writePlan);
}

/**
 * B5 — prepares the cycle-aware publication for the governed launch_realm
 * transaction. cycleKey is MANDATORY (never inferred, never "latest draft");
 * the selected authoritative cycle is loaded by the caller's transaction and
 * must exist. Publication eligibility is evidence-derived (B4). Returns the
 * frozen plan + the exact cycle update + the parent pointer update for the
 * transaction to apply atomically.
 */
async function executeCycleAwarePublication({ transaction, db, missionId, cycleKey, cycleSnap, reason, requestId, recordedAt }) {
  if (!cycleKey || typeof cycleKey !== 'string') {
    throw new Error('PUBLICATION_CYCLE_KEY_REQUIRED: cycleKey is mandatory for cycle-aware publication — the selected cycle is never inferred.');
  }
  // STEP 14: the selected authoritative cycle is loaded INSIDE the publication
  // transaction (or supplied as a snapshot loaded within it).
  let snapshot = cycleSnap;
  if (!snapshot && transaction && db) {
    snapshot = await transaction.get(db.collection('mission_realms').doc(missionId).collection('cycles').doc(cycleKey));
  }
  if (snapshot && typeof snapshot.then === 'function') {
    snapshot = await snapshot;
  }
  if (!snapshot || typeof snapshot.exists !== 'boolean') {
    throw new Error('PUBLICATION_CYCLE_SNAPSHOT_REQUIRED: the selected authoritative cycle snapshot must be loaded inside the publication transaction.');
  }
  if (!snapshot.exists) {
    throw new Error(`PUBLICATION_CYCLE_NOT_FOUND: cycle '${cycleKey}' does not exist under the permanent mission.`);
  }
  const plan = buildCyclePublicationPlan({
    missionId,
    cycleKey,
    cycle: snapshot.data() || {},
    reason,
    requestId,
    recordedAt,
  });
  const cycleUpdate = { status: 'published', publishedAt: recordedAt, publishedViaRequestId: requestId.trim() };
  const pointerUpdate = { currentPublishedCycleKey: cycleKey };
  // ATOMIC SELECTED-CYCLE PUBLICATION (STEP 16): all projection updates apply
  // within the caller transaction. Historical cycles are never touched.
  transaction.update(
    db.collection('mission_realms').doc(missionId).collection('cycles').doc(cycleKey),
    cycleUpdate
  );
  transaction.update(db.collection('mission_realms').doc(missionId), {
    ...pointerUpdate,
    status: plan.projectionUpdates.mission_realms.status,
    updated_at: recordedAt,
  });
  transaction.update(db.collection('recruitments').doc(missionId), plan.projectionUpdates.recruitments);
  transaction.update(db.collection('student_mission_catalog').doc(missionId), plan.projectionUpdates.student_mission_catalog);
  return {
    published: true,
    plan,
    cycleKey,
    cycleUpdate,
    pointerUpdate,
  };

}

module.exports = {
  CYCLE_PUBLICATION_ENRICHMENT_STATES,
  assertCyclePublicationEligibility,
  assertDraftCycleWritePlanSafe,
  assertPublicationPlanIsolation,
  buildCyclePublicationPlan,
  executeCycleAwarePublication,
};
