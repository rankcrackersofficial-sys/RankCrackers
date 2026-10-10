'use strict';

const { computeProfileHash, cleanAndSortForHash } = require('./profile_schema.cjs');
const { validateProfile } = require('./profile_validator.cjs');
const { resolveS2DocumentProfile } = require('./s2_profile_resolver.cjs');

/**
 * Deep semantic diff between two profiles, ignoring volatile timestamp fields.
 */
function diffProfiles(beforeProfile, afterProfile) {
  const diffs = [];
  if (!beforeProfile && !afterProfile) return diffs;

  if (!beforeProfile && afterProfile) {
    diffs.push({ field: '*', type: 'INITIAL_CREATION', before: null, after: afterProfile });
    return diffs;
  }
  if (beforeProfile && !afterProfile) {
    diffs.push({ field: '*', type: 'DELETION', before: beforeProfile, after: null });
    return diffs;
  }

  const cleanBefore = cleanAndSortForHash(beforeProfile);
  const cleanAfter = cleanAndSortForHash(afterProfile);

  const allKeys = new Set([...Object.keys(cleanBefore), ...Object.keys(cleanAfter)]);
  for (const key of allKeys) {
    const valBefore = cleanBefore[key];
    const valAfter = cleanAfter[key];
    if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
      diffs.push({
        field: key,
        before: valBefore,
        after: valAfter
      });
    }
  }

  return diffs;
}

/**
 * Validates a profile.
 */
function validate(profile) {
  return validateProfile(profile);
}

/**
 * Generates an idempotent materialization plan.
 * 
 * @param {Object} profile - The CanonicalMissionProfile to materialize.
 * @param {Object} currentStorageState - Simulated or fetched storage state { [missionId]: { canonicalProfile, missionRealmExists, ... } }
 * @param {Object} allowlist - Strict mutation allowlist
 * @param {Object} preconditions - Expected versions / hashes { expectedProfileVersion, expectedProfileHash }
 */
function plan(profile, currentStorageState = {}, allowlist = null, preconditions = {}) {
  // 1. Strict Validation
  const validation = validateProfile(profile);
  if (!validation.valid) {
    throw new Error(`PROFILE_VALIDATION_FAILED: ${validation.errors.join('; ')}`);
  }

  const missionId = validation.missionId;
  const targetPath = `mission_realms/${missionId}/canonical_profile/current`;
  const computedHash = computeProfileHash(profile);

  // 2. Precondition Verification (Fail Closed on Mismatch)
  const currentMission = currentStorageState[missionId] || {};
  if (preconditions.expectedMissionRealmExists !== false && currentMission.missionRealmExists === false) {
    throw new Error(`PRECONDITION_FAILED: Mission realm parent 'mission_realms/${missionId}' does not exist.`);
  }

  if (preconditions.expectedProfileVersion !== undefined) {
    const liveVersion = currentMission.profileVersion || 0;
    if (liveVersion !== preconditions.expectedProfileVersion) {
      throw new Error(`PRECONDITION_FAILED: Stale profile version. Expected ${preconditions.expectedProfileVersion}, found ${liveVersion}.`);
    }
  }

  if (preconditions.expectedProfileHash !== undefined) {
    const liveHash = currentMission.profileHash || null;
    if (liveHash !== preconditions.expectedProfileHash) {
      throw new Error(`PRECONDITION_FAILED: Stale profile hash. Expected ${preconditions.expectedProfileHash}, found ${liveHash}.`);
    }
  }

  // 3. Compare with Current Profile in Storage
  const existingProfile = currentMission.canonicalProfile || null;
  const existingHash = existingProfile ? computeProfileHash(existingProfile) : null;

  let changeType = 'NO_OP';
  let fieldDiffs = [];
  let plannedWritesCount = 0;

  if (!existingProfile) {
    changeType = 'CREATE';
    fieldDiffs = diffProfiles(null, profile);
    plannedWritesCount = 1;
  } else if (existingHash !== computedHash) {
    changeType = 'UPDATE';
    fieldDiffs = diffProfiles(existingProfile, profile);
    plannedWritesCount = 1;
  } else {
    changeType = 'NO_OP';
    fieldDiffs = [];
    plannedWritesCount = 0;
  }

  // 4. Mutation Allowlist Verification
  if (allowlist && plannedWritesCount > 0) {
    const allowed = allowlist.allowedMutations || [];
    const isPathAllowed = allowed.some(entry => entry.path === targetPath && (entry.operation === changeType || entry.operation === '*'));
    if (!isPathAllowed) {
      throw new Error(`UNALLOWLISTED_MUTATION_ATTEMPTED: Path '${targetPath}' (${changeType}) is not authorized in mutation allowlist.`);
    }
  }

  // 5. Check S2 Readiness
  const s2Resolution = resolveS2DocumentProfile(profile);

  return {
    missionId,
    targetDocumentPath: targetPath,
    changeType,
    isNoOp: changeType === 'NO_OP',
    plannedWritesCount,
    fieldDiffs,
    profileHash: computedHash,
    existingProfileHash: existingHash,
    validationSummary: {
      valid: true,
      canMaterialize: validation.canMaterialize,
      warnings: validation.warnings
    },
    sourceEvidenceSummary: {
      organization: profile.authority?.organization || null,
      evidenceClass: profile.authority?.evidenceClass || null,
      sha256: profile.authority?.sha256 || null,
      portals: profile.authority?.officialPortals || []
    },
    academicMetrics: {
      paperCount: validation.paperCount,
      variantCount: validation.variantCount,
      subjectCount: validation.subjectCount
    },
    s2Readiness: {
      status: s2Resolution.status,
      resolved: s2Resolution.resolved,
      reason: s2Resolution.reason
    }
  };
}

/**
 * Execution engine.
 * STRICT SAFETY: Production writes are unconditionally disabled.
 */
async function apply(materializationPlan, executionContext = {}) {
  if (executionContext.isProduction === true) {
    throw new Error('PRODUCTION_WRITES_FORBIDDEN: Profile writes to production Firestore are strictly forbidden in this 46A6 lane.');
  }

  if (materializationPlan.isNoOp) {
    return {
      status: 'IDEMPOTENT_NOOP',
      executedWrites: 0,
      targetPath: materializationPlan.targetDocumentPath,
      profileHash: materializationPlan.profileHash
    };
  }

  // Offline simulated execution only
  return {
    status: 'OFFLINE_SIMULATED_SUCCESS',
    executedWrites: materializationPlan.plannedWritesCount,
    targetPath: materializationPlan.targetDocumentPath,
    changeType: materializationPlan.changeType,
    profileHash: materializationPlan.profileHash
  };
}

module.exports = {
  diffProfiles,
  validate,
  plan,
  apply
};
