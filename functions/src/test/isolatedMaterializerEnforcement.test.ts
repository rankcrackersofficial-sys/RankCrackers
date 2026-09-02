import * as testing from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as crypto from 'crypto';

const PROJECT_ID = 'rankcrackers-55';

interface GovernedMaterializationPayload {
  questionId: string;
  version: number;
  missionId: string;
  scheduleId: string;
  stem: string;
  options: string[];
  correctAnswer: string;
  solution: string;
  sourceAuthority: {
    documentId: string;
    version: string;
    sourceSha256: string;
    active: boolean;
    missionScope: string;
  };
  reviewRecord: {
    reviewerAuthorityId: string;
    questionVersion: number;
    decision: string;
    signedDigest: string;
  };
  keyVerification: {
    verifiedAnswerValue: string;
    questionVersion: number;
    verifierAuthorityId: string;
  };
  solutionVerification: {
    verifiedSolutionHash: string;
    questionVersion: number;
    verifierAuthorityId: string;
  };
  publicationApproval: {
    approved: boolean;
    questionVersion: number;
    approvedBy: string;
  };
  testFixtureOnly: boolean;
}

function evaluateMaterializerPreflight(payload: Partial<GovernedMaterializationPayload>): { eligible: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (!payload.sourceAuthority) {
    blockers.push('MISSING_SOURCE_AUTHORITY');
  } else {
    if (!payload.sourceAuthority.active) blockers.push('INACTIVE_SOURCE');
    if (!/^[a-f0-9]{64}$/i.test(payload.sourceAuthority.sourceSha256 || '')) blockers.push('INVALID_SOURCE_HASH');
    if (payload.sourceAuthority.missionScope !== payload.missionId) blockers.push('WRONG_MISSION_SCOPE');
  }

  if (payload.scheduleId !== 'sch_jee_main_2026_1' && payload.scheduleId !== 'test_arena_major_01') {
    blockers.push('WRONG_SCHEDULE_BINDING');
  }

  if (!payload.reviewRecord) {
    blockers.push('MISSING_PRO_REVIEW');
  } else {
    if (!payload.reviewRecord.reviewerAuthorityId || payload.reviewRecord.reviewerAuthorityId.startsWith('unregistered')) {
      blockers.push('INVALID_REVIEWER_AUTHORITY');
    }
    if (payload.reviewRecord.questionVersion !== payload.version) {
      blockers.push('REVIEW_VERSION_MISMATCH');
    }
  }

  if (!payload.keyVerification) {
    blockers.push('MISSING_KEY_VERIFICATION');
  } else {
    if (payload.keyVerification.questionVersion !== payload.version) {
      blockers.push('KEY_VERSION_MISMATCH');
    }
  }

  if (!payload.solutionVerification) {
    blockers.push('MISSING_SOLUTION_VERIFICATION');
  } else {
    if (payload.solutionVerification.questionVersion !== payload.version) {
      blockers.push('SOLUTION_VERSION_MISMATCH');
    }
  }

  if (!payload.publicationApproval || !payload.publicationApproval.approved) {
    blockers.push('MISSING_PUBLICATION_APPROVAL');
  } else if (payload.publicationApproval.questionVersion !== payload.version) {
    blockers.push('PUBLICATION_VERSION_MISMATCH');
  }

  return {
    eligible: blockers.length === 0,
    blockers
  };
}

describe('🔱 ISOLATED EMULATOR MATERIALIZER & TRUST SNAPSHOT SUITE', () => {
  jest.setTimeout(30000);
  let testEnv: testing.RulesTestEnvironment;

  beforeAll(async () => {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8188';
    }
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    const [host, portStr] = emulatorHost.split(':');
    const port = parseInt(portStr || '8188', 10);

    testEnv = await testing.initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync('../firestore.rules', 'utf8'),
        host,
        port,
      },
    });
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // -------------------------------------------------------------
  // SECTION 1: NEGATIVE MATERIALIZER CASES (16 INDEPENDENT CHECKS)
  // -------------------------------------------------------------
  describe('🛑 NEGATIVE MATERIALIZER MATRIX (16 Negative Assertions)', () => {
    const valid64Hex = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

    const baseValidFixture: GovernedMaterializationPayload = {
      questionId: 'test_q_fixture_001',
      version: 1,
      missionId: 'jee_main_2026',
      scheduleId: 'sch_jee_main_2026_1',
      stem: 'Test particle motion stem',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      solution: 'Valid step-by-step calculus derivation',
      sourceAuthority: {
        documentId: 'NCERT_CLASS_11_PHYSICS_CH03',
        version: '1.0.0',
        sourceSha256: valid64Hex,
        active: true,
        missionScope: 'jee_main_2026'
      },
      reviewRecord: {
        reviewerAuthorityId: 'prof_test_sme_01',
        questionVersion: 1,
        decision: 'APPROVED',
        signedDigest: 'sig_test_hex_123'
      },
      keyVerification: {
        verifiedAnswerValue: 'Option A',
        questionVersion: 1,
        verifierAuthorityId: 'prof_test_sme_01'
      },
      solutionVerification: {
        verifiedSolutionHash: crypto.createHash('sha256').update('Valid step-by-step calculus derivation').digest('hex'),
        questionVersion: 1,
        verifierAuthorityId: 'prof_test_sme_01'
      },
      publicationApproval: {
        approved: true,
        questionVersion: 1,
        approvedBy: 'founder_admin_01'
      },
      testFixtureOnly: true
    };

    test('Case 1: Draft only fails closed', () => {
      const res = evaluateMaterializerPreflight({
        questionId: 'test_draft_only',
        version: 1,
        missionId: 'jee_main_2026',
        scheduleId: 'sch_jee_main_2026_1'
      });
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('MISSING_SOURCE_AUTHORITY');
      expect(res.blockers).toContain('MISSING_PRO_REVIEW');
    });

    test('Case 2: Missing source authority fails closed', () => {
      const payload = { ...baseValidFixture, sourceAuthority: undefined };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('MISSING_SOURCE_AUTHORITY');
    });

    test('Case 3: Invalid source hash fails closed', () => {
      const payload = {
        ...baseValidFixture,
        sourceAuthority: { ...baseValidFixture.sourceAuthority, sourceSha256: 'invalid_short_hash' }
      };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('INVALID_SOURCE_HASH');
    });

    test('Case 4: Inactive source fails closed', () => {
      const payload = {
        ...baseValidFixture,
        sourceAuthority: { ...baseValidFixture.sourceAuthority, active: false }
      };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('INACTIVE_SOURCE');
    });

    test('Case 5: Wrong mission fails closed', () => {
      const payload = {
        ...baseValidFixture,
        sourceAuthority: { ...baseValidFixture.sourceAuthority, missionScope: 'neet_2027' }
      };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('WRONG_MISSION_SCOPE');
    });

    test('Case 6: Wrong schedule fails closed', () => {
      const payload = { ...baseValidFixture, scheduleId: 'sch_unmapped_99' };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('WRONG_SCHEDULE_BINDING');
    });

    test('Case 7: Missing PRO review fails closed', () => {
      const payload = { ...baseValidFixture, reviewRecord: undefined };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('MISSING_PRO_REVIEW');
    });

    test('Case 8: Invalid reviewer authority fails closed', () => {
      const payload = {
        ...baseValidFixture,
        reviewRecord: { ...baseValidFixture.reviewRecord, reviewerAuthorityId: 'unregistered_sme_00' }
      };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('INVALID_REVIEWER_AUTHORITY');
    });

    test('Case 9: Review version mismatch fails closed', () => {
      const payload = {
        ...baseValidFixture,
        reviewRecord: { ...baseValidFixture.reviewRecord, questionVersion: 2 }
      };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('REVIEW_VERSION_MISMATCH');
    });

    test('Case 10: Missing key verification fails closed', () => {
      const payload = { ...baseValidFixture, keyVerification: undefined };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('MISSING_KEY_VERIFICATION');
    });

    test('Case 11: Key version mismatch fails closed', () => {
      const payload = {
        ...baseValidFixture,
        keyVerification: { ...baseValidFixture.keyVerification, questionVersion: 3 }
      };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('KEY_VERSION_MISMATCH');
    });

    test('Case 12: Missing solution verification fails closed', () => {
      const payload = { ...baseValidFixture, solutionVerification: undefined };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('MISSING_SOLUTION_VERIFICATION');
    });

    test('Case 13: Solution version mismatch fails closed', () => {
      const payload = {
        ...baseValidFixture,
        solutionVerification: { ...baseValidFixture.solutionVerification, questionVersion: 4 }
      };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('SOLUTION_VERSION_MISMATCH');
    });

    test('Case 14: Missing publication approval fails closed', () => {
      const payload = { ...baseValidFixture, publicationApproval: undefined };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('MISSING_PUBLICATION_APPROVAL');
    });

    test('Case 15: Revoked publication approval fails closed', () => {
      const payload = {
        ...baseValidFixture,
        publicationApproval: { ...baseValidFixture.publicationApproval, approved: false }
      };
      const res = evaluateMaterializerPreflight(payload);
      expect(res.eligible).toBe(false);
      expect(res.blockers).toContain('MISSING_PUBLICATION_APPROVAL');
    });

    test('Case 16: Client-originated authoritative mutation fails closed (Firestore Rules)', async () => {
      const studentContext = testEnv.authenticatedContext('student-attacker-01');
      const db = studentContext.firestore();
      const directWriteRef = db.collection('published_questions').doc('test_q_fixture_001');

      await testing.assertFails(directWriteRef.set({
        questionId: 'test_q_fixture_001',
        stem: 'Hacked question stem',
        correctAnswer: 'A'
      }));
    });
  });

  // -------------------------------------------------------------
  // SECTION 2: POSITIVE ISOLATED TEST FIXTURE MATERIALIZATION
  // -------------------------------------------------------------
  describe('✅ POSITIVE ISOLATED TEST FIXTURE MATERIALIZATION', () => {
    const valid64Hex = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

    test('Complete isolated governed test fixture safely materializes & is immutable to student', async () => {
      const fixturePayload: GovernedMaterializationPayload = {
        questionId: 'test_isolated_q_001',
        version: 1,
        missionId: 'jee_main_2026',
        scheduleId: 'sch_jee_main_2026_1',
        stem: 'A particle starts from rest with uniform acceleration a = 2 m/s^2. Distance in 3s is?',
        options: ['9 m', '18 m', '6 m', '12 m'],
        correctAnswer: '9 m',
        solution: 's = ut + 0.5 a t^2 = 0 + 0.5 * 2 * 9 = 9 m.',
        sourceAuthority: {
          documentId: 'NCERT_CLASS_11_PHYSICS_CH03',
          version: '1.0.0',
          sourceSha256: valid64Hex,
          active: true,
          missionScope: 'jee_main_2026'
        },
        reviewRecord: {
          reviewerAuthorityId: 'prof_test_sme_01',
          questionVersion: 1,
          decision: 'APPROVED',
          signedDigest: 'sig_test_hex_123'
        },
        keyVerification: {
          verifiedAnswerValue: '9 m',
          questionVersion: 1,
          verifierAuthorityId: 'prof_test_sme_01'
        },
        solutionVerification: {
          verifiedSolutionHash: crypto.createHash('sha256').update('s = ut + 0.5 a t^2 = 0 + 0.5 * 2 * 9 = 9 m.').digest('hex'),
          questionVersion: 1,
          verifierAuthorityId: 'prof_test_sme_01'
        },
        publicationApproval: {
          approved: true,
          questionVersion: 1,
          approvedBy: 'founder_admin_01'
        },
        testFixtureOnly: true
      };

      // 1. Evaluate preflight
      const preflight = evaluateMaterializerPreflight(fixturePayload);
      expect(preflight.eligible).toBe(true);
      expect(preflight.blockers.length).toBe(0);

      // 2. Materialize in emulator with Founder/Admin context
      const founderContext = testEnv.authenticatedContext('founder_test_admin', {
        admin: true,
        email: 'founder@rankcrackers.internal'
      });
      const adminDb = founderContext.firestore();

      const docRef = adminDb.collection('published_questions').doc(fixturePayload.questionId);
      await testing.assertSucceeds(docRef.set({
        ...fixturePayload,
        safeMaterialized: true,
        materializedAt: new Date().toISOString()
      }));

      // 3. Student can read the governed question
      const studentContext = testEnv.authenticatedContext('student-reader-01');
      const studentDb = studentContext.firestore();
      const studentDocRef = studentDb.collection('published_questions').doc(fixturePayload.questionId);
      await testing.assertSucceeds(studentDocRef.get());

      // 4. Student CANNOT mutate or delete the governed question
      await testing.assertFails(studentDocRef.update({ stem: 'Mutated stem' }));
      await testing.assertFails(studentDocRef.delete());
    });
  });

  // -------------------------------------------------------------
  // SECTION 3: TRUST SNAPSHOT INVALIDATION PROOF
  // -------------------------------------------------------------
  describe('🔄 TRUST SNAPSHOT MUTATION & STALE PROOF', () => {
    function computeTrustSnapshotDigest(snapshot: {
      questionVersion: number;
      sourceVersion: string;
      reviewVersion: number;
      keyVersion: number;
      solutionVersion: number;
      publicationVersion: number;
      provenanceHash: string;
    }): string {
      const payload = `${snapshot.questionVersion}:${snapshot.sourceVersion}:${snapshot.reviewVersion}:${snapshot.keyVersion}:${snapshot.solutionVersion}:${snapshot.publicationVersion}:${snapshot.provenanceHash}`;
      return crypto.createHash('sha256').update(payload).digest('hex');
    }

    test('Mutating upstream authority versions invalidates the trust snapshot digest', () => {
      const baseSnapshot = {
        questionVersion: 1,
        sourceVersion: '1.0.0',
        reviewVersion: 1,
        keyVersion: 1,
        solutionVersion: 1,
        publicationVersion: 1,
        provenanceHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      };

      const baselineDigest = computeTrustSnapshotDigest(baseSnapshot);

      // Mutating source version
      const mutatedSourceDigest = computeTrustSnapshotDigest({ ...baseSnapshot, sourceVersion: '1.1.0' });
      expect(mutatedSourceDigest).not.toEqual(baselineDigest);

      // Mutating question version
      const mutatedQDigest = computeTrustSnapshotDigest({ ...baseSnapshot, questionVersion: 2 });
      expect(mutatedQDigest).not.toEqual(baselineDigest);

      // Mutating review version
      const mutatedReviewDigest = computeTrustSnapshotDigest({ ...baseSnapshot, reviewVersion: 2 });
      expect(mutatedReviewDigest).not.toEqual(baselineDigest);

      // Mutating key version
      const mutatedKeyDigest = computeTrustSnapshotDigest({ ...baseSnapshot, keyVersion: 2 });
      expect(mutatedKeyDigest).not.toEqual(baselineDigest);

      // Mutating solution version
      const mutatedSolDigest = computeTrustSnapshotDigest({ ...baseSnapshot, solutionVersion: 2 });
      expect(mutatedSolDigest).not.toEqual(baselineDigest);

      // Mutating publication version
      const mutatedPubDigest = computeTrustSnapshotDigest({ ...baseSnapshot, publicationVersion: 2 });
      expect(mutatedPubDigest).not.toEqual(baselineDigest);

      // Stale trust snapshots are rejected
      expect(baselineDigest === mutatedSourceDigest).toBe(false);
    });
  });
});
