import { KnowledgeIdentityService, SemanticFingerprint } from '../services/knowledgeIdentityService';

describe('🔱 GOVERNED UNIVERSAL KNOWLEDGE IDENTITY TESTS (P1-F)', () => {

  // RESIDUAL C: DIFFERENT WORDING CASE
  test('RESIDUAL C: Different wording inputs produce distinct candidate hashes and exact Stage-B decision', () => {
    const inputA: SemanticFingerprint = {
      subject: "Physics",
      normalizedTitle: "Uniformly Accelerated Motion",
      conceptScope: "One-dimensional motion with constant acceleration using velocity-time and displacement-time relations.",
      constituentConcepts: ["Acceleration", "Velocity", "Displacement", "Time"]
    };

    const inputB: SemanticFingerprint = {
      subject: "Physics",
      normalizedTitle: "Motion with Constant Acceleration",
      conceptScope: "Rectilinear kinematics where acceleration remains unchanged, covering relations among displacement, velocity and time.",
      constituentConcepts: ["Velocity", "Time", "Acceleration", "Displacement"]
    };

    // Stage-A title candidate hashes MUST differ
    const candA = KnowledgeIdentityService.generateCandidateCanonicalTopicId(inputA.subject, inputA.normalizedTitle);
    const candB = KnowledgeIdentityService.generateCandidateCanonicalTopicId(inputB.subject, inputB.normalizedTitle);

    expect(candA).not.toBe(candB);

    // Stage-B Governed Semantic Fingerprint Evaluation
    const result = KnowledgeIdentityService.evaluateEquivalence(inputA, inputB);

    // Single exact decision: CANONICAL_NEW_ENTITY
    expect(result.decision).toBe('CANONICAL_NEW_ENTITY');
  });

  // RESIDUAL C: SAME TITLE DIFFERENT SCOPE CASE
  test('RESIDUAL C: Same title with different scope requires review and forbids auto-merge', () => {
    const jeeThermodynamics: SemanticFingerprint = {
      subject: "Physics",
      normalizedTitle: "Thermodynamics",
      conceptScope: "Heat engines, Carnot cycle, and kinetic theory connection (JEE Advanced Level)",
      parentContext: "Physics Unit 8"
    };

    const neetThermodynamics: SemanticFingerprint = {
      subject: "Physics",
      normalizedTitle: "Thermodynamics",
      conceptScope: "Zeroth, First, and Second Law basic applications (NEET UG Level)",
      parentContext: "Physics Unit 8"
    };

    const result = KnowledgeIdentityService.evaluateEquivalence(jeeThermodynamics, neetThermodynamics);
    expect(result.decision).toBe('CANONICAL_MATCH_REVIEW_REQUIRED');
    expect(result.reason).toContain('divergent academic scope');
  });

  // RESIDUAL C: DISTINCT CONCEPTS CASE
  test('RESIDUAL C: Distinct concepts produce distinct candidate and canonical IDs', () => {
    const id1 = KnowledgeIdentityService.generateCandidateCanonicalTopicId("Physics", "Optics");
    const id2 = KnowledgeIdentityService.generateCandidateCanonicalTopicId("Physics", "Thermodynamics");

    expect(id1).not.toBe(id2);
  });
});
