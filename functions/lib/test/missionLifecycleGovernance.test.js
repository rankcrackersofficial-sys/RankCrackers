'use strict';

const {
  assertActiveFounder,
  evaluateDeletePreflight,
  lifecycleAuditId,
  lifecycleProjection,
  validateLifecycleRequest,
} = require('../../services/mission_lifecycle_governance');

describe('mission lifecycle governance', () => {
  test('requires active Founder and denies Student/Admin', () => {
    expect(() => assertActiveFounder({ token: { founder: true } }, { status: 'ACTIVE' })).not.toThrow();
    expect(() => assertActiveFounder({ token: { admin: true } }, { status: 'ACTIVE' })).toThrow('PERMISSION_DENIED');
    expect(() => assertActiveFounder({ token: {} }, { status: 'ACTIVE' })).toThrow('PERMISSION_DENIED');
    expect(() => assertActiveFounder({ token: { founder: true } }, { status: 'INACTIVE' })).toThrow('ACCOUNT_INACTIVE');
  });

  test('confirmation payload requires meaningful reason and stable request ID', () => {
    expect(validateLifecycleRequest('launch_realm', { reason: 'Founder approved activation', requestId: 'life-0001' }))
      .toEqual({ reason: 'Founder approved activation', requestId: 'life-0001' });
    expect(() => validateLifecycleRequest('pause_realm', { reason: 'short', requestId: 'life-0002' }))
      .toThrow('LIFECYCLE_REASON_REQUIRED');
    expect(() => validateLifecycleRequest('archive_realm', { reason: 'Archive after completion', requestId: 'bad id' }))
      .toThrow('INVALID_REQUEST_ID');
  });

  test.each([
    ['launch_realm', 'ACTIVE', 'published', true],
    ['pause_realm', 'PASSIVE', 'hidden', false],
    ['archive_realm', 'ARCHIVED', 'archived', false],
    ['restore_realm', 'PASSIVE', 'hidden', false],
  ])('%s maps all canonical projections', (action, realm, recruitment, visible) => {
    const result = lifecycleProjection(action);
    expect(result).toMatchObject({ realm, recruitment, visible });
  });

  test('audit identity is deterministic and action-scoped', () => {
    expect(lifecycleAuditId('m1', 'launch_realm', 'life-0001'))
      .toBe(lifecycleAuditId('m1', 'launch_realm', 'life-0001'));
    expect(lifecycleAuditId('m1', 'launch_realm', 'life-0001'))
      .not.toBe(lifecycleAuditId('m1', 'pause_realm', 'life-0001'));
  });

  test('zero-dependency complete inactive mission is delete eligible', () => {
    expect(evaluateDeletePreflight({ realmExists: true, recruitmentExists: true }))
      .toEqual({ eligible: true, blockers: [] });
  });

  test.each([
    [{ realmExists: false, recruitmentExists: true }, 'DELETE_BLOCKED_REALM_AUTHORITY'],
    [{ realmExists: true, recruitmentExists: true, catalogStudentVisible: true }, 'DELETE_BLOCKED_STUDENT_VISIBILITY'],
    [{ realmExists: true, recruitmentExists: true, studentAssignments: true }, 'DELETE_BLOCKED_STUDENT_HISTORY'],
    [{ realmExists: true, recruitmentExists: true, syllabus: true }, 'DELETE_BLOCKED_ACADEMIC_DEPENDENCY'],
    [{ realmExists: true, recruitmentExists: true, documents: true }, 'DELETE_BLOCKED_DOCUMENT_DEPENDENCY'],
    [{ realmExists: true, recruitmentExists: true, publicationHistory: true }, 'DELETE_BLOCKED_AUDIT_RETENTION'],
    [{ realmExists: true, recruitmentExists: true, queueJobs: true }, 'DELETE_NOT_PROVEN'],
  ])('delete preflight fails closed for dependency %j', (state, blocker) => {
    const result = evaluateDeletePreflight(state);
    expect(result.eligible).toBe(false);
    expect(result.blockers).toContain(blocker);
  });
});
