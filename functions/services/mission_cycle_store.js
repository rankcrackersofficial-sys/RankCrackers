/**
 * B2 — AUTHORITATIVE MISSION CYCLE STORE (C1-R3 Convergence)
 * =============================================================================
 * Canonical cycle storage contract for mission_realms/{missionId}/cycles/{cycleKey}.
 *
 * Laws (Worker/Founder Master Spec §2.2, §6, §13-§17; C1-R3 Identity Invariant Law):
 *   - The parent mission is PERMANENT; a cycle is one occurrence of it.
 *   - cycleKey is system/source-derived: the target year, optionally with a
 *     deterministic official discriminator ('2027', '2027_phase1').
 *     Founder free-text cycle naming is NOT permitted.
 *   - Creation produces ONLY an INTERNAL_DRAFT cycle with
 *     enrichmentStatus = PENDING_ENRICHMENT. Creation is NOT publication.
 *   - DUPLICATE-CYCLE GUARD: the same missionId + cycleKey must never be
 *     silently merged or duplicated — fail closed.
 *   - PROJECTION ISOLATION: creating a draft cycle must never write
 *     student_mission_catalog, recruitments, the mission_realms root document,
 *     or any publication/visibility state.
 *   - EXPLICIT AUTHORITY IDENTITY INVARIANT: authorityKey is strictly mandatory in
 *     all authoritative cycle creation, builder calls, handoffs, and direct persistence.
 *     It must be a registered canonical authority key consistent with jurisdictionLevel
 *     and stateCode. Nullable authorityKey is strictly forbidden.
 *   - NO SOURCE AUTHORITY OVERRIDE: source authorityKey is passed as evidence
 *     separately and can never override the creation/cycle authorityKey.
 *
 * Pure derivation/builders are separated from the thin Firestore-facing
 * transactional creator (which accepts an injected db handle and is tested
 * against a synthetic in-memory store).
 */

'use strict';

const {
  buildMissionEnrichmentTaskKey,
  assertMissionEnrichmentIdentity,
  assertNoLifecycleMutation,
} = require('./mission_enrichment_guardrails');
const {
  assertCycleSourceBindingsPass,
} = require('./mission_source_preflight');
const {
  assertAuthorityJurisdictionConsistency,
} = require('./authority_intelligence/canonical_authority_domain_validator');
const {
  validateOrResolveId,
} = require('../canonical_mission_registry');

const ACCEPTED_VERIFICATION_STATES = ['verified', 'published']; // published implies prior governed verification

const SYLLABUS_BINDING_MODES = ['SEPARATE', 'EMBEDDED', 'PENDING'];
const JURISDICTION_LEVELS = ['CENTRAL', 'STATE', 'UT'];
const PROTECTED_PROJECTION_COLLECTIONS = ['student_mission_catalog', 'recruitments'];

function requireNonEmptyString(value, code, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${code}: ${label} must be a non-empty string.`);
  }
  return value.trim();
}

/**
 * Derives the deterministic cycle key from the target year and an optional
 * official discriminator. Year must be a standalone cycle year 1900-2099.
 * Discriminator, when present, must already be a canonical lowercase token
 * ([a-z0-9]+) — free text is rejected, never slugified.
 */
function deriveCycleKey({ targetYear, cycleDiscriminator = '' }) {
  const yearText = String(targetYear ?? '').trim();
  if (!/^(19|20)\d\d$/.test(yearText)) {
    throw new Error(`CYCLE_KEY_INVALID: targetYear '${targetYear}' must be a cycle year 1900-2099.`);
  }
  const disc = typeof cycleDiscriminator === 'string' ? cycleDiscriminator.trim() : '';
  if (disc === '') return yearText;
  if (!/^[a-z0-9]+$/.test(disc)) {
    throw new Error(`CYCLE_KEY_INVALID: cycleDiscriminator '${disc}' must already be a canonical lowercase token; free text is not permitted.`);
  }
  return `${yearText}_${disc}`;
}

function assertSyllabusBindingMode(mode) {
  if (!SYLLABUS_BINDING_MODES.includes(mode)) {
    throw new Error(`CYCLE_BINDING_MODE_INVALID: syllabusBindingMode must be one of ${SYLLABUS_BINDING_MODES.join('|')}.`);
  }
  return mode;
}

function assertJurisdictionLevel(level) {
  if (!JURISDICTION_LEVELS.includes(level)) {
    throw new Error(`CYCLE_JURISDICTION_INVALID: jurisdictionLevel must be one of ${JURISDICTION_LEVELS.join('|')}.`);
  }
  return level;
}

/**
 * Builds the frozen INTERNAL_DRAFT cycle record. Source bindings are opaque
 * caller-supplied references (ids + version refs); this module never invents
 * source identity. Readiness is evidence-derived and starts honestly false.
 *
 * C1-R3 INVARIANT: authorityKey is strictly mandatory, non-empty, and validated
 * against the canonical authority registry and jurisdiction/stateCode rules.
 */
function buildCycleRecord({
  cycleKey,
  targetYear,
  syllabusBindingMode,
  jurisdictionLevel,
  stateCode = null,
  authorityKey,
  notificationBinding,
  syllabusBinding = null,
  createdBy = null,
  recordedAt,
}) {
  if (!cycleKey || typeof cycleKey !== 'string' || !/^\d{4}(?:_[a-z0-9]+)?$/.test(cycleKey)) {
    throw new Error('CYCLE_KEY_INVALID: cycleKey must be derived via deriveCycleKey.');
  }
  assertSyllabusBindingMode(syllabusBindingMode);
  assertJurisdictionLevel(jurisdictionLevel);
  if (!notificationBinding || typeof notificationBinding !== 'object' || !notificationBinding.sourceId) {
    throw new Error('CYCLE_NOTIFICATION_BINDING_REQUIRED: an official notification binding is required.');
  }
  if (syllabusBindingMode === 'SEPARATE') {
    if (!syllabusBinding || typeof syllabusBinding !== 'object' || !syllabusBinding.sourceId) {
      throw new Error('CYCLE_SYLLABUS_BINDING_REQUIRED: SEPARATE mode requires a syllabus binding.');
    }
  }
  if (syllabusBindingMode !== 'SEPARATE' && syllabusBinding !== null) {
    throw new Error('CYCLE_SYLLABUS_BINDING_FORBIDDEN: only SEPARATE mode may carry a syllabus binding.');
  }
  if (jurisdictionLevel === 'CENTRAL' && stateCode) {
    throw new Error('CYCLE_STATE_CODE_INVALID: CENTRAL missions must not declare a stateCode.');
  }
  if ((jurisdictionLevel === 'STATE' || jurisdictionLevel === 'UT') && (!stateCode || typeof stateCode !== 'string')) {
    throw new Error('CYCLE_STATE_CODE_REQUIRED: STATE/UT missions must declare a canonical stateCode.');
  }

  // CANONICAL AUTHORITY KEY IS MANDATORY FOR EVERY AUTHORITATIVE CYCLE (C1-R3)
  if (authorityKey === undefined || authorityKey === null || typeof authorityKey !== 'string' || authorityKey.trim() === '') {
    throw new Error('CYCLE_AUTHORITY_KEY_REQUIRED: authorityKey must be a non-empty canonical string.');
  }
  const cleanAuthorityKey = authorityKey.trim();
  assertAuthorityJurisdictionConsistency({
    authorityKey: cleanAuthorityKey,
    jurisdictionLevel,
    stateCode: stateCode || null,
  });

  return deepFreezeRecord({
    cycleKey,
    targetYear: parseInt(targetYear, 10),
    status: 'INTERNAL_DRAFT',
    syllabusBindingMode,
    jurisdictionLevel,
    stateCode: stateCode || null,
    authorityKey: cleanAuthorityKey,
    notificationBinding: deepFreezeRecord({ ...notificationBinding }),
    syllabusBinding: syllabusBinding ? deepFreezeRecord({ ...syllabusBinding }) : null,
    enrichmentStatus: 'PENDING_ENRICHMENT',
    enrichmentTaskKey: null,
    enrichmentEvidence: null,
    readiness: {
      notificationReady: true, // bound at creation; backend preflight remains authoritative
      syllabusReady: false,    // honestly false for SEPARATE (pending evidence), EMBEDDED, PENDING
    },
    createdBy,
    createdAt: recordedAt,
    updatedAt: recordedAt,
  });
}

function deepFreezeRecord(obj) {
  if (obj && typeof obj === 'object') {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const val = obj[prop];
      if (val !== null && (typeof val === 'object') && !Object.isFrozen(val)) deepFreezeRecord(val);
    });
  }
  return obj;
}

/**
 * DUPLICATE-CYCLE GUARD: an existing authoritative cycle with the same key
 * must never be silently merged or duplicated. The caller may only proceed
 * through an explicitly governed update/amendment flow (not this function).
 */
function assertCycleCreationAllowed({ existingCycleData }) {
  if (existingCycleData !== null && existingCycleData !== undefined) {
    throw new Error(`DUPLICATE_CYCLE_EXISTS: an authoritative cycle already exists for this missionId + cycleKey. Governed update/source-amendment flow required; silent merge is forbidden.`);
  }
  return true;
}

/**
 * PROJECTION ISOLATION LAW: draft-cycle writes may target ONLY the cycle
 * subcollection of the mission. student_mission_catalog, recruitments, the
 * mission_realms ROOT document, and lifecycle/publication fields are forbidden.
 *
 * B5 RECONCILIATION (frozen contract law): a successful draft-cycle creation
 * MAY additionally update the permanent parent ROOT document with ONLY the
 * safe draft pointer metadata (latest_draft_cycle_key + updated_at). Enable
 * with options.allowParentDraftPointer = true — the accompanying update object
 * must then pass assertParentDraftPointerUpdate. Even with the pointer allowed,
 * current_published projection / visibility / lifecycle fields stay forbidden.
 * writePaths: array of Firestore path strings.
 */
function assertDraftCycleWriteIsolation(missionId, writePaths, options = {}) {
  assertMissionEnrichmentIdentity(missionId);
  const allowParentDraftPointer = options.allowParentDraftPointer === true;
  if (!Array.isArray(writePaths)) {
    throw new Error('DRAFT_ISOLATION_INVALID: writePaths must be an array of Firestore path strings.');
  }
  for (const path of writePaths) {
    const segments = String(path).split('/').filter(Boolean);
    if (PROTECTED_PROJECTION_COLLECTIONS.includes(segments[0])) {
      throw new Error(`DRAFT_CYCLE_ISOLATION_VIOLATION: draft creation may not write '${path}' (protected Student/recruitment projection).`);
    }
    if (segments[0] === 'mission_realms') {
      if (segments.length === 2) {
        if (!allowParentDraftPointer) {
          throw new Error(`DRAFT_CYCLE_ISOLATION_VIOLATION: draft creation may not write the mission_realms root document '${path}' (only the safe draft pointer update is permitted).`);
        }
        if (segments[1] !== missionId) {
          throw new Error(`DRAFT_CYCLE_ISOLATION_VIOLATION: draft pointer update targets a foreign parent '${path}'.`);
        }
      } else if (segments[2] !== 'cycles') {
        throw new Error(`DRAFT_CYCLE_ISOLATION_VIOLATION: draft creation may only write mission_realms/{missionId}/cycles/** (got '${path}').`);
      }
    } else {
      throw new Error(`DRAFT_CYCLE_ISOLATION_VIOLATION: draft creation may not write foreign collection '${segments[0]}'.`);
    }
  }
  return true;
}

const ALLOWED_PARENT_DRAFT_POINTER_FIELDS = ['latest_draft_cycle_key', 'updated_at'];

/**
 * Field-level firewall for the safe permanent-parent draft pointer update.
 * ONLY latest_draft_cycle_key (+ updated_at) may pass. Any other field —
 * notably currentPublishedCycleKey, status, visibility, lifecycleMutation —
 * is a hard violation: the CURRENT PUBLISHED pointer moves only on explicit
 * governed publication, never on draft creation.
 */
function assertParentDraftPointerUpdate(parentUpdate) {
  if (!parentUpdate || typeof parentUpdate !== 'object' || Array.isArray(parentUpdate)) {
    throw new Error('DRAFT_POINTER_INVALID: parent pointer update must be an object.');
  }
  for (const key of Object.keys(parentUpdate)) {
    if (!ALLOWED_PARENT_DRAFT_POINTER_FIELDS.includes(key)) {
      throw new Error(`DRAFT_POINTER_ILLEGAL_FIELD: '${key}' is not safe draft pointer metadata. The current published projection/pointer may never change on draft creation.`);
    }
  }
  if (!parentUpdate.latest_draft_cycle_key || typeof parentUpdate.latest_draft_cycle_key !== 'string'
      || !/^\d{4}(?:_[a-z0-9]+)?$/.test(parentUpdate.latest_draft_cycle_key)) {
    throw new Error('DRAFT_POINTER_INVALID: latest_draft_cycle_key must be a derived cycle key.');
  }
  return deepFreezeRecord({ ...parentUpdate });
}

/**
 * Builds the frozen Worker handoff payload (Master Spec §19) for a created
 * cycle. The deterministic enrichment task key is derived through the accepted
 * W1A guardrail from authoritative identity only.
 *
 * C1-R3 INVARIANT: cycle MUST carry a non-empty canonical authorityKey
 * validated against jurisdictionLevel and stateCode.
 */
function buildEnrichmentHandoffPayload({ missionId, cycle, workerContractVersion = 'unified_worker_v1' }) {
  if (!cycle || typeof cycle !== 'object') {
    throw new Error('CYCLE_REQUIRED: cycle record is required for the enrichment handoff.');
  }
  const normalizedMissionId = assertMissionEnrichmentIdentity(missionId);
  
  if (!cycle.authorityKey || typeof cycle.authorityKey !== 'string' || cycle.authorityKey.trim() === '') {
    throw new Error('HANDOFF_AUTHORITY_KEY_REQUIRED: cycle must carry a non-empty canonical authorityKey.');
  }
  const cleanAuthorityKey = cycle.authorityKey.trim();
  assertAuthorityJurisdictionConsistency({
    authorityKey: cleanAuthorityKey,
    jurisdictionLevel: cycle.jurisdictionLevel,
    stateCode: cycle.stateCode || null,
  });

  const taskKey = buildMissionEnrichmentTaskKey({
    missionId: normalizedMissionId,
    sourceIdentityTokens: [
      cycle.cycleKey,
      cycle.notificationBinding && cycle.notificationBinding.sourceId ? cycle.notificationBinding.sourceId : '',
      cycle.syllabusBinding && cycle.syllabusBinding.sourceId ? cycle.syllabusBinding.sourceId : '',
      cycle.syllabusBindingMode,
    ],
    workerContractVersion,
  });
  return deepFreezeRecord({
    missionId: normalizedMissionId,
    cycleKey: cycle.cycleKey,
    authorityKey: cleanAuthorityKey,
    notificationBinding: cycle.notificationBinding,
    syllabusBinding: cycle.syllabusBinding,
    syllabusBindingMode: cycle.syllabusBindingMode,
    jurisdictionLevel: cycle.jurisdictionLevel,
    stateCode: cycle.stateCode,
    targetYear: cycle.targetYear,
    enrichmentStatus: cycle.enrichmentStatus,
    enrichmentTaskKey: taskKey,
    workerContractVersion,
  });
}

/**
 * Firestore-facing transactional creator (duplicate guard is transactional).
 * `db` is injected (live: admin.firestore(); tests: synthetic store).
 * The write set is proven to respect draft-cycle projection isolation.
 *
 * C1-R3 INVARIANT: validates the supplied cycle's canonical authority and
 * jurisdiction identity before performing any persistence.
 */
async function createMissionCycleWithDuplicateGuard({ db, missionId, cycle, recordedAt }) {
  if (!db) throw new Error('CYCLE_STORE_DB_REQUIRED: db handle is required.');
  if (!cycle || typeof cycle !== 'object') {
    throw new Error('CYCLE_STORE_CYCLE_REQUIRED: cycle object is required.');
  }
  if (!cycle.cycleKey || typeof cycle.cycleKey !== 'string' || !/^\d{4}(?:_[a-z0-9]+)?$/.test(cycle.cycleKey)) {
    throw new Error('CYCLE_KEY_INVALID: cycleKey must be derived via deriveCycleKey.');
  }
  assertSyllabusBindingMode(cycle.syllabusBindingMode);
  assertJurisdictionLevel(cycle.jurisdictionLevel);
  if (!cycle.authorityKey || typeof cycle.authorityKey !== 'string' || cycle.authorityKey.trim() === '') {
    throw new Error('CYCLE_AUTHORITY_KEY_REQUIRED: authorityKey must be a non-empty canonical string.');
  }
  const cleanAuthorityKey = cycle.authorityKey.trim();
  assertAuthorityJurisdictionConsistency({
    authorityKey: cleanAuthorityKey,
    jurisdictionLevel: cycle.jurisdictionLevel,
    stateCode: cycle.stateCode || null,
  });

  const normalizedMissionId = assertMissionEnrichmentIdentity(missionId);
  const cycleRef = db.collection('mission_realms').doc(normalizedMissionId).collection('cycles').doc(cycle.cycleKey);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(cycleRef);
    assertCycleCreationAllowed({ existingCycleData: existing.exists ? existing.data() : null });

    const record = deepFreezeRecord({
      ...cycle,
      authorityKey: cleanAuthorityKey,
      createdAt: cycle.createdAt || recordedAt,
      updatedAt: recordedAt,
    });

    // Projection isolation is proven for the exact write this function performs.
    assertDraftCycleWriteIsolation(normalizedMissionId, [cycleRef.path]);
    tx.set(cycleRef, record);
    return { created: true, missionId: normalizedMissionId, cycleKey: cycle.cycleKey, cycleRefPath: cycleRef.path, record };
  });
}

/**
 * B5 — UNIFIED MISSION CREATION (the end-to-end create flow).
 *
 * One governed transaction (the caller's — never a nested transaction) performs:
 *   B1  permanent identity resolution (fail-closed; no fallback; year-free)
 *   B3  official/English/hash source preflight for every bound source with
 *       strict expected authorityKey matching
 *   B2  duplicate-guarded authoritative cycle creation (derived cycleKey only;
 *       payload.cycle free text is NEVER used for identity)
 *   +   safe permanent-parent draft pointer (latest_draft_cycle_key ONLY)
 *   +   compatibility shells for a NEW parent (hidden/passive — never publication)
 *   +   governed source binding (linkedRealmId/linkedCycleKey on the drafts)
 *
 * `transaction` is the caller's Firestore transaction; `db` is used only to
 * resolve collection references. All writes respect the projection isolation
 * law (with the B5-reconciled parent draft-pointer allowance).
 */
async function executeUnifiedMissionCreation({ transaction, db, payload = {}, actorId = null, recordedAt }) {
  if (!transaction) throw new Error('CREATION_TRANSACTION_REQUIRED: the caller transaction is required.');
  if (!db) throw new Error('CREATION_DB_REQUIRED: db handle is required.');
  if (!recordedAt) throw new Error('CREATION_RECORDED_AT_REQUIRED: caller-supplied recordedAt is required.');

  // LAW 1 — B1 PERMANENT IDENTITY (fail-closed; no fallback; no year in identity)
  const missionId = validateOrResolveId('launch_exam_mission', payload);

  // Binding mode + jurisdiction vocabulary (DATA, validated)
  const syllabusBindingMode = assertSyllabusBindingMode(payload.syllabusBindingMode);
  const jurisdictionLevel = assertJurisdictionLevel(payload.jurisdictionLevel);
  const notificationId = requireNonEmptyString(payload.notificationId, 'CREATION_NOTIFICATION_REQUIRED', 'notificationId');
  const syllabusId = syllabusBindingMode === 'SEPARATE'
    ? requireNonEmptyString(payload.syllabusId, 'CREATION_SYLLABUS_REQUIRED', 'syllabusId is required for SEPARATE binding mode')
    : null;

  // CANONICAL AUTHORITY KEY IS MANDATORY FOR GOVERNED MISSION CREATION
  const authorityKey = requireNonEmptyString(payload.authorityKey, 'CREATION_AUTHORITY_KEY_REQUIRED', 'payload.authorityKey');
  assertAuthorityJurisdictionConsistency({
    authorityKey,
    jurisdictionLevel,
    stateCode: payload.stateCode || null,
  });

  // LAW 2 — B3 SOURCE PREFLIGHT (loads inside the caller's transaction)
  const wanted = [{ sourceId: notificationId, sourceType: 'notification' }];
  if (syllabusId) wanted.push({ sourceId: syllabusId, sourceType: 'syllabus' });
  const bindings = [];
  for (const want of wanted) {
    const draftSnap = await transaction.get(db.collection('sentinel_drafts').doc(want.sourceId));
    if (!draftSnap.exists) {
      throw new Error(`CREATION_SOURCE_MISSING: bound source '${want.sourceId}' does not exist.`);
    }
    const draft = draftSnap.data() || {};
    const refinerySnap = await transaction.get(db.collection('ingestion_refinery').doc(want.sourceId));
    const refinery = refinerySnap.exists ? (refinerySnap.data() || {}) : null;

    // STRICT SOURCE PROOF: no default true, no default domain, no default language
    const isOfficial = Boolean(draft.isOfficial === true || (draft.rawData && draft.rawData.isOfficial === true));
    const rawDomain = draft.officialDomain || (draft.rawData && (draft.rawData.official_website || draft.rawData.officialDomain || draft.rawData.official_domain)) || null;
    const officialDomain = typeof rawDomain === 'string' && rawDomain.trim().length > 0 ? rawDomain.trim() : null;
    const rawLang = draft.language || (draft.rawData && draft.rawData.language) || null;
    const language = typeof rawLang === 'string' && rawLang.trim().length > 0 ? rawLang.trim() : null;
    const expectedSha256 = draft.fileHash || draft.sourceSha256 || (draft.rawData && (draft.rawData.fileHash || draft.rawData.sourceSha256)) || null;
    const actualSha256 = draft.actualSha256 || null;
    const refinerySha = refinery ? (refinery.fileHash || refinery.sourceSha256 || null) : null;
    const ingestionProof = null; // R2: unproven refinery trust disabled for mission creation; actualSha256 byte digest required
    const draftAuthorityKey = draft.authorityKey || null; // Source's own authority key (passed separately for equality check)

    // R5: Certified source role and explicit governance status from draft
    const certifiedSourceType = typeof draft.sourceType === 'string' && draft.sourceType.trim().length > 0 ? draft.sourceType.trim() : null;
    const governanceStatus = typeof draft.governanceStatus === 'string' && draft.governanceStatus.trim().length > 0 ? draft.governanceStatus.trim() : null;

    bindings.push({
      source: {
        sourceId: want.sourceId,
        sourceType: certifiedSourceType,
        governanceStatus,
        verificationState: ACCEPTED_VERIFICATION_STATES.includes(draft.status) ? 'verified' : (draft.status || 'unknown'),
        isOfficial,
        officialDomain,
        language,
        expectedSha256,
        actualSha256,
        authorityKey: draftAuthorityKey, // Source's own key
        ingestionProof,
        boundMissionId: draft.linkedRealmId || null,
        boundCycleKey: draft.linkedCycleKey || null,
      },
      expectation: {
        missionId,
        sourceType: want.sourceType,
        expectedSha256,
        authorityKey, // Expected authority is strictly from payload.authorityKey
      },
    });
  }
  assertCycleSourceBindingsPass({ bindings });

  // LAW 3 — CYCLE IDENTITY via B2 (payload.cycle free text NEVER participates)
  const cycleKey = deriveCycleKey({ targetYear: payload.year, cycleDiscriminator: payload.cycleDiscriminator });

  // LAW 4 — DUPLICATE-CYCLE GUARD (transactional read; fail closed)
  const cycleRef = db.collection('mission_realms').doc(missionId).collection('cycles').doc(cycleKey);
  const existingCycle = await transaction.get(cycleRef);
  assertCycleCreationAllowed({ existingCycleData: existingCycle.exists ? existingCycle.data() : null });

  // LAW 5 — AUTHORITATIVE CYCLE RECORD
  const cycle = buildCycleRecord({
    cycleKey,
    targetYear: payload.year,
    syllabusBindingMode,
    jurisdictionLevel,
    stateCode: payload.stateCode || null,
    authorityKey,
    notificationBinding: { sourceId: notificationId, versionRef: payload.notificationVersionRef || null },
    syllabusBinding: syllabusId ? { sourceId: syllabusId, versionRef: payload.syllabusVersionRef || null } : null,
    createdBy: actorId,
    recordedAt,
  });
  transaction.set(cycleRef, cycle);

  // LAW 6 — PARENT MISSION + SAFE DRAFT POINTER + COMPATIBILITY SHELLS
  const parentRef = db.collection('mission_realms').doc(missionId);
  const parentSnap = await transaction.get(parentRef);
  const writePaths = [cycleRef.path, parentRef.path];
  let createdParent = false;
  if (!parentSnap.exists) {
    // NEW PERMANENT MISSION: parent + hidden/passive compatibility shells only.
    createdParent = true;
    transaction.set(parentRef, {
      realm_id: missionId,
      exam_name: payload.examName || '',
      exam_category: payload.examCategory || null,
      organization: payload.organization || '',
      status: 'PASSIVE',
      latest_draft_cycle_key: cycleKey,
      created_at: recordedAt,
      updated_at: recordedAt,
      created_by: actorId,
    });
    transaction.set(db.collection('recruitments').doc(missionId), {
      id: missionId,
      title: payload.examName || '',
      org: payload.organization || '',
      examCategory: payload.examCategory || null,
      status: 'internal_draft',
      nature: 'PASSIVE',
      createdAt: recordedAt,
      updatedAt: recordedAt,
      version: '1.0.0',
    });
    transaction.set(db.collection('student_mission_catalog').doc(missionId), {
      id: missionId,
      missionId,
      sourceMissionId: missionId,
      sourceMissionVersion: '1',
      sourcePath: `mission_realms/${missionId}`,
      sourceType: 'mission_realms',
      status: 'INTERNAL_DRAFT',
      catalogStatus: 'INTERNAL_DRAFT',
      studentPublicationState: 'INTERNAL_DRAFT',
      examName: payload.examName || '',
      organization: payload.organization || '',
      userPanelVisible: false,
      cardVisible: false,
      visibility: { studentVisible: false, catalogVisible: false, userPanelVisible: false, quickEntryEnabled: false, smartEntryEnabled: false },
      contentLocks: { syllabusPublished: false, topicNodesPublished: false, digibookPublished: false, cruciblePublished: false, pyqPublished: false, questionCellsPublished: false },
      createdAt: recordedAt,
      updatedAt: recordedAt,
    });
  } else {
    // EXISTING PERMANENT MISSION: stable identity compatibility (exam_name +
    // organization; year is cycle metadata and must NOT change the parent).
    const parent = parentSnap.data() || {};
    const parentName = String(parent.exam_name || '').trim().toLowerCase();
    const parentOrg = String(parent.organization || '').trim().toLowerCase();
    if (parentName !== String(payload.examName || '').trim().toLowerCase()
        || parentOrg !== String(payload.organization || '').trim().toLowerCase()) {
      throw new Error(`PARENT_IDENTITY_MISMATCH: existing permanent mission '${missionId}' does not match the submitted identity metadata.`);
    }
  }
  // Safe draft pointer on the permanent parent (B5-reconciled law).
  const pointerUpdate = assertParentDraftPointerUpdate({ latest_draft_cycle_key: cycleKey, updated_at: recordedAt });
  if (createdParent) {
    // pointer already included in the parent creation write
    assertDraftCycleWriteIsolation(missionId, writePaths, { allowParentDraftPointer: true });
  } else {
    transaction.update(parentRef, pointerUpdate);
    assertDraftCycleWriteIsolation(missionId, writePaths, { allowParentDraftPointer: true });
  }

  // LAW 7 — SOURCE BINDING (governed link; never mutates verification evidence)
  const draftLinks = [];
  for (const want of wanted) {
    const draftRef = db.collection('sentinel_drafts').doc(want.sourceId);
    transaction.update(draftRef, { linkedRealmId: missionId, linkedCycleKey: cycleKey });
    draftLinks.push(draftRef.path);
  }

  const cycleForHandoff = typeof cycle.get === 'function' ? cycle : cycle;
  const handoff = buildEnrichmentHandoffPayload({ missionId, cycle: cycleForHandoff });

  return {
    missionId,
    cycleKey,
    createdParent,
    syllabusBindingMode,
    jurisdictionLevel,
    handoff,
    writePaths: [...writePaths, ...draftLinks],
    summary: {
      missionId,
      cycleKey,
      createdParent,
      syllabusBindingMode,
      enrichmentStatus: 'PENDING_ENRICHMENT',
    },
  };
}

module.exports = {
  ALLOWED_PARENT_DRAFT_POINTER_FIELDS,
  SYLLABUS_BINDING_MODES,
  JURISDICTION_LEVELS,
  PROTECTED_PROJECTION_COLLECTIONS,
  assertCycleCreationAllowed,
  assertDraftCycleWriteIsolation,
  assertJurisdictionLevel,
  assertParentDraftPointerUpdate,
  assertSyllabusBindingMode,
  buildCycleRecord,
  buildEnrichmentHandoffPayload,
  createMissionCycleWithDuplicateGuard,
  deriveCycleKey,
  executeUnifiedMissionCreation,
};
