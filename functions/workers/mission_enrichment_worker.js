/**
 * W1 — UNIFIED MISSION ENRICHMENT WORKER
 * =============================================================================
 * Live integration of the accepted pure foundation:
 *   W1A guardrails  -> identity, deterministic task key, lifecycle firewall, evidence
 *   W1B kernel      -> deterministic six-stage execution (PASS/FAIL/BLOCKED/NOT_TESTED)
 *   W1C stage graph -> canonical topology (SOURCE_RESOLVE -> HASH_BIND ->
 *                      ROLE_CLASSIFY -> {VARIABLE_EXTRACTION, SYLLABUS_HANDOFF}
 *                      -> EVIDENCE_FINALIZE)
 *   B3 source law   -> official/English/hash binding proof (rebind, never downgrade)
 *
 * The worker consumes a governed INTERNAL_DRAFT cycle
 * (mission_realms/{missionId}/cycles/{cycleKey}, enrichmentStatus
 * PENDING_ENRICHMENT), injects GENERIC live handlers, executes the canonical
 * graph, and writes immutable enrichment evidence back to the SAME cycle
 * document. Nothing else is written.
 *
 * LIVE-EXECUTION MODEL: the W1B kernel is FROZEN and executes SYNCHRONOUS
 * handlers (deterministic replay law). This coordinator therefore PRELOADS all
 * bound source data into memory first (the only I/O in the pipeline), then the
 * six injected handlers operate synchronously over that immutable preload —
 * keeping the frozen kernel byte-identical while the live data flow stays
 * real. Handler results are plain data; the kernel records them verbatim.
 *
 * The worker NEVER: creates identity, invents cycle keys, publishes, sets
 * Student visibility, enables quick/smart start, invokes lifecycle actions, or
 * branches by exam/authority/state. All differences arrive as DATA on the
 * cycle record. Enrichment statuses are enrichment-domain states
 * (ENRICHMENT_COMPLETE / ENRICHMENT_INCOMPLETE / ENRICHMENT_BLOCKED /
 * ENRICHMENT_FAILED) and are NOT publication states.
 */

'use strict';

const crypto = require('crypto');

const {
  buildCanonicalMissionEnrichmentStages,
} = require('../services/mission_enrichment_stage_graph');
const {
  createMissionEnrichmentRun,
  executeMissionEnrichmentRun,
} = require('../services/mission_enrichment_orchestrator_kernel');
const {
  assertMissionEnrichmentIdentity,
  assertNoLifecycleMutation,
  buildMissionEnrichmentTaskKey,
} = require('../services/mission_enrichment_guardrails');
const {
  preflightSourceBinding,
} = require('../services/mission_source_preflight');

const WORKER_ID = 'unified_mission_enrichment_worker';
const WORKER_CONTRACT_VERSION = 'unified_worker_v1';

const OVERALL_TO_ENRICHMENT_STATUS = {
  PASS: 'ENRICHMENT_COMPLETE',
  FAIL: 'ENRICHMENT_FAILED',
  BLOCKED: 'ENRICHMENT_BLOCKED',
  NOT_TESTED: 'ENRICHMENT_INCOMPLETE',
};

// Generic variable families (DATA, not control flow): AI-refined official
// notification fields mapped to governed mission-variable families with
// per-field provenance. No exam/authority/state branching.
const VARIABLE_FAMILY_FIELD_MAP = {
  date_variables: ['exam_date', 'application_start_date', 'application_end_date', 'admit_card_date', 'result_date', 'notification_release_date'],
  vacancy_variables: ['total_vacancies', 'vacancies', 'post_wise_vacancies'],
  fee_variables: ['application_fee'],
  eligibility_variables: ['eligibility', 'age_limit', 'special_eligibility_conditions'],
  link_variables: ['important_links', 'official_website'],
  department_variables: ['department', 'posts', 'post_names'],
};

function buildStableStringify(value) {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') {
    const primitive = JSON.stringify(value);
    return primitive === undefined ? 'null' : primitive;
  }
  if (Array.isArray(value)) return '[' + value.map(buildStableStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + buildStableStringify(value[k])).join(',') + '}';
}

function digestOf(value) {
  return crypto.createHash('sha256').update(buildStableStringify(value)).digest('hex');
}

/**
 * Extracts generic mission-variable families from an official notification's
 * AI-refined rawData. Every extracted value carries field-level provenance.
 */
function extractGenericVariableFamilies(rawData, sourceId) {
  if (!rawData || typeof rawData !== 'object') return [];
  const families = [];
  for (const [family, fields] of Object.entries(VARIABLE_FAMILY_FIELD_MAP)) {
    const values = [];
    for (const field of fields) {
      if (rawData[field] !== undefined && rawData[field] !== null && rawData[field] !== '') {
        values.push({ field, value: rawData[field], provenance: { sourceDocumentId: sourceId, field } });
      }
    }
    if (values.length > 0) families.push({ family, values });
  }
  return families;
}

/**
 * PRELOAD PHASE (the only I/O): loads every bound source draft and its
 * immutable ingestion record into memory before graph execution.
 */
async function preloadSourceData({ db, missionId, wantedSources }) {
  const preloaded = {};
  for (const want of wantedSources) {
    const draftSnap = await db.collection('sentinel_drafts').doc(want.sourceId).get();
    const refinerySnap = await db.collection('ingestion_refinery').doc(want.sourceId).get();
    let draft = draftSnap.exists ? (draftSnap.data() || {}) : null;
    // URL-based official acquisition persists its governed source in the
    // mission realm rather than the legacy sentinel draft collection. Build a
    // read-only enrichment projection from that verified record; no upload or
    // human review is introduced.
    if (!draft && missionId) {
      const officialSnap = await db.collection('mission_realms').doc(missionId)
        .collection('official_documents').doc(want.sourceId).get();
      if (officialSnap.exists) {
        const source = officialSnap.data() || {};
        draft = {
          status: String(source.verificationState || source.status || '').toLowerCase(),
          sourceType: source.sourceType,
          governanceStatus: source.governanceStatus,
          isOfficial: source.isOfficial,
          officialDomain: source.officialDomain,
          language: source.language,
          fileHash: source.sha256 || source.actualSha256,
          actualSha256: source.actualSha256,
          authorityKey: source.authorityKey,
          linkedRealmId: source.boundMissionId,
          linkedCycleKey: source.boundCycleKey,
          rawData: {
            official_website: source.sourceUrl || source.originUrl || source.officialDomain,
            source_sha256: source.sha256 || source.actualSha256,
            source_type: source.sourceType,
          },
        };
      }
    }
    preloaded[want.sourceId] = {
      expectedSourceType: want.sourceType,
      versionRef: want.binding ? want.binding.versionRef : null,
      draft,
      ingestionRecord: refinerySnap.exists ? (refinerySnap.data() || {}) : null,
    };
  }
  return preloaded;
}

/**
 * The canonical live enrichment execution for one mission cycle.
 * The only I/O is the preload phase and the final evidence write; the six
 * canonical stages execute synchronously inside the frozen W1B kernel.
 */
async function executeMissionEnrichmentCycle({ db, missionId, cycleKey, cycleData, recordedAt }) {
  if (!db) throw new Error('ENRICHMENT_DB_REQUIRED: db handle is required.');
  const normalizedMissionId = assertMissionEnrichmentIdentity(missionId);
  if (!cycleKey || typeof cycleKey !== 'string') {
    throw new Error('ENRICHMENT_CYCLE_KEY_REQUIRED: cycleKey is required.');
  }
  const cycle = cycleData || {};

  // Idempotency gate: only a pending cycle is enriched; an already-processed
  // task key is never re-executed (replay returns without any write).
  if (cycle.enrichmentStatus && cycle.enrichmentStatus !== 'PENDING_ENRICHMENT') {
    return { skipped: true, reason: `enrichmentStatus '${cycle.enrichmentStatus}' is not PENDING_ENRICHMENT`, missionId: normalizedMissionId, cycleKey };
  }

  const notificationBinding = cycle.notificationBinding || null;
  const syllabusBinding = cycle.syllabusBinding || null;
  const syllabusBindingMode = cycle.syllabusBindingMode || null;
  if (!notificationBinding || !notificationBinding.sourceId) {
    throw new Error('ENRICHMENT_NOTIFICATION_BINDING_REQUIRED: the cycle carries no notification binding.');
  }

  const taskKey = buildMissionEnrichmentTaskKey({
    missionId: normalizedMissionId,
    sourceIdentityTokens: [
      cycleKey,
      notificationBinding.sourceId,
      syllabusBinding && syllabusBinding.sourceId ? syllabusBinding.sourceId : '',
      syllabusBindingMode || '',
    ],
    workerContractVersion: WORKER_CONTRACT_VERSION,
  });

  if (cycle.enrichmentTaskKey === taskKey && cycle.enrichmentEvidence) {
    return { idempotent: true, missionId: normalizedMissionId, cycleKey, taskKey };
  }

  const cycleRef = db.collection('mission_realms').doc(normalizedMissionId).collection('cycles').doc(cycleKey);

  // ----- PRELOAD (single I/O phase) ------------------------------------------
  const wantedSources = [{ sourceId: notificationBinding.sourceId, sourceType: 'notification', binding: notificationBinding }];
  if (syllabusBindingMode === 'SEPARATE' && syllabusBinding && syllabusBinding.sourceId) {
    wantedSources.push({ sourceId: syllabusBinding.sourceId, sourceType: 'syllabus', binding: syllabusBinding });
  }
  const preloaded = await preloadSourceData({ db, missionId: normalizedMissionId, wantedSources });

  // ----- generic stage handlers (sync, injected into the canonical W1C graph) --

  const handlers = {};

  handlers.SOURCE_RESOLVE = () => {
    const resolvedSources = [];
    for (const want of wantedSources) {
      const loaded = preloaded[want.sourceId];
      if (!loaded || !loaded.draft) {
        return {
          status: 'FAIL',
          failure: { reason: 'SOURCE_UNRESOLVED', errorMessage: `bound source '${want.sourceId}' no longer exists` },
        };
      }
      const draft = loaded.draft;
      const isOfficial = Boolean(draft.isOfficial === true || (draft.rawData && draft.rawData.isOfficial === true));
      const rawDomain = draft.officialDomain || (draft.rawData && (draft.rawData.official_website || draft.rawData.officialDomain || draft.rawData.official_domain)) || null;
      const officialDomain = typeof rawDomain === 'string' && rawDomain.trim().length > 0 ? rawDomain.trim() : null;
      const rawLang = draft.language || (draft.rawData && draft.rawData.language) || null;
      const language = typeof rawLang === 'string' && rawLang.trim().length > 0 ? rawLang.trim() : null;
      const fileHash = draft.fileHash || draft.sourceSha256 || (draft.rawData && (draft.rawData.fileHash || draft.rawData.sourceSha256)) || null;
      const actualSha256 = draft.actualSha256 || null;
      const authorityKey = draft.authorityKey || null;
      const certifiedSourceType = typeof draft.sourceType === 'string' && draft.sourceType.trim().length > 0 ? draft.sourceType.trim() : null;
      const governanceStatus = typeof draft.governanceStatus === 'string' && draft.governanceStatus.trim().length > 0 ? draft.governanceStatus.trim() : null;

      resolvedSources.push({
        sourceId: want.sourceId,
        sourceType: certifiedSourceType,
        expectedSourceType: want.sourceType,
        boundVersionRef: loaded.versionRef,
        draft: {
          type: draft.type || null,
          status: draft.status || null,
          sourceType: certifiedSourceType,
          governanceStatus,
          fileHash,
          actualSha256,
          isOfficial,
          officialDomain,
          language,
          authorityKey,
          boundMissionId: draft.linkedRealmId || null,
          boundCycleKey: draft.linkedCycleKey || null,
          rawData: draft.rawData || null,
        },
      });
    }
    return { status: 'PASS', result: { resolvedSources } };
  };

  handlers.HASH_BIND = (ctx) => {
    const prior = ctx.priorStageResults.SOURCE_RESOLVE;
    if (!prior || prior.status !== 'PASS') {
      return { status: 'FAIL', failure: { reason: 'DEPENDENCY_MISSING', errorMessage: 'resolved sources unavailable' } };
    }
    const resolvedSources = prior.result.result.resolvedSources;
    const bindings = [];
    for (const source of resolvedSources) {
      const expectedSha = source.draft.fileHash;
      const report = preflightSourceBinding({
        source: {
          sourceId: source.sourceId,
          sourceType: source.sourceType,
          governanceStatus: source.draft.governanceStatus,
          verificationState: source.draft.status === 'verified' ? 'verified' : (source.draft.status || 'unknown'),
          isOfficial: source.draft.isOfficial,
          officialDomain: source.draft.officialDomain,
          language: source.draft.language,
          expectedSha256: expectedSha,
          actualSha256: source.draft.actualSha256,
          authorityKey: source.draft.authorityKey || null,
          boundMissionId: source.draft.boundMissionId || null,
          boundCycleKey: source.draft.boundCycleKey || null,
          ingestionProof: null, // R2/C1: unproven refinery trust disabled
        },
        expectation: {
          missionId: normalizedMissionId,
          cycleKey,
          sourceType: source.expectedSourceType,
          authorityKey: cycle.authorityKey || null,
          expectedSha256: expectedSha,
        },
      });
      if (report.status !== 'PASS') {
        return {
          status: 'FAIL',
          failure: { reason: 'SOURCE_INTEGRITY_FAILED', errorMessage: `${source.sourceId}: ${report.failures.map(f => f.code).join(',')}` },
        };
      }
      bindings.push({
        sourceId: source.sourceId,
        sourceType: source.sourceType,
        method: 'ACTUAL_BYTES',
        sha256: expectedSha,
      });
    }
    // resolvedSources carried forward along the canonical dependency edge.
    return { status: 'PASS', result: { hashBindings: bindings, resolvedSources } };
  };

  handlers.ROLE_CLASSIFY = (ctx) => {
    const prior = ctx.priorStageResults.HASH_BIND;
    if (!prior || prior.status !== 'PASS') {
      return { status: 'FAIL', failure: { reason: 'DEPENDENCY_MISSING', errorMessage: 'hash-bound sources unavailable' } };
    }
    // DATA-driven generic roles: from sourceType + governed binding mode only.
    const roles = [];
    for (const binding of prior.result.result.hashBindings) {
      if (binding.sourceType === 'notification') {
        roles.push({ sourceId: binding.sourceId, role: 'RECRUITMENT_NOTIFICATION' });
        if (syllabusBindingMode === 'EMBEDDED') {
          roles.push({ sourceId: binding.sourceId, role: 'EMBEDDED_SYLLABUS_CANDIDATE', evidenceState: 'PENDING_SECTION_EVIDENCE' });
        }
      }
      if (binding.sourceType === 'syllabus') {
        roles.push({ sourceId: binding.sourceId, role: 'SEPARATE_SYLLABUS_SOURCE' });
      }
    }
    // Carrier stage: downstream stages receive source data along their own
    // declared dependency edges (the kernel provides only declared deps).
    return {
      status: 'PASS',
      result: { roles, hashBindings: prior.result.result.hashBindings, resolvedSources: prior.result.result.resolvedSources },
    };
  };

  handlers.VARIABLE_EXTRACTION = (ctx) => {
    const prior = ctx.priorStageResults.ROLE_CLASSIFY;
    if (!prior || prior.status !== 'PASS') {
      return { status: 'FAIL', failure: { reason: 'DEPENDENCY_MISSING', errorMessage: 'classified sources unavailable' } };
    }
    const notification = prior.result.result.resolvedSources.find(s => s.sourceType === 'notification');
    const rawData = notification && notification.draft ? notification.draft.rawData : null;
    const families = extractGenericVariableFamilies(rawData, notification ? notification.sourceId : null);
    if (families.length === 0) {
      return {
        status: 'FAIL',
        failure: { reason: 'NO_VARIABLE_EVIDENCE', errorMessage: 'no governed variable families could be derived from the official evidence' },
      };
    }
    const variableCount = families.reduce((acc, f) => acc + f.values.length, 0);
    return { status: 'PASS', result: { families, variableCount } };
  };

  handlers.SYLLABUS_HANDOFF = (ctx) => {
    if (syllabusBindingMode === 'PENDING') {
      // Absence is an explicit known governed state — no fabricated syllabus data.
      return { status: 'NOT_TESTED' };
    }
    if (syllabusBindingMode === 'EMBEDDED') {
      // Binding the notification alone is NOT syllabus readiness: explicit
      // embedded-section evidence must be produced under governed review later.
      return { status: 'NOT_TESTED' };
    }
    // SEPARATE: the bound syllabus source must exist and be hash-bound.
    const prior = ctx.priorStageResults.ROLE_CLASSIFY;
    if (!prior || prior.status !== 'PASS') {
      return { status: 'FAIL', failure: { reason: 'DEPENDENCY_MISSING', errorMessage: 'classified sources unavailable' } };
    }
    const syllabusBindingProof = prior.result.result.hashBindings.find(b => b.sourceId === (syllabusBinding && syllabusBinding.sourceId));
    if (!syllabusBindingProof) {
      return { status: 'FAIL', failure: { reason: 'SYLLABUS_NOT_BOUND', errorMessage: 'separate syllabus source is not hash-bound to this cycle' } };
    }
    return {
      status: 'PASS',
      result: { syllabusEvidence: { mode: 'SEPARATE', sourceId: syllabusBindingProof.sourceId, sha256: syllabusBindingProof.sha256 } },
    };
  };

  handlers.EVIDENCE_FINALIZE = (ctx) => {
    const hash = ctx.priorStageResults.HASH_BIND;
    const variables = ctx.priorStageResults.VARIABLE_EXTRACTION;
    const syllabus = ctx.priorStageResults.SYLLABUS_HANDOFF;
    const readiness = {
      notificationReady: true,
      syllabusReady: !!(syllabus && syllabus.status === 'PASS' && syllabus.result && syllabus.result.result && syllabus.result.result.syllabusEvidence),
    };
    const summary = {
      hashBindings: hash && hash.result ? hash.result.result.hashBindings.length : 0,
      variableFamilies: variables && variables.result ? variables.result.result.families.length : 0,
      variableCount: variables && variables.result ? variables.result.result.variableCount : 0,
      syllabusMode: syllabusBindingMode,
    };
    return { status: 'PASS', result: { readiness, summary } };
  };

  // ----- canonical graph execution (W1C + W1B) -------------------------------

  const stages = buildCanonicalMissionEnrichmentStages({
    SOURCE_RESOLVE: handlers.SOURCE_RESOLVE,
    HASH_BIND: handlers.HASH_BIND,
    ROLE_CLASSIFY: handlers.ROLE_CLASSIFY,
    VARIABLE_EXTRACTION: handlers.VARIABLE_EXTRACTION,
    SYLLABUS_HANDOFF: handlers.SYLLABUS_HANDOFF,
    EVIDENCE_FINALIZE: handlers.EVIDENCE_FINALIZE,
  });

  const run = createMissionEnrichmentRun({
    missionId: normalizedMissionId,
    taskKey,
    workerId: WORKER_ID,
    workerVersion: WORKER_CONTRACT_VERSION,
    stages,
  });

  const result = executeMissionEnrichmentRun(run, {
    input: { cycleKey, syllabusBindingMode, notificationSourceId: notificationBinding.sourceId },
    recordedAt,
  });

  const enrichmentStatus = OVERALL_TO_ENRICHMENT_STATUS[result.overallStatus] || 'ENRICHMENT_FAILED';

  // Readiness facts come from the finalize handler when it executed.
  const finalizeRecord = result.stageResults.find(r => r.stageId === 'EVIDENCE_FINALIZE');
  const finalizeReadiness = finalizeRecord && finalizeRecord.result && finalizeRecord.result.result
    ? finalizeRecord.result.result.readiness
    : { notificationReady: true, syllabusReady: false };

  const update = {
    enrichmentStatus,
    enrichmentTaskKey: taskKey,
    enrichmentEvidence: {
      overallStatus: result.overallStatus,
      runId: result.runId,
      workerId: WORKER_ID,
      workerVersion: WORKER_CONTRACT_VERSION,
      recordedAt,
      inputDigest: result.inputDigest,
      stages: result.stageResults.map(stageResult => ({
        stageId: stageResult.stageId,
        status: stageResult.status,
        blockedBy: stageResult.blockedBy,
        failure: stageResult.failure,
        evidence: stageResult.evidence,
      })),
    },
    readiness: {
      notificationReady: finalizeReadiness.notificationReady === true,
      syllabusReady: finalizeReadiness.syllabusReady === true,
    },
    updatedAt: recordedAt,
  };

  // W1A lifecycle firewall: the enrichment write may never touch publication.
  assertNoLifecycleMutation(update);

  await cycleRef.update(update);

  return {
    enriched: true,
    missionId: normalizedMissionId,
    cycleKey,
    taskKey,
    overallStatus: result.overallStatus,
    enrichmentStatus,
    evidence: { overallStatus: result.overallStatus, stageResults: result.stageResults },
  };
}

// ---- canonical live entry point (one trigger, one responsibility) -----------

let _functionsSdk = null;
let _admin = null;
function getFunctionsSdk() {
  if (_functionsSdk === null) {
    try { _functionsSdk = require('firebase-functions'); } catch (err) { _functionsSdk = false; }
  }
  return _functionsSdk || null;
}
function getAdminSdk() {
  if (_admin === null) {
    try { _admin = require('firebase-admin'); } catch (err) { _admin = false; }
  }
  return _admin || null;
}

const functionsSdk = getFunctionsSdk();
if (functionsSdk) {
  const adminSdk = getAdminSdk();
  exports.missionEnrichmentWorker = functionsSdk.firestore
    .document('mission_realms/{missionId}/cycles/{cycleKey}')
    .onWrite(async (change, context) => {
      const snap = change.after;
      if (!snap.exists) return null;
      const data = snap.data() || {};
      if (data.enrichmentStatus !== 'PENDING_ENRICHMENT') return null;

      // The cycle is created before source acquisition completes. Claim the
      // first subsequent governed update atomically so source-pair completion
      // can start enrichment without a Founder click and without duplicate
      // concurrent runs.
      const claimId = context.eventId || `${context.params.missionId}/${context.params.cycleKey}`;
      const claimed = await adminSdk.firestore().runTransaction(async (transaction) => {
        const currentSnap = await transaction.get(snap.ref);
        const current = currentSnap.data() || {};
        if (current.enrichmentStatus !== 'PENDING_ENRICHMENT') return false;
        transaction.update(snap.ref, {
          enrichmentStatus: 'ENRICHMENT_RUNNING',
          enrichmentClaimId: claimId,
          enrichmentClaimedAt: new Date().toISOString(),
        });
        return true;
      });
      if (!claimed) return null;

      try {
        return await executeMissionEnrichmentCycle({
          db: adminSdk.firestore(),
          missionId: context.params.missionId,
          cycleKey: context.params.cycleKey,
          cycleData: {...data, enrichmentStatus: 'PENDING_ENRICHMENT'},
          recordedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`MISSION_ENRICHMENT_WORKER_ERROR: ${context.params.missionId}/${context.params.cycleKey}: ${err.message}`);
        await snap.ref.update({
          enrichmentStatus: 'ENRICHMENT_FAILED',
          enrichmentError: err.message || 'ENRICHMENT_FAILED',
          enrichmentClaimId: claimId,
          updatedAt: new Date().toISOString(),
        });
        return { error: err.message };
      }
    });
} else {
  console.log('MISSION_ENRICHMENT_WORKER: firebase-functions SDK not present (offline/test context); live trigger not materialized.');
}

exports.executeMissionEnrichmentCycle = executeMissionEnrichmentCycle;
exports.WORKER_ID = WORKER_ID;
exports.WORKER_CONTRACT_VERSION = WORKER_CONTRACT_VERSION;
