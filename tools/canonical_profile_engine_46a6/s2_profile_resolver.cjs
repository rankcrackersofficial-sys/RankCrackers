'use strict';

const { validateProfile } = require('./profile_validator.cjs');

/**
 * Generic S2 Document Profile Resolver
 * 
 * Bridges missionId -> CanonicalMissionProfile -> s2DocumentProfile
 * Strictly fail-closed: If profile is missing, invalid, or HOLD_FOR_REVIEW,
 * resolution status is set to 'HOLD' with ZERO fabricated defaults.
 */
function resolveS2DocumentProfile(profile, options = {}) {
  const { variantId, paperFamilyId } = options;

  // 1. Missing Profile Fail-Closed Check
  if (!profile || typeof profile !== 'object') {
    return {
      status: 'HOLD',
      resolved: false,
      reason: 'MISSING_CANONICAL_MISSION_PROFILE',
      profileFallbackCount: 0,
      s2DocumentProfile: null,
      diagnostics: 'No canonical mission profile provided. Stage 2 extraction cannot proceed without governed profile.'
    };
  }

  // 2. Validate Profile Structure
  const validation = validateProfile(profile);
  if (!validation.valid) {
    return {
      status: 'HOLD',
      resolved: false,
      reason: 'INVALID_CANONICAL_MISSION_PROFILE',
      profileFallbackCount: 0,
      errors: validation.errors,
      s2DocumentProfile: null,
      diagnostics: 'Canonical mission profile failed validation. S2 resolution aborted.'
    };
  }

  // 3. Status Gate Check (HOLD_FOR_REVIEW fails closed)
  if (profile.profileStatus === 'HOLD_FOR_REVIEW') {
    return {
      status: 'HOLD',
      resolved: false,
      reason: 'PROFILE_STATUS_HOLD_FOR_REVIEW',
      profileFallbackCount: 0,
      s2DocumentProfile: null,
      diagnostics: 'Canonical mission profile is explicitly marked HOLD_FOR_REVIEW. Extraction is held.'
    };
  }

  const rawS2 = profile.s2DocumentProfile;
  if (!rawS2 || typeof rawS2 !== 'object') {
    return {
      status: 'HOLD',
      resolved: false,
      reason: 'MISSING_S2_DOCUMENT_PROFILE_SECTION',
      profileFallbackCount: 0,
      s2DocumentProfile: null,
      diagnostics: 'Profile lacks required s2DocumentProfile section.'
    };
  }

  // 4. Resolve Context-Specific Paper Family & Variant
  let activePaperFamily = null;
  if (Array.isArray(profile.paperModel?.paperFamilies) && profile.paperModel.paperFamilies.length > 0) {
    if (paperFamilyId) {
      activePaperFamily = profile.paperModel.paperFamilies.find(f => f.familyId === paperFamilyId) || null;
      if (!activePaperFamily) {
        return {
          status: 'HOLD',
          resolved: false,
          reason: `UNKNOWN_PAPER_FAMILY_REQUESTED: '${paperFamilyId}'`,
          profileFallbackCount: 0,
          s2DocumentProfile: null
        };
      }
    } else if (variantId && Array.isArray(profile.variantModel?.variants)) {
      const v = profile.variantModel.variants.find(item => item.variantId === variantId);
      if (v?.applicablePaperFamilyId) {
        activePaperFamily = profile.paperModel.paperFamilies.find(f => f.familyId === v.applicablePaperFamilyId) || null;
      }
    }
  }

  // 5. Construct Resolved S2 Document Profile
  // Zero fallback to 'paper_default' or 'unknown_subject'.
  const resolvedProfile = {
    missionId: profile.identity?.missionId || profile.missionId,
    canonicalExamName: profile.identity?.canonicalExamName || profile.canonicalExamName,
    missionTargetYear: profile.missionTargetYear,
    sourceBaselineYear: profile.sourceBaselineYear,
    cycleRelation: profile.cycleRelation,
    expectedPapers: [...rawS2.expectedPapers],
    paperAliases: { ...(rawS2.paperAliases || {}) },
    expectedSubjects: [...rawS2.expectedSubjects],
    subjectAliases: { ...(rawS2.subjectAliases || {}) },
    variantContext: variantId || rawS2.variantContext || null,
    activePaperFamily: activePaperFamily ? { ...activePaperFamily } : null,
    languageScripts: [...rawS2.languageScripts],
    preferredOcrLanguages: [...rawS2.preferredOcrLanguages],
    sourceYearPolicy: rawS2.sourceYearPolicy || `USE_${profile.sourceBaselineYear}_BASELINE`,
    provenanceTag: rawS2.provenanceTag || 'SYSTEM_DERIVED',
    profileHash: profile.profileHash || null
  };

  return {
    status: 'READY',
    resolved: true,
    reason: 'GOVERNED_PROFILE_RESOLVED',
    profileFallbackCount: 0,
    s2DocumentProfile: resolvedProfile
  };
}

module.exports = {
  resolveS2DocumentProfile
};
