'use strict';

/**
 * RankCrackers Canonical Mission & Crucible Template Defaults (46D12)
 * 
 * CANONICAL ARCHITECTURE LAW:
 * 1. Crucible is strictly a 98-day continuous rotating cycle (Orbit: Day 98 -> Day 1).
 * 2. Structure is strictly 7 Phases x 14 Days = 98 Days.
 * 3. Major Tests are strictly decoupled from Crucible missionPlan and belong exclusively
 *    to the Test Arena contract.
 * 4. Invariants are protected: totalDays=98, cycleDays=98, majorTestRule=absent.
 * 5. Default recruitment status is 'draft' (or 'passive'), never blindly 'published'.
 */

const CANONICAL_7_PHASES = Object.freeze([
  { phaseNumber: 1, name: 'Phase 1 - Initial Foundation & Core Syntax', startDay: 1, endDay: 14, durationDays: 14, type: 'FOUNDATION' },
  { phaseNumber: 2, name: 'Phase 2 - Core Mechanics & Concept Integration', startDay: 15, endDay: 28, durationDays: 14, type: 'CORE_CONCEPTS' },
  { phaseNumber: 3, name: 'Phase 3 - Analytical Depth & Intermediate Synthesis', startDay: 29, endDay: 42, durationDays: 14, type: 'INTERMEDIATE_SYNTHESIS' },
  { phaseNumber: 4, name: 'Phase 4 - Advanced Mastery & Multi-Topic Fusion', startDay: 43, endDay: 56, durationDays: 14, type: 'ADVANCED_MASTERY' },
  { phaseNumber: 5, name: 'Phase 5 - Precision Drills & Velocity Conditioning', startDay: 57, endDay: 70, durationDays: 14, type: 'VELOCITY_CONDITIONING' },
  { phaseNumber: 6, name: 'Phase 6 - High-Yield Refinement & Error Elimination', startDay: 71, endDay: 84, durationDays: 14, type: 'ERROR_ELIMINATION' },
  { phaseNumber: 7, name: 'Phase 7 - Full Orbit Consolidation & Synthesis', startDay: 85, endDay: 98, durationDays: 14, type: 'SYNTHESIS_CONSOLIDATION' }
]);

function createCanonicalMissionPlan(overrides = {}) {
  // Enforce strict invariant checks on caller overrides
  if (overrides.totalDays !== undefined && overrides.totalDays !== 98) {
    throw new Error(`INVALID_CRUCIBLE_TOTAL_DAYS: Crucible architecture strictly requires 98 days (got ${overrides.totalDays}).`);
  }
  if (overrides.cycleDays !== undefined && overrides.cycleDays !== 98) {
    throw new Error(`INVALID_CRUCIBLE_CYCLE_DAYS: Crucible cycleDays must be exactly 98 (got ${overrides.cycleDays}).`);
  }
  if (overrides.majorTestRule !== undefined) {
    throw new Error('MAJOR_TEST_FORBIDDEN_IN_CRUCIBLE: Major Tests must be defined under Test Arena contract, not inside Crucible missionPlan.');
  }

  const safeOverrides = { ...overrides };
  delete safeOverrides.totalDays;
  delete safeOverrides.cycleDays;
  delete safeOverrides.majorTestRule;
  delete safeOverrides.phases;

  return {
    totalDays: 98,
    cycleDays: 98,
    mode: 'CONTINUOUS_ROTATING_ORBIT',
    phases: CANONICAL_7_PHASES,
    ...safeOverrides
  };
}

function buildCanonicalRecruitmentPayload(params = {}) {
  const {
    missionId,
    examName,
    organization,
    year,
    examCategory = 'competitive',
    nature = 'PASSIVE',
    status = 'draft', // Safe default: never blindly 'published'
    createdAt = new Date().toISOString(),
    planOverrides = {},
    examStructure = null
  } = params;

  if (!missionId) {
    throw new Error('MISSION_ID_REQUIRED: buildCanonicalRecruitmentPayload requires missionId.');
  }

  const payload = {
    id: missionId,
    title: examName || missionId,
    org: organization || 'RankCrackers Governed Authority',
    year: year || 2026,
    examCategory,
    status,
    nature,
    createdAt,
    version: '1.0.0',
    missionPlan: createCanonicalMissionPlan(planOverrides)
  };

  if (examStructure) {
    payload.examStructure = examStructure;
  }

  return payload;
}

module.exports = {
  CANONICAL_7_PHASES,
  createCanonicalMissionPlan,
  buildCanonicalRecruitmentPayload
};
