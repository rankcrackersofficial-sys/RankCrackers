'use strict';

const crypto = require('crypto');

const ACTIONS = Object.freeze({
  launch_realm: { realm: 'ACTIVE', recruitment: 'published', catalog: 'ACTIVE', visible: true },
  pause_realm: { realm: 'PASSIVE', recruitment: 'hidden', catalog: 'PASSIVE', visible: false },
  archive_realm: { realm: 'ARCHIVED', recruitment: 'archived', catalog: 'ARCHIVED', visible: false },
  restore_realm: { realm: 'PASSIVE', recruitment: 'hidden', catalog: 'PASSIVE', visible: false },
});

function validateLifecycleRequest(action, payload = {}) {
  if (!Object.prototype.hasOwnProperty.call(ACTIONS, action) && action !== 'delete_realm_permanently') {
    throw new Error('UNSUPPORTED_LIFECYCLE_ACTION');
  }
  const reason = String(payload.reason || '').trim();
  const requestId = String(payload.requestId || '').trim();
  if (reason.length < 12) throw new Error('LIFECYCLE_REASON_REQUIRED');
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(requestId)) throw new Error('INVALID_REQUEST_ID');
  return { reason, requestId };
}

function assertActiveFounder(auth, user = {}) {
  if (!auth || auth.token?.founder !== true) throw new Error('PERMISSION_DENIED');
  if (String(user.status || '').toUpperCase() !== 'ACTIVE') throw new Error('ACCOUNT_INACTIVE');
}

function lifecycleAuditId(missionId, action, requestId) {
  const digest = crypto.createHash('sha256').update(`${missionId}:${action}:${requestId}`).digest('hex');
  return `mission_lifecycle_${digest}`;
}

function lifecycleProjection(action) {
  const projection = ACTIONS[action];
  if (!projection) throw new Error('UNSUPPORTED_LIFECYCLE_ACTION');
  return projection;
}

function evaluateDeletePreflight(state = {}) {
  const blockers = [];
  if (!state.realmExists) blockers.push('DELETE_BLOCKED_REALM_AUTHORITY');
  if (!state.recruitmentExists) blockers.push('DELETE_BLOCKED_ACTIVE_RECRUITMENT');
  if (state.catalogStudentVisible) blockers.push('DELETE_BLOCKED_STUDENT_VISIBILITY');
  if (state.activeRecruitment) blockers.push('DELETE_BLOCKED_ACTIVE_RECRUITMENT');
  if (state.studentAssignments) blockers.push('DELETE_BLOCKED_STUDENT_HISTORY');
  if (state.studentProgress || state.assessmentEvidence) blockers.push('DELETE_BLOCKED_STUDENT_HISTORY');
  if (state.syllabus || state.digibook || state.crucible) blockers.push('DELETE_BLOCKED_ACADEMIC_DEPENDENCY');
  if (state.documents) blockers.push('DELETE_BLOCKED_DOCUMENT_DEPENDENCY');
  if (state.auditRetention || state.publicationHistory) blockers.push('DELETE_BLOCKED_AUDIT_RETENTION');
  if (state.queueJobs || state.unresolvedProjection) blockers.push('DELETE_NOT_PROVEN');
  return { eligible: blockers.length === 0, blockers: [...new Set(blockers)] };
}

module.exports = {
  ACTIONS,
  assertActiveFounder,
  evaluateDeletePreflight,
  lifecycleAuditId,
  lifecycleProjection,
  validateLifecycleRequest,
};
