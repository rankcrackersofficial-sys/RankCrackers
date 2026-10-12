'use strict';

/**
 * Legacy examination-specific utilities are evidence archives, not
 * production ingestion/materialization authority. Preserve their original
 * content in Git history, but fail before loading Firebase Admin or touching
 * any file, network endpoint, or Student collection.
 *
 * All missions must enter the same mission-scoped, verified source pipeline.
 */
function rejectLegacyMissionSpecificExecution(scriptName) {
  if (typeof scriptName !== 'string' || !/^[a-z0-9_.-]+$/i.test(scriptName)) {
    throw new Error('MISSION_AGNOSTIC_LEGACY_EXECUTOR_NAME_INVALID');
  }
  throw new Error('MISSION_AGNOSTIC_LEGACY_EXECUTOR_RETIRED: ' + scriptName
    + '; use the governed mission-neutral source pipeline');
}

module.exports = { rejectLegacyMissionSpecificExecution };
