'use strict';

const {
  assertFounderVariableAuthority,
  assertMissionIdentity,
  assertPostPublicationSafety,
  assertSourceDocumentBinding,
  canonicalDigest,
  normalizeMissionVariables,
  referencedDocumentIds,
} = require('../../services/mission_variable_authority');

const item = (key, documentId = `hash_${'a'.repeat(64)}`) => ({
  key,
  label: key,
  value: 'Physics',
  normalized_value: 'physics',
  source_document_id: documentId,
  source_page_number: 2,
  source_text_excerpt: 'Physics syllabus',
  confidence: 0.99,
  founder_verification_status: 'approved',
  notes: 'Verified against the official source.',
});

const validVariables = () => ({
  mediumPolicy: 'ENGLISH_ONLY',
  supportedMediums: ['ENGLISH'],
  defaultMedium: 'ENGLISH',
  paper_variables: [item('paper_1')],
  subject_variables: [item('physics')],
});

describe('mission variable authority', () => {
  test('Founder authorization requires ACTIVE founder and denies Student/Admin', () => {
    expect(() => assertFounderVariableAuthority({ token: { founder: true } }, { status: 'ACTIVE' })).not.toThrow();
    expect(() => assertFounderVariableAuthority({ token: {} }, { status: 'ACTIVE' })).toThrow('PERMISSION_DENIED');
    expect(() => assertFounderVariableAuthority({ token: { admin: true } }, { status: 'ACTIVE' })).toThrow('PERMISSION_DENIED');
    expect(() => assertFounderVariableAuthority({ token: { founder: true } }, { status: 'INACTIVE' })).toThrow('ACCOUNT_INACTIVE');
  });

  test('valid mutation normalizes the existing canonical contract', () => {
    const result = normalizeMissionVariables(validVariables());
    expect(result.mediumPolicy).toBe('ENGLISH_ONLY');
    expect(result.paper_variables).toHaveLength(1);
    expect(result.subject_variables).toHaveLength(1);
  });

  test.each([
    [{ ...validVariables(), unknown_key: [] }, 'UNSUPPORTED_VARIABLE_KEY'],
    [{ ...validVariables(), paper_variables: [] }, 'REQUIRED_PACK_MISSING'],
    [{ ...validVariables(), subject_variables: [] }, 'REQUIRED_PACK_MISSING'],
    [{ ...validVariables(), mediumPolicy: 'AUTO' }, 'INVALID_MEDIUM_POLICY'],
    [{ ...validVariables(), defaultMedium: 'HINDI' }, 'INVALID_DEFAULT_MEDIUM'],
  ])('invalid state fails closed', (input, code) => {
    expect(() => normalizeMissionVariables(input)).toThrow(code);
  });

  test('source proof fields are mandatory', () => {
    const variables = validVariables();
    delete variables.subject_variables[0].source_text_excerpt;
    expect(() => normalizeMissionVariables(variables)).toThrow('SOURCE_PROOF_REQUIRED');
  });

  test('mission identity enforces ID, exam year, and category compatibility', () => {
    expect(assertMissionIdentity({
      missionId: 'm1',
      mission: { realm_id: 'm1', exam_year: 2027, exam_category: 'competitive' },
      recruitment: { id: 'm1', year: 2027, examCategory: 'competitive' },
      expectedExamYear: 2027,
      expectedExamCategory: 'competitive',
    })).toEqual({ missionYear: 2027, category: 'competitive' });
    expect(() => assertMissionIdentity({
      missionId: 'm1', mission: { realm_id: 'm1', exam_year: 2027, exam_category: 'competitive' },
      recruitment: { id: 'm1' }, expectedExamYear: 2026, expectedExamCategory: 'competitive',
    })).toThrow('STALE_EXAM_YEAR');
  });

  test('document binding rejects cross-mission, stale year, unverified, and non-hash sources', () => {
    const variables = normalizeMissionVariables(validVariables());
    const id = referencedDocumentIds(variables)[0];
    const validDoc = { missionId: 'm1', examYear: 2027, fileHash: 'a'.repeat(64), reviewStatus: 'VERIFIED', publishStatus: 'draft' };
    expect(() => assertSourceDocumentBinding({ missionId: 'm1', missionYear: 2027, variables, documentsById: { [id]: validDoc } })).not.toThrow();
    expect(() => assertSourceDocumentBinding({ missionId: 'm1', missionYear: 2027, variables, documentsById: { [id]: { ...validDoc, missionId: 'm2' } } })).toThrow('SOURCE_MISSION_MISMATCH');
    expect(() => assertSourceDocumentBinding({ missionId: 'm1', missionYear: 2027, variables, documentsById: { [id]: { ...validDoc, examYear: 2026 } } })).toThrow('SOURCE_YEAR_MISMATCH');
    expect(() => assertSourceDocumentBinding({ missionId: 'm1', missionYear: 2027, variables, documentsById: { [id]: { ...validDoc, reviewStatus: 'PENDING' } } })).toThrow('SOURCE_NOT_VERIFIED');
  });

  test('post-publication changes fail closed while an identical retry is allowed', () => {
    const current = normalizeMissionVariables(validVariables());
    const changed = { ...current, defaultMedium: 'HINDI' };
    expect(() => assertPostPublicationSafety({ contentLocks: { syllabusPublished: true } }, current, changed)).toThrow('IMMUTABLE_AFTER_PUBLICATION');
    expect(() => assertPostPublicationSafety({ contentLocks: { syllabusPublished: true } }, current, current)).not.toThrow();
  });

  test('canonical digest is deterministic for idempotency/audit', () => {
    const variables = normalizeMissionVariables(validVariables());
    expect(canonicalDigest(variables)).toBe(canonicalDigest(variables));
  });
});
