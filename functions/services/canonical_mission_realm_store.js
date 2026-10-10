'use strict';

/**
 * Canonical Mission Realm boundary.
 *
 * mission_realms/{missionId} is the only authoritative mission document.
 * recruitments/{missionId} and student_mission_catalog/{missionId} are legacy
 * projections and must not be created by new mission or notification flows.
 */

function canonicalMissionPath(missionId) {
  const id = String(missionId || '').trim();
  if (!id) throw new Error('CANONICAL_MISSION_ID_REQUIRED');
  return `mission_realms/${id}`;
}

function buildCanonicalMissionRealm(input = {}, existing = {}, now = new Date().toISOString()) {
  const missionId = String(
    input.missionId || input.mission_id || input.realmId || input.realm_id || existing.missionId || existing.realm_id || ''
  ).trim();
  if (!missionId) throw new Error('CANONICAL_MISSION_ID_REQUIRED');

  const title = String(
    input.title || input.displayName || input.examName || input.exam_name || existing.title || existing.exam_name || missionId
  ).trim();
  const visibility = input.visibilityGate || existing.visibilityGate || {};
  const studentVisible = input.studentVisible === true ||
    input.userPanelVisible === true ||
    input.cardVisible === true ||
    visibility.studentVisible === true ||
    visibility.userPanelVisible === true;

  return {
    ...existing,
    ...input,
    id: missionId,
    missionId,
    realm_id: missionId,
    canonicalMissionIdentity: missionId,
    title,
    name: input.name || title,
    displayTitle: input.displayTitle || title,
    exam_name: input.exam_name || title,
    visibilityGate: {
      ...visibility,
      studentVisible,
      catalogVisible: input.catalogDiscoverable !== false && studentVisible,
      userPanelVisible: studentVisible,
      cardVisible: studentVisible,
      gateStatus: input.status || existing.status || 'PREPARING',
    },
    userPanelVisible: studentVisible,
    cardVisible: studentVisible,
    archived: input.archived === true || existing.archived === true,
    updatedAt: now,
    updated_at: now,
    createdAt: existing.createdAt || input.createdAt || now,
    created_at: existing.created_at || input.created_at || now,
  };
}

function buildCanonicalOfficialDocument(input = {}, missionId, now = new Date().toISOString()) {
  const documentId = String(input.documentId || input.id || input.sourceId || '').trim();
  if (!documentId) throw new Error('CANONICAL_DOCUMENT_ID_REQUIRED');
  if (!missionId) throw new Error('CANONICAL_MISSION_ID_REQUIRED');
  return {
    ...input,
    id: documentId,
    documentId,
    missionId,
    canonicalMissionPath: canonicalMissionPath(missionId),
    updatedAt: now,
    createdAt: input.createdAt || now,
  };
}

function assertCanonicalWritePath(path) {
  if (!String(path || '').startsWith('mission_realms/')) {
    throw new Error(`NON_CANONICAL_MISSION_WRITE_BLOCKED:${path}`);
  }
  return true;
}

module.exports = {
  canonicalMissionPath,
  buildCanonicalMissionRealm,
  buildCanonicalOfficialDocument,
  assertCanonicalWritePath,
};
