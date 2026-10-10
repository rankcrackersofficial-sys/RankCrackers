/**
 * 🔱 RANKCRACKERS MISSION CREATION FAST PATH & MULTI-OUTPUT ADAPTER
 * Gate 48CS2 — One-Source Multi-Output Backend Engine Lane
 *
 * Implements the generic fast-path input adapter:
 * When a CLEAN mission profile arrives:
 *   - Generates 3-projection mission (mission_realms, recruitments, student_mission_catalog)
 *   - PLUS independently:
 *     - RecruitmentCycle candidate if source represents a real current cycle
 *     - CareerSignal candidate
 *
 * Guarantees:
 *   - No yearly duplicate Mission creation (permanent mission remains canonical)
 *   - Separation of transient cycles from permanent missions
 */

'use strict';

const { normalizeMissionCandidate, buildMissionProjections } = require('./generic_mission_materializer');
const { routeSourceDocumentImpact } = require('./source_impact_router');

/**
 * Processes clean profile through fast path.
 */
function processCleanMissionFastPath(cleanProfile, sourceDocument, existingState = {}, options = {}) {
  const nowIso = options.nowIso || new Date().toISOString();

  // 1. Generate 3-Projection Mission Projections
  const projections = buildMissionProjections(cleanProfile, existingState, { ...options, nowIso });

  // 2. Independently Route Source Document for Career Signals & Academic Links
  let sourceImpacts = null;
  if (sourceDocument) {
    sourceImpacts = routeSourceDocumentImpact(sourceDocument, {
      ...options,
      nowIso,
      existingCyclesStore: existingState.recruitment_cycles || {},
      existingMissionsStore: existingState.mission_realms || {}
    });
  }

  return {
    permanentMissionId: projections.missionId,
    missionProjections: {
      mission_realms: projections.realmData,
      recruitments: projections.recruitmentData,
      student_mission_catalog: projections.catalogData
    },
    careerSignalImpact: sourceImpacts ? sourceImpacts.impacts.careerSignalImpact : null,
    academicImpactRef: sourceImpacts ? sourceImpacts.impacts.academicImpactRef : null,
    pyqPatternImpactRef: sourceImpacts ? sourceImpacts.impacts.pyqPatternImpactRef : null
  };
}

module.exports = {
  processCleanMissionFastPath
};
