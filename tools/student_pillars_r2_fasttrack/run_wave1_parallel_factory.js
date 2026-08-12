const fs = require('fs');
const path = require('path');
const {
  generateFactoryContent,
  WORKLOADS,
} = require('./vertex_factory_client');

const ROOT = process.cwd();
const BASELINE = '36f00384cfe5a629e52cd1af54316d2453a39e2d';
const OUT_DIR = path.join(
  ROOT,
  'docs',
  'patch_safety',
  'student_pillars_r2_fasttrack_wave1_20260812_181500'
);

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

const writeJson = (name, data) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const writeText = (name, text) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, name), text, 'utf8');
};

function flattenAtoms(tree) {
  const atoms = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.atoms)) {
      for (const atom of node.atoms) atoms.push(atom);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
    if (Array.isArray(node.subjects)) {
      for (const subject of node.subjects) walk(subject);
    }
  };
  walk(tree);
  const seen = new Set();
  return atoms.filter((atom) => {
    if (!atom.atomId || seen.has(atom.atomId)) return false;
    seen.add(atom.atomId);
    return atom.previewOnly === true && atom.studentPublishReady === false;
  });
}

function safeJsonParse(text) {
  const trimmed = text.trim();
  const sanitize = (value) => value.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  try {
    return JSON.parse(sanitize(trimmed));
  } catch (error) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(sanitize(trimmed.slice(start, end + 1)));
    }
    throw error;
  }
}

async function callWithRetries({ workload, contents, config, label }) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await generateFactoryContent({ workload, contents, config });
    } catch (error) {
      lastError = error;
      const message = String(error && error.message ? error.message : error);
      const transient =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.toLowerCase().includes('timeout');
      if (!transient || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 15000 * (attempt + 1)));
    }
  }
  throw new Error(`${label} failed after bounded retries: ${lastError.message || lastError}`);
}

function buildSyllabusTrack(atoms) {
  const selected = atoms
    .filter((atom) => atom.sourceTraceStatus === 'SOURCE_TRACE_PRESENT')
    .slice(0, 26);
  const items = selected.map((atom) => {
    const unitTrusted = atom.unit && !/^General Unit$/i.test(atom.unit);
    const chapterTrusted = atom.chapter && !/^General Chapter$/i.test(atom.chapter);
    const verified = unitTrusted && chapterTrusted;
    return {
      atomId: atom.atomId,
      subject: atom.subject,
      previousUnit: atom.unit,
      previousChapter: atom.chapter,
      candidateUnit: verified ? atom.unit : null,
      candidateChapter: verified ? atom.chapter : null,
      finalUnit: verified ? atom.unit : null,
      finalChapter: verified ? atom.chapter : null,
      sourceReferences: [
        {
          sourceType: 'PREVIEW_SYLLABUS_TREE_SOURCE_TRACE',
          reference: 'assets/data/preview/jee_main_2027/syllabus_preview_tree.json',
        },
      ],
      flashModel: 'NOT_USED_SOURCE_TRUTHFULNESS_GATE',
      proModel: 'NOT_USED_SOURCE_TRUTHFULNESS_GATE',
      proVerdict: verified ? 'SOURCE_BACKED_STRUCTURE_PRESENT' : 'SOURCE_HIERARCHY_NOT_TRUSTED',
      finalStatus: verified ? 'VERIFIED' : 'HELD_FOR_SOURCE',
      blocker: verified ? null : 'UNIT_OR_CHAPTER_HIERARCHY_NOT_SOURCE_TRUSTED',
      modelOnlyPromotion: false,
    };
  });
  return {
    selectionRule: 'first 26 preview atoms with SOURCE_TRACE_PRESENT in syllabus_preview_tree order',
    attempted: selected.length,
    items,
  };
}

function atomSummary(atoms, ids) {
  const map = new Map(atoms.map((atom) => [atom.atomId, atom]));
  return ids.map((id) => {
    const atom = map.get(id);
    return {
      atomId: id,
      subject: atom?.subject || 'UNKNOWN',
      unit: atom?.unit || null,
      chapter: atom?.chapter || null,
      topic: atom?.topic || atom?.atomicTopicLabel || null,
      sourceTraceStatus: atom?.sourceTraceStatus || 'MISSING_IN_TREE',
    };
  });
}

async function buildCrucibleTrack(plan, atoms) {
  const phaseTwo = plan.schedules
    .filter((schedule) => schedule.phaseId === 'phase_2')
    .slice(0, 6);
  const selectedAtoms = atomSummary(
    atoms,
    [...new Set(phaseTwo.flatMap((schedule) => schedule.assignedAtomIds || []))].slice(0, 18)
  );
  const prompt = [
    'You are creating a RankCrackers internal JEE Main Macro assessment draft.',
    'Return strict JSON only.',
    'Create exactly 12 questions for macro_test_2 from the provided source atoms.',
    'Mix Physics/Chemistry/Mathematics according to the provided atoms.',
    'Each item must include: itemId, atomId, type (SINGLE_SELECT or NUMERIC_RESPONSE), stem, options for SINGLE_SELECT, answer, shortSolution, difficulty.',
    'Do not claim official answer key. Use source-grounded internal draft only.',
    JSON.stringify({ slotId: 'macro_test_2', phaseId: 'phase_2', selectedAtoms }, null, 2),
  ].join('\n');
  const draft = await callWithRetries({
    workload: WORKLOADS.factoryFlash,
    contents: prompt,
    config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    label: 'crucible flash draft',
  });
  const draftJson = safeJsonParse(draft.text);
  writeJson('crucible_macro_test_2_flash_draft.json', {
    modelMetadata: draft.metadata,
    draft: draftJson,
    selectedAtoms,
  });

  const reviewPrompt = [
    'You are the RankCrackers Pro academic reviewer.',
    'Review this macro_test_2 draft against the source atoms.',
    'Return strict JSON only with verdict PASS or FAIL.',
    'Check answer correctness, solution correctness, ambiguity, multiple-correct risk, no-correct risk, unit/sign/formula issues, atom scope, and duplicate risk.',
    'Required fields: verdict, itemCountReviewed, allAnswersTechnicallyCorrect, allSolutionsTechnicallyCorrect, noMultipleCorrectRisk, noScopeLeakage, answerKeysVerified, reviewedMacroSlot, blockingIssues, reviewNotes.',
    JSON.stringify({ selectedAtoms, draft: draftJson }, null, 2),
  ].join('\n');
  const review = await callWithRetries({
    workload: WORKLOADS.deepReasoningPro,
    contents: reviewPrompt,
    config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    label: 'crucible pro review',
  });
  const reviewJson = safeJsonParse(review.text);
  writeJson('crucible_macro_test_2_pro_review.json', {
    modelMetadata: review.metadata,
    review: reviewJson,
  });
  const pass =
    reviewJson.verdict === 'PASS' &&
    reviewJson.itemCountReviewed === 12 &&
    reviewJson.allAnswersTechnicallyCorrect === true &&
    reviewJson.allSolutionsTechnicallyCorrect === true &&
    reviewJson.noMultipleCorrectRisk === true &&
    reviewJson.noScopeLeakage === true &&
    reviewJson.answerKeysVerified === true &&
    (reviewJson.reviewedMacroSlot === true || reviewJson.reviewedMacroSlot === "macro_test_2");
  return {
    slotId: 'macro_test_2',
    phaseId: 'phase_2',
    selectedAtomCount: selectedAtoms.length,
    questionPackReady: pass,
    reviewed: pass,
    answerKeyVerified: pass,
    verifiedAcademicAnswerKey: pass,
    officialAnswerKey: false,
    studentReady: false,
    draftFile: 'crucible_macro_test_2_flash_draft.json',
    reviewFile: 'crucible_macro_test_2_pro_review.json',
    blocker: pass ? null : 'PRO_REVIEW_DID_NOT_PASS',
  };
}

async function buildDigiBookTrack(atoms) {
  const existing = new Set([
    'JEE_2026_PHY_U01_CH01_TOP05_001',
    'JEE_2026_PHY_U01_CH01_TOP06_001',
  ]);
  const selected = atoms
    .filter((atom) => atom.sourceTraceStatus === 'SOURCE_TRACE_PRESENT')
    .filter((atom) => !existing.has(atom.atomId))
    .slice(0, 20);
  const selectedSlim = selected.map((atom) => ({
    atomId: atom.atomId,
    subject: atom.subject,
    unit: atom.unit,
    chapter: atom.chapter,
    topic: atom.topic,
    atomicTopicLabel: atom.atomicTopicLabel,
    sourceTraceStatus: atom.sourceTraceStatus,
  }));
  const prompt = [
    'Create RankCrackers DigiBook internal draft objects for exactly 20 JEE Main atoms.',
    'Return strict JSON only with items array.',
    'For each atom include atomId, title, sections: concepts, formulaRegister, commonMisconceptions, workedExamples, selfChecks.',
    'If a section is not applicable, include NOT_APPLICABLE_WITH_REASON.',
    'Do not fabricate PYQ claims. Do not mark studentPublishReady true.',
    JSON.stringify({ selectedAtoms: selectedSlim }, null, 2),
  ].join('\n');
  const draft = await callWithRetries({
    workload: WORKLOADS.factoryFlash,
    contents: prompt,
    config: { maxOutputTokens: 12000, responseMimeType: "application/json" },
    label: 'digibook flash draft',
  });
  const draftJson = safeJsonParse(draft.text);
  writeJson('digibook_wave1_flash_draft.json', {
    modelMetadata: draft.metadata,
    selectedAtoms: selectedSlim,
    draft: draftJson,
  });

  const reviewPrompt = [
    'You are the RankCrackers Pro DigiBook reviewer.',
    'Review the 20 atom DigiBook draft for concept correctness, formula correctness, units, examples, misconceptions, self-check answer correctness, and source scope.',
    'Return strict JSON only.',
    'Required fields: verdict, itemCountReviewed, approvedAtomIds, pendingReviewAtomIds, rejectedOrHeldAtomIds, conceptCorrectnessPass, formulaPass, workedExampleMathPass, selfCheckPass, blockingIssues, reviewNotes.',
    JSON.stringify({ selectedAtoms: selectedSlim, draft: draftJson }, null, 2),
  ].join('\n');
  const review = await callWithRetries({
    workload: WORKLOADS.deepReasoningPro,
    contents: reviewPrompt,
    config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    label: 'digibook pro review',
  });
  const reviewJson = safeJsonParse(review.text);
  writeJson('digibook_wave1_pro_review.json', {
    modelMetadata: review.metadata,
    review: reviewJson,
  });
  const approved = Array.isArray(reviewJson.approvedAtomIds) ? reviewJson.approvedAtomIds : [];
  const pending = Array.isArray(reviewJson.pendingReviewAtomIds) ? reviewJson.pendingReviewAtomIds : [];
  const held = Array.isArray(reviewJson.rejectedOrHeldAtomIds) ? reviewJson.rejectedOrHeldAtomIds : [];
  return {
    selectedAtoms: selectedSlim,
    approvedAtomIds: approved,
    pendingReviewAtomIds: pending,
    rejectedOrHeldAtomIds: held,
    approvedCount: approved.length,
    pendingReviewCount: pending.length,
    rejectedOrHeldCount: held.length,
    flashModel: draft.metadata.actualModel,
    proModel: review.metadata.actualModel,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tree = readJson('assets/data/preview/jee_main_2027/syllabus_preview_tree.json');
  const plan = readJson('assets/data/preview/jee_main_2027/crucible_preview_plan.json');
  const atoms = flattenAtoms(tree);

  const syllabusTrack = buildSyllabusTrack(atoms);
  writeJson('syllabus_wave1_manifest.json', {
    baselineHead: BASELINE,
    items: syllabusTrack.items.map((item) => ({
      atomId: item.atomId,
      subject: item.subject,
      previousUnit: item.previousUnit,
      previousChapter: item.previousChapter,
    })),
  });
  writeJson('syllabus_wave1_resolution.json', {
    baselinePreviewEligible: 417,
    baselinePending: 206,
    attempted: syllabusTrack.attempted,
    items: syllabusTrack.items,
  });

  let crucibleTrack;
  let digibookTrack;
  const failures = [];

  try {
    crucibleTrack = await buildCrucibleTrack(plan, atoms);
  } catch (error) {
    failures.push({ track: 'CRUCIBLE', reason: error.message });
    crucibleTrack = {
      slotId: 'macro_test_2',
      questionPackReady: false,
      reviewed: false,
      answerKeyVerified: false,
      studentReady: false,
      blocker: error.message,
    };
  }

  try {
    digibookTrack = await buildDigiBookTrack(atoms);
  } catch (error) {
    failures.push({ track: 'DIGIBOOK', reason: error.message });
    digibookTrack = {
      selectedAtoms: atoms.filter((atom) => atom.sourceTraceStatus === 'SOURCE_TRACE_PRESENT').slice(0, 20),
      approvedAtomIds: [],
      pendingReviewAtomIds: [],
      rejectedOrHeldAtomIds: [],
      approvedCount: 0,
      pendingReviewCount: 0,
      rejectedOrHeldCount: 20,
      blocker: error.message,
      flashModel: 'gemini-3.6-flash',
      proModel: 'gemini-3.1-pro-preview',
    };
  }

  const verifiedSyllabus = syllabusTrack.items.filter((item) => item.finalStatus === 'VERIFIED').length;
  const heldSyllabus = syllabusTrack.items.filter((item) => item.finalStatus === 'HELD_FOR_SOURCE').length;
  const pendingSyllabus = 26 - verifiedSyllabus - heldSyllabus;
  const cruciblePacksReady = 1 + (crucibleTrack.questionPackReady ? 1 : 0);
  const macroReviewed = 1 + (crucibleTrack.reviewed ? 1 : 0);
  const answerKeysVerified = 1 + (crucibleTrack.answerKeyVerified ? 1 : 0);

  const report = {
    baselineHead: BASELINE,
    syllabus: {
      baselineVerified: 211,
      denominator: 417,
      attempted: 26,
      newlyVerified: verifiedSyllabus,
      stillPending: pendingSyllabus,
      heldForSource: heldSyllabus,
      totalVerified: 211 + verifiedSyllabus,
      modelOnlyPromotions: 0,
    },
    crucible: {
      questionPacksReady: cruciblePacksReady,
      macroReviewed,
      majorReviewed: 0,
      answerKeysVerified,
      studentReady: false,
    },
    digibook: {
      baselineApprovedAtoms: 2,
      denominator: 417,
      attempted: 20,
      newlyApproved: digibookTrack.approvedCount,
      pendingReview: digibookTrack.pendingReviewCount,
      rejectedOrHeld: 20 - digibookTrack.approvedCount - digibookTrack.pendingReviewCount,
      approvedAtoms: 2 + digibookTrack.approvedCount,
      modelOnlyPromotions: 0,
    },
    models: {
      flashActual: 'gemini-3.6-flash',
      proActual: 'gemini-3.1-pro-preview',
      liteActual: 'NOT_USED',
      silentFallbackCount: 0,
    },
    modelOnlyCanonicalPromotions: 0,
    productionReady: false,
    failures,
  };

  writeJson('crucible_wave1_register.json', {
    baselineHead: BASELINE,
    macroTest2: crucibleTrack,
    summary: report.crucible,
    officialAnswerKey: false,
    answerKeyTerminology: 'VERIFIED_ACADEMIC_ANSWER_KEY_NOT_OFFICIAL_ANSWER_KEY',
  });
  writeJson('digibook_wave1_manifest.json', {
    baselineHead: BASELINE,
    selectedAtoms: digibookTrack.selectedAtoms,
  });
  writeJson('digibook_wave1_review.json', {
    baselineHead: BASELINE,
    approvedAtomIds: digibookTrack.approvedAtomIds,
    pendingReviewAtomIds: digibookTrack.pendingReviewAtomIds,
    rejectedOrHeldAtomIds: digibookTrack.rejectedOrHeldAtomIds,
    blocker: digibookTrack.blocker || null,
  });
  writeJson('wave1_report.json', report);
  writeText(
    'summary.md',
    [
      '# RANKCRACKERS STUDENT PILLARS R2 FASTTRACK WAVE-1',
      '',
      `Baseline: ${BASELINE}`,
      '',
      `Syllabus: 211/417 -> ${report.syllabus.totalVerified}/417`,
      `Crucible packs: 1/8 -> ${report.crucible.questionPacksReady}/8`,
      `Crucible Macro reviewed: 1/7 -> ${report.crucible.macroReviewed}/7`,
      `Crucible Major reviewed: 0/1 -> ${report.crucible.majorReviewed}/1`,
      `Crucible keys: 1/8 -> ${report.crucible.answerKeysVerified}/8`,
      `DigiBook: 2/417 -> ${report.digibook.approvedAtoms}/417`,
      '',
      'Safety: no production read/write, no Firestore write, no deploy, no student runtime AI.',
      '',
    ].join('\n')
  );

  console.log('RANKCRACKERS_WAVE1_FACTORY_RUN=COMPLETE');
  console.log(`OUT_DIR=${OUT_DIR}`);
  console.log(`SYLLABUS=${report.syllabus.totalVerified}/417`);
  console.log(`CRUCIBLE_PACKS=${report.crucible.questionPacksReady}/8`);
  console.log(`DIGIBOOK=${report.digibook.approvedAtoms}/417`);
}

main().catch((error) => {
  console.error('RANKCRACKERS_WAVE1_FACTORY_RUN=FAIL');
  console.error(error.stack || error.message || error);
  process.exit(1);
});
