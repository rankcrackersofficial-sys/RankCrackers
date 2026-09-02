export {};

function evaluatePublishGate(data: {
  realmExists: boolean;
  recruitmentExists: boolean;
  catalogExists: boolean;
  cardVisible: boolean;
  userPanelVisible: boolean;
  archived: boolean;
  documentsCount: number;
  verifiedDocumentsCount: number;
  slots: Array<{
    canonicalVersionId?: string;
    canonicalVerificationState?: string;
    activationEpoch?: number;
    academicDeltaApplied?: boolean;
    downstreamVerificationComplete?: boolean;
    staleSourceJobs?: number;
    ambiguousDelta?: boolean;
  }>;
}): { pipelineComplete: boolean; publicationAllowed: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (!data.realmExists) blockers.push('MISSION_AUTHORITY_MISSING');
  if (!data.recruitmentExists) blockers.push('RECRUITMENT_PROJECTION_MISSING');
  if (!data.catalogExists) blockers.push('STUDENT_CATALOG_MISSING');

  const visible = data.catalogExists && data.cardVisible && data.userPanelVisible && !data.archived;
  if (!visible) blockers.push('STUDENT_PROJECTION_NOT_VISIBLE');

  if (data.documentsCount === 0) blockers.push('DOCUMENT_BINDING_MISSING');
  if (data.verifiedDocumentsCount === 0) blockers.push('SOURCE_VERIFIED_MISSING');

  const slots = data.slots;
  const canonicalVerified = slots.length > 0 && slots.every(s => s.canonicalVersionId && s.canonicalVerificationState === 'VERIFIED');
  if (!canonicalVerified) blockers.push('CANONICAL_SOURCE_UNVERIFIED');

  const sourceCurrent = slots.length > 0 && slots.every(s => (s.activationEpoch || 0) > 0);
  if (!sourceCurrent) blockers.push('SOURCE_VERSION_STALE');

  const deltaApplied = slots.length > 0 && slots.every(s => s.academicDeltaApplied === true);
  if (!deltaApplied) blockers.push('ACADEMIC_DELTA_UNAPPLIED');

  const downstreamComplete = slots.length > 0 && slots.every(s => s.downstreamVerificationComplete === true);
  if (!downstreamComplete) blockers.push('DOWNSTREAM_VERIFICATION_INCOMPLETE');

  const noStaleJobs = slots.every(s => (s.staleSourceJobs || 0) === 0);
  if (!noStaleJobs) blockers.push('STALE_JOBS_PRESENT');

  const noAmbiguousDelta = slots.every(s => s.ambiguousDelta !== true);
  if (!noAmbiguousDelta) blockers.push('UNRESOLVED_AMBIGUITY_PRESENT');

  const pipelineComplete = blockers.length === 0;
  const publicationAllowed = pipelineComplete && visible;

  return { pipelineComplete, publicationAllowed, blockers };
}

describe('Publish Gate Evaluation & Safety Suite', () => {
  const validSlot = {
    canonicalVersionId: 'srcv_v1',
    canonicalVerificationState: 'VERIFIED',
    activationEpoch: 1,
    academicDeltaApplied: true,
    downstreamVerificationComplete: true,
    staleSourceJobs: 0,
    ambiguousDelta: false
  };

  const validData = {
    realmExists: true,
    recruitmentExists: true,
    catalogExists: true,
    cardVisible: true,
    userPanelVisible: true,
    archived: false,
    documentsCount: 2,
    verifiedDocumentsCount: 2,
    slots: [validSlot]
  };

  test('All 9 mandatory conditions met -> Publish Gate passes', () => {
    const res = evaluatePublishGate(validData);
    expect(res.pipelineComplete).toBe(true);
    expect(res.publicationAllowed).toBe(true);
    expect(res.blockers.length).toBe(0);
  });

  test('Downstream verification incomplete -> Publish Gate fails closed', () => {
    const res = evaluatePublishGate({
      ...validData,
      slots: [{ ...validSlot, downstreamVerificationComplete: false }]
    });
    expect(res.pipelineComplete).toBe(false);
    expect(res.publicationAllowed).toBe(false);
    expect(res.blockers).toContain('DOWNSTREAM_VERIFICATION_INCOMPLETE');
  });

  test('Unresolved ambiguity -> Publish Gate fails closed', () => {
    const res = evaluatePublishGate({
      ...validData,
      slots: [{ ...validSlot, ambiguousDelta: true }]
    });
    expect(res.pipelineComplete).toBe(false);
    expect(res.publicationAllowed).toBe(false);
    expect(res.blockers).toContain('UNRESOLVED_AMBIGUITY_PRESENT');
  });

  test('Stale jobs present -> Publish Gate fails closed', () => {
    const res = evaluatePublishGate({
      ...validData,
      slots: [{ ...validSlot, staleSourceJobs: 1 }]
    });
    expect(res.pipelineComplete).toBe(false);
    expect(res.publicationAllowed).toBe(false);
    expect(res.blockers).toContain('STALE_JOBS_PRESENT');
  });

  test('Unapplied academic delta -> Publish Gate fails closed', () => {
    const res = evaluatePublishGate({
      ...validData,
      slots: [{ ...validSlot, academicDeltaApplied: false }]
    });
    expect(res.pipelineComplete).toBe(false);
    expect(res.publicationAllowed).toBe(false);
    expect(res.blockers).toContain('ACADEMIC_DELTA_UNAPPLIED');
  });
});
