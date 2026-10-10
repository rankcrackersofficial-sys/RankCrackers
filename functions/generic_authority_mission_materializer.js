/**
 * 🔱 RANKCRACKERS INDIA-WIDE GENERIC AUTHORITY MISSION MATERIALIZER & DRYRUN ENGINE
 * Gate 47B — Anti-Gravity Backend / Founder Authority Lane
 *
 * Provides safe, idempotent, manifest-driven bulk materialization of India-wide
 * Authority -> Mission -> Variant manifests across the 3 canonical projections:
 *   1. mission_realms/{missionId}
 *   2. recruitments/{missionId}
 *   3. student_mission_catalog/{missionId}
 *
 * Enforces:
 *   - Canonical Product Contract (Jurisdiction -> Region/Sector -> Authority -> Permanent Mission -> Variant)
 *   - Year-less permanent mission IDs for new missions; preserved existing pilot IDs
 *   - Latest Official Source Law
 *   - Unbounded PYQ Law
 *   - Truthful Independent Readiness Law
 *   - Student Visibility Law
 *   - Strict Idempotency & Zero-Op No-Touch on Re-Run
 */

'use strict';

const crypto = require('crypto');

// Known immutable pilot mission IDs in production
const IMMUTABLE_PILOT_IDS = new Set([
  'jee_main_2026',
  'neet_(ug)-2027',
  'RPSC_FIRST_GRADE2026_2026_1782713222215'
]);

// Valid Jurisdiction Levels
const JURISDICTION_LEVELS = new Set(['CENTRAL', 'STATE', 'UT']);

// Valid Exam Categories
const EXAM_CATEGORIES = new Set(['competitive', 'qualifying', 'category_pending']);

// Standard State/UT Codes mapping
const STATE_UT_NAMES = {
  'AN': 'Andaman and Nicobar Islands',
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CH': 'Chandigarh',
  'CG': 'Chhattisgarh',
  'DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'DL': 'Delhi',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HR': 'Haryana',
  'HP': 'Himachal Pradesh',
  'JK': 'Jammu and Kashmir',
  'JH': 'Jharkhand',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'LA': 'Lakshadweep',
  'LD': 'Lakshadweep',
  'MP': 'Madhya Pradesh',
  'MH': 'Maharashtra',
  'MN': 'Manipur',
  'ML': 'Meghalaya',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OD': 'Odisha',
  'PY': 'Puducherry',
  'PB': 'Punjab',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TN': 'Tamil Nadu',
  'TS': 'Telangana',
  'TR': 'Tripura',
  'UP': 'Uttar Pradesh',
  'UK': 'Uttarakhand',
  'WB': 'West Bengal'
};

/**
 * Deterministically stringifies objects recursively for canonical key sorting.
 */
function canonicalJsonStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => JSON.stringify(k) + ':' + canonicalJsonStringify(obj[k]));
  return '{' + pairs.join(',') + '}';
}

/**
 * Calculates SHA-256 digest of payload for semantic equality checking.
 * Strips non-semantic timestamps like updatedAt before computing digest.
 */
function computeSemanticDigest(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const clone = JSON.parse(JSON.stringify(payload));
  delete clone.updatedAt;
  delete clone.lastMaterializedAt;
  delete clone.mirrorTimestamp;
  return crypto.createHash('sha256').update(canonicalJsonStringify(clone)).digest('hex');
}

/**
 * Normalizes State/UT codes and names based on Jurisdiction Level.
 */
function normalizeJurisdictionAndState(jurisdictionLevel, stateCode, stateName) {
  const level = String(jurisdictionLevel || '').trim().toUpperCase();
  if (!JURISDICTION_LEVELS.has(level)) {
    throw new Error(`INVALID_JURISDICTION_LEVEL: '${jurisdictionLevel}' is not supported.`);
  }

  if (level === 'CENTRAL') {
    return { jurisdictionLevel: 'CENTRAL', stateCode: null, stateName: null };
  }

  const cleanCode = String(stateCode || '').trim().toUpperCase();
  if (!cleanCode || cleanCode.length !== 2) {
    throw new Error(`INVALID_STATE_CODE: State/UT jurisdiction requires 2-letter stateCode, got '${stateCode}'.`);
  }

  const resolvedName = stateName ? String(stateName).trim() : (STATE_UT_NAMES[cleanCode] || cleanCode);
  return { jurisdictionLevel: level, stateCode: cleanCode, stateName: resolvedName };
}

/**
 * Validates whether a mission candidate satisfies the Student Visibility Law.
 */
function evaluateStudentVisibilityGate(mission) {
  const blockers = [];

  // 1. Exam Identity source-grounded
  const hasLocator = mission.officialSourceLocator &&
    (typeof mission.officialSourceLocator === 'object') &&
    (mission.officialSourceLocator.url || mission.officialSourceLocator.noticeUrl || mission.officialSourceLocator.documentUrl);
  if (!hasLocator) {
    blockers.push('VISIBILITY_BLOCKED_NO_OFFICIAL_SOURCE_LOCATOR');
  }

  // 2. Canonical Authority Owner resolved
  if (!mission.authorityGroupKey || typeof mission.authorityGroupKey !== 'string' || !mission.authorityGroupKey.trim()) {
    blockers.push('VISIBILITY_BLOCKED_UNRESOLVED_AUTHORITY');
  }

  // 3. Hierarchy path valid
  if (!mission.jurisdictionLevel || !JURISDICTION_LEVELS.has(mission.jurisdictionLevel.toUpperCase())) {
    blockers.push('VISIBILITY_BLOCKED_INVALID_JURISDICTION');
  }

  // 4. Major-exam classification accepted
  const category = String(mission.examCategory || '').toLowerCase();
  if (!EXAM_CATEGORIES.has(category)) {
    blockers.push('VISIBILITY_BLOCKED_UNACCEPTED_EXAM_CATEGORY');
  }

  // 5. Visibility metadata internally consistent
  if (mission.visibility && mission.visibility.studentVisible === true && blockers.length > 0) {
    blockers.push('VISIBILITY_BLOCKED_INCONSISTENT_VISIBILITY_METADATA');
  }

  const isVisible = blockers.length === 0;
  return {
    studentVisible: isVisible,
    catalogVisible: isVisible,
    userPanelVisible: isVisible,
    quickEntryEnabled: isVisible,
    smartEntryEnabled: isVisible,
    gateStatus: isVisible ? 'PASSED' : 'HELD_PREPARING',
    blockers
  };
}

/**
 * Validates the raw manifest input against schema and domain rules.
 */
function validateManifestSchema(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('MANIFEST_REQUIRED: Manifest must be a non-null object.');
  }

  if (!manifest.manifestVersion) {
    throw new Error('MANIFEST_VERSION_REQUIRED: Manifest must declare manifestVersion.');
  }

  const missions = Array.isArray(manifest.missions) ? manifest.missions : [];
  if (missions.length === 0) {
    throw new Error('MANIFEST_EMPTY: Manifest contains zero mission entries.');
  }

  const seenMissionIds = new Set();
  const seenYearwiseSignatures = new Set();
  const errors = [];

  missions.forEach((m, index) => {
    const ctx = `Mission[${index}] (${m.missionId || 'UNNAMED'})`;

    if (!m.missionId || typeof m.missionId !== 'string' || !m.missionId.trim()) {
      errors.push(`${ctx}: missionId is required and must be non-empty.`);
      return;
    }

    const cleanId = m.missionId.trim();

    // Rejection rule: Duplicate permanent mission identities in same manifest
    if (seenMissionIds.has(cleanId)) {
      errors.push(`${ctx}: Duplicate missionId '${cleanId}' detected in manifest.`);
    }
    seenMissionIds.add(cleanId);

    // Year-less stable ID enforcement for new non-pilot missions
    const isPilot = IMMUTABLE_PILOT_IDS.has(cleanId);
    if (!isPilot) {
      if (/_20\d\d$/.test(cleanId) || /_\d{4}_\d+$/.test(cleanId)) {
        errors.push(`${ctx}: New major mission ID '${cleanId}' violates year-less stable ID rule.`);
      }
    }

    // Rejection rule: Year-wise duplicate candidate detection
    const yearwiseSig = `${m.authorityGroupKey || 'NO_AUTH'}:${(m.title || m.examName || 'NO_TITLE').toLowerCase().replace(/\s+/g, '_')}:${m.examYear || 'PERMANENT'}`;
    if (seenYearwiseSignatures.has(yearwiseSig)) {
      errors.push(`${ctx}: Year-wise duplicate candidate signature '${yearwiseSig}' detected.`);
    }
    seenYearwiseSignatures.add(yearwiseSig);

    // Required fields check
    if (!m.title && !m.examName) errors.push(`${ctx}: title or examName is required.`);
    if (!m.authorityGroupKey) errors.push(`${ctx}: authorityGroupKey is required.`);
    if (!m.authorityDisplayName) errors.push(`${ctx}: authorityDisplayName is required.`);
    if (!m.jurisdictionLevel) errors.push(`${ctx}: jurisdictionLevel is required.`);
  });

  if (errors.length > 0) {
    const err = new Error(`MANIFEST_VALIDATION_FAILED: ${errors.length} error(s) found:\n${errors.join('\n')}`);
    err.validationErrors = errors;
    throw err;
  }

  return true;
}

/**
 * Builds the 3 canonical projection payloads for a single mission entry.
 * Respects existing createdAt and lastVerifiedDate timestamps to ensure strict idempotency.
 */
function buildCanonicalProjections(mission, existingState = {}, nowIso = new Date().toISOString()) {
  const missionId = mission.missionId.trim();
  const title = String(mission.title || mission.examName || '').trim();
  const authorityGroupKey = String(mission.authorityGroupKey || '').trim().toLowerCase();
  const authorityDisplayName = String(mission.authorityDisplayName || '').trim();
  const normJur = normalizeJurisdictionAndState(mission.jurisdictionLevel, mission.stateCode, mission.stateName);

  const region = String(mission.region || 'NATIONAL').trim().toUpperCase();
  const sector = mission.sector ? String(mission.sector).trim().toUpperCase() : null;
  const examCategory = String(mission.examCategory || 'competitive').toLowerCase();
  const examScope = String(mission.examScope || 'PUBLIC_STUDENT_ELIGIBLE').toUpperCase();
  const examPurpose = String(mission.examPurpose || 'Major Exam Mission').trim();

  const visibilityGate = evaluateStudentVisibilityGate(mission);

  // Independent Readiness State
  const readiness = {
    missionExists: true,
    sourceMetadataAvailable: Boolean(mission.officialSourceLocator),
    sourceBytesAvailable: Boolean(mission.officialSourceLocator?.bytesAvailable),
    syllabusReady: mission.readiness?.syllabusReady || 'PREPARING',
    digibookReady: mission.readiness?.digibookReady || 'PREPARING',
    questionBankReady: mission.readiness?.questionBankReady || 'PREPARING',
    crucibleReady: mission.readiness?.crucibleReady || 'PREPARING'
  };

  // Student Hierarchy Path
  const hierarchyPath = normJur.jurisdictionLevel === 'CENTRAL'
    ? `CENTRAL/${region}/${authorityGroupKey.toUpperCase()}/${missionId.toUpperCase()}`
    : `STATE/${normJur.stateCode}/${authorityGroupKey.toUpperCase()}/${missionId.toUpperCase()}`;

  // Sub-objects
  const sourceLocators = Array.isArray(mission.sourceLocators) ? mission.sourceLocators :
    (mission.officialSourceLocator ? [mission.officialSourceLocator] : []);

  const exRealm = existingState.mission_realms?.[missionId];
  const exRec = existingState.recruitments?.[missionId];
  const exCat = existingState.student_mission_catalog?.[missionId];

  const latestOfficialSource = mission.latestEffectiveSource || {
    effectiveNotification: mission.officialSourceLocator?.noticeUrl || null,
    effectiveSyllabus: mission.officialSourceLocator?.syllabusUrl || null,
    effectiveExamScheme: mission.officialSourceLocator?.schemeUrl || null,
    effectiveCorrigendum: mission.officialSourceLocator?.corrigendumUrl || null,
    lastVerifiedDate: exRealm?.latestOfficialSource?.lastVerifiedDate || mission.latestEffectiveSource?.lastVerifiedDate || nowIso
  };

  const variants = Array.isArray(mission.variants) ? mission.variants :
    (mission.variantModel ? (Array.isArray(mission.variantModel) ? mission.variantModel : [mission.variantModel]) : []);

  const pyqArchiveReference = mission.pyqArchiveRef || {
    collectionPath: `mission_realms/${missionId}/pyq_archives`,
    unboundedSupport: true,
    traceableProvenance: true,
    totalRecords: mission.pyqCount || 0
  };

  const monitoringRef = mission.sourceMonitoringRef || {
    monitoringRegistryPath: `mission_realms/${missionId}/source_monitoring_registry`,
    activeMonitoring: true
  };

  // 1. PROJECTION: mission_realms/{missionId}
  const realmData = {
    id: missionId,
    realm_id: missionId,
    missionId: missionId,
    canonicalMissionIdentity: missionId,
    title: title,
    name: title,
    exam_name: title,
    displayTitle: title,
    authorityGroupKey: authorityGroupKey,
    authorityDisplayName: authorityDisplayName,
    organizationCode: authorityGroupKey.toUpperCase(),
    jurisdictionLevel: normJur.jurisdictionLevel,
    stateCode: normJur.stateCode,
    stateName: normJur.stateName,
    region: region,
    sector: sector,
    examCategory: examCategory,
    exam_category: examCategory,
    examScope: examScope,
    examPurpose: examPurpose,
    studentHierarchyPath: hierarchyPath,
    hierarchyPlacement: {
      jurisdiction: normJur.jurisdictionLevel,
      stateCode: normJur.stateCode,
      region: region,
      sector: sector,
      authorityGroupKey: authorityGroupKey
    },
    variants: variants,
    sourceLocators: sourceLocators,
    latestOfficialSource: latestOfficialSource,
    pyqArchiveReference: pyqArchiveReference,
    monitoringRef: monitoringRef,
    readiness: readiness,
    contentReadiness: readiness,
    visibilityGate: visibilityGate,
    userPanelVisible: visibilityGate.userPanelVisible,
    status: visibilityGate.studentVisible ? 'ACTIVE' : 'PREPARING',
    createdAt: exRealm?.createdAt || mission.createdAt || nowIso,
    updatedAt: exRealm?.updatedAt || nowIso
  };

  // 2. PROJECTION: recruitments/{missionId}
  const recruitmentData = {
    id: missionId,
    recruitmentId: missionId,
    missionId: missionId,
    title: title,
    examName: title,
    organization: authorityDisplayName,
    organizationCode: authorityGroupKey.toUpperCase(),
    authorityGroupKey: authorityGroupKey,
    authorityDisplayName: authorityDisplayName,
    jurisdictionLevel: normJur.jurisdictionLevel,
    stateCode: normJur.stateCode,
    stateName: normJur.stateName,
    region: region,
    sector: sector,
    examCategory: examCategory,
    examScope: examScope,
    studentHierarchyPath: hierarchyPath,
    readiness: readiness,
    status: visibilityGate.studentVisible ? 'published' : 'draft',
    nature: visibilityGate.studentVisible ? 'ACTIVE' : 'PASSIVE',
    createdAt: exRec?.createdAt || mission.createdAt || nowIso,
    updatedAt: exRec?.updatedAt || nowIso
  };

  // 3. PROJECTION: student_mission_catalog/{missionId}
  const catalogData = {
    id: missionId,
    missionId: missionId,
    realmId: missionId,
    sourceMissionId: missionId,
    sourcePath: `mission_realms/${missionId}`,
    sourceType: 'mission_realms',
    title: title,
    name: title,
    displayTitle: title,
    examName: title,
    authorityGroupKey: authorityGroupKey,
    authorityDisplayName: authorityDisplayName,
    organizationCode: authorityGroupKey.toUpperCase(),
    boardId: authorityGroupKey.toUpperCase(),
    jurisdictionLevel: normJur.jurisdictionLevel,
    state: normJur.stateName || 'Central',
    stateCode: normJur.stateCode,
    stateName: normJur.stateName,
    region: region,
    sector: sector,
    examCategory: examCategory,
    exam_category: examCategory,
    missionType: examCategory,
    missionStructureType: mission.missionStructureType || 'SINGLE_TRACK',
    examScope: examScope,
    studentHierarchyPath: hierarchyPath,
    readiness: readiness,
    status: visibilityGate.studentVisible ? 'LIVE' : 'PREPARING',
    catalogStatus: visibilityGate.studentVisible ? 'LIVE' : 'PREPARING',
    studentPublicationState: visibilityGate.studentVisible ? 'LIVE' : 'PREPARING',
    studentMessage: visibilityGate.studentVisible
      ? 'Mission is live and accessible!'
      : 'Mission is being prepared with source-verified syllabus and PYQ archive.',
    userPanelVisible: visibilityGate.userPanelVisible,
    cardVisible: visibilityGate.cardVisible,
    visibility: {
      studentVisible: visibilityGate.studentVisible,
      catalogVisible: visibilityGate.catalogVisible,
      userPanelVisible: visibilityGate.userPanelVisible,
      quickEntryEnabled: visibilityGate.quickEntryEnabled,
      smartEntryEnabled: visibilityGate.smartEntryEnabled
    },
    archived: false,
    source: {
      missionRealmPath: `mission_realms/${missionId}`,
      mirroredBy: 'generic_authority_mission_materializer',
      materializerPhase: '47B_GENERIC_INDIA_FACTORY'
    },
    createdAt: exCat?.createdAt || mission.createdAt || nowIso,
    updatedAt: exCat?.updatedAt || nowIso
  };

  return {
    missionId,
    realmData,
    recruitmentData,
    catalogData
  };
}

/**
 * Runs a dry-run materialization against an existing state store (Mock DB or Firestore snapshot).
 * Returns planned operations and exact semantic diffs.
 */
function runBulkMaterializerDryRun(manifest, currentStateStore = {}) {
  validateManifestSchema(manifest);

  const nowIso = new Date().toISOString();
  const plannedOperations = [];
  const mutationManifest = [];

  const existingRealms = currentStateStore.mission_realms || {};
  const existingRecruitments = currentStateStore.recruitments || {};
  const existingCatalog = currentStateStore.student_mission_catalog || {};

  let semanticCreates = 0;
  let semanticUpdates = 0;
  let semanticNoOps = 0;

  manifest.missions.forEach(mission => {
    const projections = buildCanonicalProjections(mission, currentStateStore, nowIso);
    const mId = projections.missionId;

    const targets = [
      { col: 'mission_realms', path: `mission_realms/${mId}`, data: projections.realmData, store: existingRealms },
      { col: 'recruitments', path: `recruitments/${mId}`, data: projections.recruitmentData, store: existingRecruitments },
      { col: 'student_mission_catalog', path: `student_mission_catalog/${mId}`, data: projections.catalogData, store: existingCatalog }
    ];

    targets.forEach(t => {
      const existingDoc = t.store[mId];
      const candidateDigest = computeSemanticDigest(t.data);

      if (!existingDoc) {
        semanticCreates++;
        const op = {
          targetPath: t.path,
          collection: t.col,
          documentId: mId,
          operation: 'CREATE',
          semanticDigest: candidateDigest,
          diff: { before: null, after: t.data }
        };
        plannedOperations.push(op);
        mutationManifest.push({ path: t.path, op: 'CREATE', digest: candidateDigest });
      } else {
        const existingDigest = computeSemanticDigest(existingDoc);
        if (existingDigest === candidateDigest) {
          semanticNoOps++;
          plannedOperations.push({
            targetPath: t.path,
            collection: t.col,
            documentId: mId,
            operation: 'NO_CHANGE',
            semanticDigest: candidateDigest,
            diff: { before: existingDoc, after: existingDoc }
          });
        } else {
          semanticUpdates++;
          const mergedData = { ...existingDoc, ...t.data, updatedAt: nowIso };
          const op = {
            targetPath: t.path,
            collection: t.col,
            documentId: mId,
            operation: 'UPDATE',
            semanticDigest: candidateDigest,
            previousDigest: existingDigest,
            diff: { before: existingDoc, after: mergedData }
          };
          plannedOperations.push(op);
          mutationManifest.push({ path: t.path, op: 'UPDATE', previousDigest: existingDigest, digest: candidateDigest });
        }
      }
    });
  });

  return {
    dryRunTimestamp: nowIso,
    manifestVersion: manifest.manifestVersion,
    totalMissionsEvaluated: manifest.missions.length,
    totalProjectionsEvaluated: manifest.missions.length * 3,
    summary: {
      semanticCreates,
      semanticUpdates,
      semanticNoOps,
      totalMutationsPlanned: semanticCreates + semanticUpdates
    },
    plannedOperations,
    mutationManifest
  };
}

/**
 * Applies planned materialization mutations to a simulator state store to simulate desired DB state.
 */
function applyToSimulatorState(currentStateStore = {}, dryRunResult) {
  const nextState = {
    mission_realms: { ...(currentStateStore.mission_realms || {}) },
    recruitments: { ...(currentStateStore.recruitments || {}) },
    student_mission_catalog: { ...(currentStateStore.student_mission_catalog || {}) }
  };

  dryRunResult.plannedOperations.forEach(op => {
    if (op.operation === 'CREATE' || op.operation === 'UPDATE') {
      nextState[op.collection][op.documentId] = JSON.parse(JSON.stringify(op.diff.after));
    }
  });

  return nextState;
}

module.exports = {
  IMMUTABLE_PILOT_IDS,
  JURISDICTION_LEVELS,
  EXAM_CATEGORIES,
  STATE_UT_NAMES,
  canonicalJsonStringify,
  computeSemanticDigest,
  normalizeJurisdictionAndState,
  evaluateStudentVisibilityGate,
  validateManifestSchema,
  buildCanonicalProjections,
  runBulkMaterializerDryRun,
  applyToSimulatorState
};
