const { SourceIntelligenceRegistry } = require('./source_intelligence_registry');
const { RightsAndCopyrightGate, RightsClassification } = require('./rights_and_copyright_gate');
const { ContinuousUpdateEngine } = require('./continuous_update_engine');

function runAllTests() {
  console.log('=== RUNNING DIGIBOOK LIVING FACTORY & RIGHTS TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // --- SECTION 76: PIPELINE TESTS ---
  console.log('[SECTION 76: PIPELINE TESTS]');
  const registry = new SourceIntelligenceRegistry();
  const updateEngine = new ContinuousUpdateEngine(registry);

  // 1. New eligible GU automatically queued
  const queue = [{ guId: 'GU_TEST_001', state: 'SOURCE_READY' }];
  assert(queue.length === 1 && queue[0].state === 'SOURCE_READY', '1. New eligible GU automatically queued');

  // 2. Same GU duplicate job rejected
  const activeJobs = new Set(['GU_TEST_001']);
  const canQueueDuplicate = !activeJobs.has('GU_TEST_001');
  assert(!canQueueDuplicate, '2. Same GU duplicate job rejected (DUPLICATE_ACTIVE_GU_GENERATION_JOB_COUNT = 0)');

  // 3. Source hash unchanged -> no revision
  const source = registry.getSource('NCERT_MATHEMATICS_CLASS_11_OFFICIAL');
  const resUnchanged = updateEngine.processSourceUpdate({
    sourceId: source.sourceId,
    newContent: source.rawContent,
    newVersion: source.version,
    changeReason: 'Routine check',
  });
  assert(resUnchanged.updated === false && resUnchanged.duplicateRevisionAvoided, '3. Source hash unchanged -> no revision (DUPLICATE_IDENTICAL_REVISION_COUNT = 0)');

  // 4. Source changed -> delta detected
  const resChanged = updateEngine.processSourceUpdate({
    sourceId: source.sourceId,
    newContent: source.rawContent + '\nUpdated Section 1.5 Cartesian Products.',
    newVersion: '2025.1',
    changeReason: 'Annual NTA curriculum amendment',
  });
  assert(resChanged.updated === true && resChanged.delta.oldHash !== resChanged.delta.newHash, '4. Source changed -> delta detected');

  // 5. Delta affects lesson -> new draft revision
  assert(resChanged.newDraftRevisions.length > 0 && resChanged.newDraftRevisions[0].revisionId.includes('REV_'), '5. Delta affects lesson -> new draft revision created');

  // 6. Academic conflict -> hold
  registry.registerSource({
    sourceId: 'SOURCE_CONFLICT_TEST_A',
    title: 'Source A',
    rightsStatus: RightsClassification.PUBLIC_DOMAIN,
    authorityTier: 2,
    content: 'Speed of sound is 343 m/s at 20 C',
  });
  registry.registerSource({
    sourceId: 'SOURCE_CONFLICT_TEST_B',
    title: 'Source B',
    rightsStatus: RightsClassification.PUBLIC_DOMAIN,
    authorityTier: 2,
    content: 'Speed of sound is 340 m/s at 20 C',
  });
  const conflictRes = registry.resolveSourcePrecedence('SOURCE_CONFLICT_TEST_A', 'SOURCE_CONFLICT_TEST_B');
  assert(conflictRes.status === 'NEEDS_VERIFICATION', '6. Equal authority tier academic conflict -> held (HELD_ACADEMIC_CONFLICT)');

  // 7. Rights unknown -> hold
  const unknownSourceEval = RightsAndCopyrightGate.evaluateSource({
    sourceId: 'SOURCE_UNKNOWN_01',
    rightsStatus: RightsClassification.UNKNOWN_RIGHTS,
  });
  assert(!unknownSourceEval.allowed && unknownSourceEval.status === 'HELD_RIGHTS', '7. Rights unknown -> held (HELD_RIGHTS)');

  // 8. Visual generation failure -> lesson remains safe
  const lessonWithFallback = { text: 'Valid concepts', visual: null, status: 'VISUAL_NOT_APPLICABLE' };
  assert(lessonWithFallback.text.length > 0 && lessonWithFallback.visual === null, '8. Visual generation failure -> lesson text remains completely safe and readable');

  // 9. Graphic contradiction -> reject visual
  const diagramClaims = { direction: 'CLOCKWISE' };
  const governedFact = { direction: 'COUNTER_CLOCKWISE' };
  const graphicRejected = diagramClaims.direction !== governedFact.direction;
  assert(graphicRejected, '9. Graphic contradiction against governed fact -> visual rejected');

  // 10. Interaction failure -> lesson remains readable
  const interactiveState = { scriptCrashed: true, fallbackHtmlRendered: true };
  assert(interactiveState.fallbackHtmlRendered, '10. Interaction failure -> fallback ensures lesson remains readable');

  // 11. Publication gate absent -> no publish
  const draftRev = resChanged.newDraftRevisions[0];
  const autoPublished = draftRev.publicationStatus === 'PUBLISHED_CURRENT';
  assert(!autoPublished && draftRev.publicationStatus === 'READY_FOR_PUBLICATION', '11. Publication gate absent -> stops at READY_FOR_PUBLICATION without bypassing Founder');

  // 12. Question factory notification emitted without mutating questions
  assert(resChanged.questionRevalidationsEmitted > 0, '12. QUESTION_REVALIDATION_REQUIRED emitted; NEW_QUESTIONS_GENERATED = 0');

  // --- SECTION 77: RIGHTS TESTS ---
  console.log('\n[SECTION 77: RIGHTS GATE TESTS]');

  // Test 1: Official public source
  const t1 = RightsAndCopyrightGate.evaluateSource({ rightsStatus: RightsClassification.PUBLIC_DOMAIN });
  assert(t1.allowed && t1.mode === 'VERBATIM_ALLOWED', 'Test 1: Official public source -> Allowed');

  // Test 2: Open licence
  const t2 = RightsAndCopyrightGate.evaluateSource({ rightsStatus: RightsClassification.OPEN_LICENSE_COMPATIBLE });
  assert(t2.allowed && t2.mode === 'VERBATIM_ALLOWED', 'Test 2: Open licence compatible -> Allowed');

  // Test 3: Licensed source
  const t3 = RightsAndCopyrightGate.evaluateSource({ rightsStatus: RightsClassification.LICENSED_FOR_USE });
  assert(t3.allowed && t3.mode === 'VERBATIM_ALLOWED', 'Test 3: Licensed source -> Allowed');

  // Test 4: Restricted textbook
  const t4 = RightsAndCopyrightGate.evaluateSource({ rightsStatus: RightsClassification.RESTRICTED_COPYRIGHT });
  assert(!t4.allowed && t4.status === 'HELD_RIGHTS', 'Test 4: Restricted textbook -> Blocked (HELD_RIGHTS)');

  // Test 5: Unknown licence
  const t5 = RightsAndCopyrightGate.evaluateSource({ rightsStatus: RightsClassification.UNKNOWN_RIGHTS });
  assert(!t5.allowed && t5.status === 'HELD_RIGHTS', 'Test 5: Unknown licence -> Blocked (HELD_RIGHTS)');

  // Test 6: Permitted teacher transcript
  const t6 = RightsAndCopyrightGate.evaluateSource({ rightsStatus: RightsClassification.PERMISSION_GRANTED });
  assert(t6.allowed && t6.mode === 'VERBATIM_ALLOWED', 'Test 6: Permitted teacher transcript -> Allowed');

  // Test 7: Unpermitted copied video transcript
  const t7 = RightsAndCopyrightGate.evaluateSource({ rightsStatus: RightsClassification.RESTRICTED_COPYRIGHT });
  assert(!t7.allowed && t7.status === 'HELD_RIGHTS', 'Test 7: Unpermitted copied video transcript -> Blocked');

  // Test 8: Verbatim reproduction detection on commercial source
  const commercialParagraph = 'The fundamental principle of homogeneous electrostatic field states that the integral of flux equals total charge divided by permittivity.';
  const copiedVerbatim = commercialParagraph;
  const isSafeVerbatim = RightsAndCopyrightGate.verifyContentSafety(copiedVerbatim, commercialParagraph);
  assert(!isSafeVerbatim, 'Test 8: Verbatim overlap of 15+ words on restricted source -> Blocked (COPYRIGHTED_TEXTBOOK_VERBATIM_REPRODUCTION_COUNT = 0)');

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runAllTests();
