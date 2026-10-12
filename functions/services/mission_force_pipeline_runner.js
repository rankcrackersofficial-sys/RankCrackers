'use strict';

const crypto = require('crypto');
const { canonicalAuthorityRegistry } = require('./authority_intelligence');
const { verifySha256Hex } = require('./mission_source_preflight');

const RUNNER_ACTOR = 'mission_force_pipeline_runner_v1';

function required(value, code) { if (typeof value !== 'string' || !value.trim()) throw new Error(code); return value.trim(); }

function buildRunnerRequest(input = {}) {
  const missionId = required(input.missionId, 'FORCE_PIPELINE_MISSION_REQUIRED');
  const authorityKey = required(input.authorityKey, 'FORCE_PIPELINE_AUTHORITY_REQUIRED');
  canonicalAuthorityRegistry.getByKey(authorityKey, true);
  const cycleKey = required(input.cycleKey, 'FORCE_PIPELINE_CYCLE_REQUIRED');
  const sourceUrl = required(input.officialSourceUrl, 'FORCE_PIPELINE_SOURCE_URL_REQUIRED');
  if (!Buffer.isBuffer(input.bytes) || input.bytes.length === 0) throw new Error('FORCE_PIPELINE_SERVER_BYTES_REQUIRED');
  const syllabusBindingMode = required(input.syllabusBindingMode, 'FORCE_PIPELINE_BINDING_MODE_REQUIRED');
  if (!['SEPARATE', 'EMBEDDED'].includes(syllabusBindingMode)) throw new Error('FORCE_PIPELINE_BINDING_MODE_INVALID');
  const sourceLanguage = required(input.sourceLanguage, 'FORCE_PIPELINE_SOURCE_LANGUAGE_REQUIRED').toLowerCase();
  if (!['en','eng','english'].includes(sourceLanguage)) throw new Error('FORCE_PIPELINE_SOURCE_LANGUAGE_UNSUPPORTED');
  return Object.freeze({ missionId, cycleKey, authorityKey, sourceUrl, bytes: input.bytes, sourceLanguage, syllabusBindingMode, sourceType: input.sourceType || 'notification', requestId: required(input.requestId, 'FORCE_PIPELINE_REQUEST_ID_REQUIRED') });
}

function verifyServerSource(request) {
  const { buildFinalizedOfficialSource } = require('./mission_official_source_finalizer');
  const finalized = buildFinalizedOfficialSource({ missionId: request.missionId, cycleKey: request.cycleKey, authorityKey: request.authorityKey, sourceType: request.sourceType, sourceUrl: request.sourceUrl, bytes: request.bytes, recordedAt: request.recordedAt || new Date().toISOString() });
  const actualSha256 = verifySha256Hex(request.bytes);
  if (actualSha256 !== finalized.contentSha256) throw new Error('FORCE_PIPELINE_SERVER_SHA_MISMATCH');
  return Object.freeze({ ...finalized, actualSha256, contentSha256: actualSha256, boundMissionId: request.missionId, boundCycleKey: request.cycleKey, isOfficial: true, language: request.sourceLanguage });
}

async function executeAuthorizedForcePipeline({ request, resolveMission, createHiddenMission, ingestSource, verifySource, materializeEmbeddedRole, handoffPair }) {
  const plan = buildRunnerRequest(request);
  // This single-source pilot creates the syllabus only when officially embedded.
  // SEPARATE source pairs need an independent two-upload coordinator and must
  // never be misrepresented as a completed force pipeline.
  if (plan.syllabusBindingMode !== 'EMBEDDED') throw new Error('FORCE_PIPELINE_SEPARATE_PAIR_NOT_IMPLEMENTED');
  if (plan.sourceType !== 'notification') throw new Error('FORCE_PIPELINE_EMBEDDED_REQUIRES_NOTIFICATION');
  const existing = await resolveMission(plan.missionId);
  let mission = existing;
  let missionState = 'EXISTING_MISSION_REUSED';
  if (!mission) {
    if (request.allowForceCreate !== true) throw new Error('FORCE_PIPELINE_MISSION_MISSING');
    mission = await createHiddenMission({ ...plan, status: 'PASSIVE', studentVisible: false, actor: RUNNER_ACTOR });
    missionState = 'HIDDEN_MISSION_CREATED';
  }
  if (mission.studentVisible === true || mission.cardVisible === true || mission.userPanelVisible === true) throw new Error('FORCE_PIPELINE_STUDENT_VISIBILITY_FORBIDDEN');
  if (mission.authorityKey && mission.authorityKey !== plan.authorityKey) throw new Error('FORCE_PIPELINE_MISSION_AUTHORITY_MISMATCH');
  if (typeof verifySource !== 'function') throw new Error('FORCE_PIPELINE_VERIFIER_REQUIRED');
  const pending = verifyServerSource(plan);
  const storedPending = await ingestSource({ mission, source: pending, bytes: plan.bytes, actor: RUNNER_ACTOR });
  const stored = await verifySource({ mission, source: storedPending, actor: RUNNER_ACTOR });
  if (!stored || stored.status !== 'VERIFIED' || stored.verifiedBy !== 'mission_source_pair_verifier_v1') throw new Error('FORCE_PIPELINE_GOVERNED_VERIFICATION_REQUIRED');
  let notification = plan.sourceType === 'notification' ? stored : null;
  let syllabus = plan.sourceType === 'syllabus' ? stored : null;
  if (plan.syllabusBindingMode === 'EMBEDDED') {
    if (plan.sourceType !== 'notification') throw new Error('FORCE_PIPELINE_EMBEDDED_REQUIRES_NOTIFICATION');
    if (typeof materializeEmbeddedRole !== 'function') throw new Error('FORCE_PIPELINE_EMBEDDED_ROLE_MATERIALIZER_REQUIRED');
    syllabus = await materializeEmbeddedRole({ mission, notification: stored, actor: RUNNER_ACTOR });
  }
  const pairResult = await handoffPair({ mission, notification, syllabus, cycleKey: plan.cycleKey, authorityKey: plan.authorityKey, actor: RUNNER_ACTOR });
  return Object.freeze({ missionId: plan.missionId, cycleKey: plan.cycleKey, missionState, sourceState: 'VERIFIED', pairResult, studentVisible: false });
}

module.exports = { RUNNER_ACTOR, buildRunnerRequest, verifyServerSource, executeAuthorizedForcePipeline };
