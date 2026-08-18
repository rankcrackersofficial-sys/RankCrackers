/**
 * AUTHORITATIVE CANONICAL MISSION ID REGISTRY
 * Shared domain logic for RankCrackers mission identity management.
 */

// Approved pilot alias registry
const PILOT_ALIASES = {
  'jee_main_2026': ['jee main 2026'],
  'neet_(ug)-2027': ['neet', 'neet ug', 'neet (ug) 2027'],
  'RPSC_FIRST_GRADE2026_2026_1782713222215': ['rpsc 1st grade', 'rpsc first grade', 'rpsc first grade 2026']
};

const KNOWN_PILOT_IDS = new Set(Object.keys(PILOT_ALIASES));

/**
 * Resolves input display parameters to the canonical backend mission ID.
 * ONLY called for new mission creations.
 */
function resolveCanonicalMissionId(examName, organization, year, cycle = '') {
  const normName = String(examName || '').trim().toLowerCase();
  const targetYear = parseInt(year || 2026, 10);

  // Preserve the 2026 pilot only for explicit 2026-era JEE Main input.
  // Later Founder-created missions such as JEE Main 2027 must keep their own identity.
  if (normName === 'jee main' && targetYear === 2026) {
    return 'jee_main_2026';
  }

  // 1. Check pilot aliases with exact matching to prevent partial matches
  for (const [canonicalId, aliases] of Object.entries(PILOT_ALIASES)) {
    for (const alias of aliases) {
      if (normName === alias) {
        return canonicalId;
      }
    }
  }

  // 2. Fallback to standard slugified format for new missions
  const orgCode = String(organization || 'central').toLowerCase().replace(/\s/g, '_');
  const examCode = normName.replace(/\s/g, '_');
  const suffix = cycle ? `_${cycle}` : '';
  return `rec_${orgCode}_${examCode}_${targetYear}${suffix}`.replace(/_+/g, '_').replace(/_$/, '');
}

/**
 * Validates or resolves the canonical ID depending on action type.
 * Enforces: updateFallbackIdGeneration = 0.
 */
function validateOrResolveId(action, payload = {}, existingId = '') {
  // For creation actions: resolve from parameters
  if (action === 'launch_exam_mission') {
    const { examName, organization, year, cycle } = payload;
    return resolveCanonicalMissionId(examName, organization, year, cycle);
  }

  // For lifecycle/update actions: existingId (e.g. recruitmentId) is mandatory
  if (!existingId || typeof existingId !== 'string' || existingId.trim() === '') {
    throw new Error('CANONICAL_ID_REQUIRED: Lifecycle actions require an authoritative canonical ID.');
  }

  const cleanId = existingId.trim();

  // Validate character structure to prevent injection/corruption
  if (!/^[a-zA-Z0-9_\-()]+$/.test(cleanId)) {
    throw new Error(`INVALID_CANONICAL_ID: Canonical ID '${cleanId}' fails alphanumeric validation.`);
  }

  // Enforce no new ID generation for update actions
  return cleanId;
}

module.exports = {
  PILOT_ALIASES,
  KNOWN_PILOT_IDS,
  resolveCanonicalMissionId,
  validateOrResolveId
};
