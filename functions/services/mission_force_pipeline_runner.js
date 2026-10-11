'use strict';

const crypto = require('crypto');
const { canonicalAuthorityRegistry } = require('./authority_intelligence');
const { preflightSourceBinding, verifySha256Hex } = require('./mission_source_preflight');

const RUNNER_ACTOR = 'mission_force_pipeline_runner_v1';
const SSC_CGL = Object.freeze({ missionId: 'ssc_cgl', authorityKey: 'auth_in_ssc', jurisdictionLevel: 'CENTRAL', syllabusBindingMode: 'EMBEDDED' });

function required(value, code) { if (typeof value !== 'string' || !value.trim()) throw new Error(code); return value.trim(); }

function assertAuthorized(request) {
  if (!request || request.internal !== true || request.actorType !== 'AUTHORIZED_AGENT' || request.permission !== 'mission.source.ingest') {
    throw new Error('FORCE_PIPELINE_UNAUTHORIZED');
  }
  return true;
}

function buildRunnerRequest(input = {}) {
  assertAuthorized(input.authorization);
  const missionId = required(input.missionId || SSC_CGL.missionId, 'FORCE_PIPELINE_MISSION_REQUIRED');
  const authorityKey = required(input.authorityKey || SSC_CGL.authorityKey, 'FORCE_PIPELINE_AUTHORITY_REQUIRED');
  canonicalAuthorityRegistry.getByKey(authorityKey, true);
  const cycleKey = required(input.cycleKey, 'FORCE_PIPELINE_CYCLE_REQUIRED');
  const sourceUrl = required(input.officialSourceUrl, 'FORCE_PIPELINE_SOURCE_URL_REQUIRED');
  if (!Buffer.isBuffer(input.bytes) || input.bytes.length === 0) throw new Error('FORCE_PIPELINE_SERVER_BYTES_REQUIRED');
  const syllabusBindingMode = input.syllabusBindingMode || SSC_CGL.syllabusBindingMode;
  if (!['SEPARATE', 'EMBEDDED', 'PENDING'].includes(syllabusBindingMode)) throw new Error('FORCE_PIPELINE_BINDING_MODE_INVALID');
  return Object.freeze({ missionId, cycleKey, authorityKey, sourceUrl, bytes: input.bytes, syllabusBindingMode, sourceType: input.sourceType || 'notification', requestId: required(input.requestId, 'FORCE_PIPELINE_REQUEST_ID_REQUIRED') });
}

function verifyServerSource(request) {
  const { buildFinalizedOfficialSource } = require('./mission_official_source_finalizer');
  const finalized = buildFinalizedOfficialSource({ missionId: request.missionId, cycleKey: request.cycleKey, authorityKey: request.authorityKey, sourceType: request.sourceType, sourceUrl: request.sourceUrl, bytes: request.bytes, recordedAt: request.recordedAt || new Date().toISOString() });
  const actualSha256 = verifySha256Hex(request.bytes);
  if (actualSha256 !== finalized.contentSha256) throw new Error('FORCE_PIPELINE_SERVER_SHA_MISMATCH');
  const verified = { ...finalized, status: 'VERIFIED', verificationState: 'verified', governanceStatus: 'ACTIVE', verifiedBy: 'mission_source_pair_verifier_v1', actualSha256, contentSha256: actualSha256, boundMissionId: request.missionId, boundCycleKey: request.cycleKey, isOfficial: true, language: 'english' };
  const report = preflightSourceBinding({ source: { sourceId: verified.documentId, sourceType: verified.sourceType, verificationState: verified.verificationState, governanceStatus: verified.governanceStatus, isOfficial: true, officialDomain: verified.officialDomain, authorityKey: verified.authorityKey, language: verified.language, expectedSha256: verified.contentSha256, actualSha256: verified.actualSha256, boundMissionId: verified.missionId, boundCycleKey: verified.cycleKey }, expectation: { missionId: request.missionId, cycleKey: request.cycleKey, sourceType: request.sourceType, authorityKey: request.authorityKey, expectedSha256: actualSha256 } });
  if (report.status !== 'PASS') throw new Error(`FORCE_PIPELINE_SOURCE_VERIFICATION_FAILED:${report.failures.map(f => f.code).join(',')}`);
  return Object.freeze(verified);
}

async function executeAuthorizedForcePipeline({ request, resolveMission, createHiddenMission, ingestSource, handoffPair }) {
  const plan = buildRunnerRequest(request);
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
  const verified = verifyServerSource(plan);
  const stored = await ingestSource({ mission, source: verified, bytes: plan.bytes, actor: RUNNER_ACTOR });
  const pairResult = await handoffPair({ mission, notification: plan.sourceType === 'notification' ? stored : null, syllabus: plan.syllabusBindingMode === 'EMBEDDED' ? { ...stored, sourceType: 'syllabus', documentId: `syllabus_${stored.contentSha256}`, storagePath: stored.storagePath.replace(stored.documentId, `syllabus_${stored.contentSha256}`) } : stored, cycleKey: plan.cycleKey, authorityKey: plan.authorityKey, actor: RUNNER_ACTOR });
  return Object.freeze({ missionId: plan.missionId, cycleKey: plan.cycleKey, missionState, sourceState: 'VERIFIED', pairResult, studentVisible: false });
}

module.exports = { RUNNER_ACTOR, SSC_CGL, assertAuthorized, buildRunnerRequest, verifyServerSource, executeAuthorizedForcePipeline };
