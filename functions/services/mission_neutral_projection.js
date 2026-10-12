'use strict';

/**
 * Exactly one student projection schema for ALL exam missions.
 * No exam ID, paper, subject, run ID or source is ever inferred by default.
 */
function buildMissionNeutralProjectionNode({ node, nodeId, request }) {
  if (!node || typeof node !== 'object') throw new Error('MISSION_PROJECTION_NODE_REQUIRED');
  if (!request || typeof request.missionId !== 'string' || !request.missionId.trim()) {
    throw new Error('MISSION_PROJECTION_MISSION_REQUIRED');
  }
  const required = (value, code) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error(code);
    return value.trim();
  };
  const id = required(nodeId, 'MISSION_PROJECTION_NODE_ID_REQUIRED');
  const runId = required(node.runId, 'MISSION_PROJECTION_RUN_ID_REQUIRED');
  const subjectId = required(node.subjectId, 'MISSION_PROJECTION_SUBJECT_REQUIRED');
  const nodeType = required(node.nodeType, 'MISSION_PROJECTION_NODE_TYPE_REQUIRED');
  const title = required(node.canonicalTitle || node.title, 'MISSION_PROJECTION_TITLE_REQUIRED');
  const sourceVersionId = required(request.sourceVersionId, 'MISSION_PROJECTION_SOURCE_VERSION_REQUIRED');
  const sourceSha256 = required(request.sourceSha256, 'MISSION_PROJECTION_SOURCE_SHA_REQUIRED');
  if (!/^[a-f0-9]{64}$/.test(sourceSha256)) throw new Error('MISSION_PROJECTION_SOURCE_SHA_INVALID');
  if (node.missionId && node.missionId !== request.missionId) {
    throw new Error('MISSION_PROJECTION_MISSION_MISMATCH');
  }
  if (node.sourceVersionId && node.sourceVersionId !== sourceVersionId) {
    throw new Error('MISSION_PROJECTION_SOURCE_VERSION_MISMATCH');
  }
  if (node.sourceSha256 && node.sourceSha256 !== sourceSha256) {
    throw new Error('MISSION_PROJECTION_SOURCE_SHA_MISMATCH');
  }
  if (!Number.isSafeInteger(node.sourceOrder) || node.sourceOrder < 0) {
    throw new Error('MISSION_PROJECTION_SOURCE_ORDER_REQUIRED');
  }
  if (!Number.isSafeInteger(request.activationEpoch) || request.activationEpoch < 0) {
    throw new Error('MISSION_PROJECTION_ACTIVATION_EPOCH_REQUIRED');
  }
  const paperId = node.paperId == null ? null : required(node.paperId, 'MISSION_PROJECTION_PAPER_INVALID');
  return Object.freeze({
    id, nodeId: id, missionId: request.missionId, nodeType, paperId,
    runId, subjectId, parentId: node.parentId || node.parentKey || null,
    canonicalTitle: title, sourceOrder: node.sourceOrder,
    sourceVersionId, sourceSha256, activationEpoch: request.activationEpoch,
  });
}

module.exports = { buildMissionNeutralProjectionNode };
