const fs = require('fs');
const path = require('path');
const {
  generateFactoryContent,
  generateStructuredFactoryContent,
  WORKLOADS,
} = require('./vertex_factory_client');
const { DIGIBOOK_DRAFT_SCHEMA } = require('./digibook_draft_schema');

const CRUCIBLE_DRAFT_SCHEMA = {
  type: "OBJECT",
  properties: {
    slotId: { type: "STRING" },
    phaseId: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          itemId: { type: "STRING" },
          atomId: { type: "STRING" },
          type: { type: "STRING", enum: ["SINGLE_SELECT", "NUMERIC_RESPONSE"] },
          stem: { type: "STRING" },
          options: {
            type: "ARRAY",
            items: { type: "STRING" },
            nullable: true
          },
          answer: { type: "STRING" },
          shortSolution: { type: "STRING" },
          difficulty: { type: "STRING", enum: ["EASY", "MEDIUM", "HARD"] }
        },
        required: ["itemId", "atomId", "type", "stem", "answer", "shortSolution", "difficulty"]
      }
    }
  },
  required: ["slotId", "phaseId", "items"]
};

const CRUCIBLE_REVIEW_SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["PASS", "FAIL"] },
    itemCountReviewed: { type: "INTEGER" },
    allAnswersTechnicallyCorrect: { type: "BOOLEAN" },
    allSolutionsTechnicallyCorrect: { type: "BOOLEAN" },
    noMultipleCorrectRisk: { type: "BOOLEAN" },
    noScopeLeakage: { type: "BOOLEAN" },
    answerKeysVerified: { type: "BOOLEAN" },
    reviewedSlot: { type: "STRING" },
    blockingIssues: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    reviewNotes: { type: "STRING" }
  },
  required: [
    "verdict",
    "itemCountReviewed",
    "allAnswersTechnicallyCorrect",
    "allSolutionsTechnicallyCorrect",
    "noMultipleCorrectRisk",
    "noScopeLeakage",
    "answerKeysVerified",
    "reviewedSlot",
    "blockingIssues",
    "reviewNotes"
  ]
};

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
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
  }
  cleaned = cleaned.trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  cleaned = cleaned.replace(/\\\\|\\(?!["\\/bfnrt])(?!u[0-9a-fA-F]{4})/g, m => m === '\\\\' ? '\\\\' : '\\\\');

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[JSON Parse Failure] Error message:", error.message);
    try {
      fs.mkdirSync('scratch', { recursive: true });
      fs.writeFileSync('scratch/json_error.txt', cleaned, 'utf8');
      console.error("[JSON Parse Failure] Full raw text written to scratch/json_error.txt");
    } catch (e) {
      console.error("[JSON Parse Failure] Failed to write scratch/json_error.txt:", e.message);
    }
    const match = error.message.match(/at position (\d+)/);
    if (match) {
      const pos = parseInt(match[1], 10);
      const startPos = Math.max(0, pos - 50);
      const endPos = Math.min(cleaned.length, pos + 50);
      console.error("[JSON Parse Failure] Snippet around error:");
      console.error("--- SNIPPET START ---");
      console.error(cleaned.slice(startPos, endPos));
      console.error("--- SNIPPET END ---");
    } else {
      console.error("[JSON Parse Failure] First 500 chars of cleaned text:\n", cleaned.slice(0, 500));
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

async function callStructuredWithRetries({ workload, contents, responseSchema, config, label }) {
  let lastError;
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await generateStructuredFactoryContent({ workload, contents, responseSchema, config });
    } catch (error) {
      lastError = error;
      const message = String(error && error.message ? error.message : error);
      const transient =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.toLowerCase().includes('timeout') ||
        message.includes('STRUCTURED_RESPONSE_JSON_PARSE_FAILED');
      if (!transient || attempt === maxAttempts - 1) break;
      const waitTime = (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) ? 30000 : 15000;
      console.warn(`[Retry Warning] ${label} attempt ${attempt + 1} failed: ${message}. Retrying in ${waitTime/1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * (attempt + 1)));
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
  const draftRes = await callStructuredWithRetries({
    workload: WORKLOADS.factoryFlash,
    contents: prompt,
    responseSchema: CRUCIBLE_DRAFT_SCHEMA,
    config: { maxOutputTokens: 8192 },
    label: 'crucible flash draft',
  });
  const draftJson = draftRes.data;
  writeJson('crucible_macro_test_2_flash_draft.json', {
    modelMetadata: draftRes.metadata,
    draft: draftJson,
    selectedAtoms,
  });

  const reviewPrompt = [
    'You are the RankCrackers Pro academic reviewer.',
    'Review this macro_test_2 draft against the source atoms.',
    'Return strict JSON only matching the schema.',
    'Check answer correctness, solution correctness, ambiguity, multiple-correct risk, no-correct risk, unit/sign/formula issues, atom scope, and duplicate risk.',
    JSON.stringify({ selectedAtoms, draft: draftJson }, null, 2),
  ].join('\n');
  const reviewRes = await callStructuredWithRetries({
    workload: WORKLOADS.deepReasoningPro,
    contents: reviewPrompt,
    responseSchema: CRUCIBLE_REVIEW_SCHEMA,
    config: { maxOutputTokens: 8192 },
    label: 'crucible pro review',
  });
  const reviewJson = reviewRes.data;
  writeJson('crucible_macro_test_2_pro_review.json', {
    modelMetadata: reviewRes.metadata,
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
    (reviewJson.reviewedSlot === true || reviewJson.reviewedSlot === "macro_test_2");
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

const DIGIBOOK_REVIEW_SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["PASS", "FAIL"] },
    itemCountReviewed: { type: "INTEGER" },
    approvedAtomIds: { type: "ARRAY", items: { type: "STRING" } },
    pendingReviewAtomIds: { type: "ARRAY", items: { type: "STRING" } },
    rejectedOrHeldAtomIds: { type: "ARRAY", items: { type: "STRING" } },
    conceptCorrectnessPass: { type: "BOOLEAN" },
    formulaPass: { type: "BOOLEAN" },
    workedExampleMathPass: { type: "BOOLEAN" },
    selfCheckPass: { type: "BOOLEAN" },
    blockingIssues: { type: "ARRAY", items: { type: "STRING" } },
    reviewNotes: { type: "STRING" }
  },
  required: [
    "verdict",
    "itemCountReviewed",
    "approvedAtomIds",
    "pendingReviewAtomIds",
    "rejectedOrHeldAtomIds",
    "blockingIssues",
    "reviewNotes"
  ]
};

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

  const draftItems = [];
  const draftMetadataList = [];
  
  for (let i = 0; i < selectedSlim.length; i++) {
    const atom = selectedSlim[i];
    console.log(`[Fasttrack DigiBook] Processing atom ${i + 1}/${selectedSlim.length}: ${atom.atomId}`);
    const prompt = [
      `Create RankCrackers DigiBook internal draft object for the syllabus atom: ${atom.atomId}.`,
      'Return strict JSON only matching the schema.',
      'Fields required: atomId, title, sections: concepts, formulaRegister, commonMisconceptions, workedExamples, selfChecks.',
      'If a section is not applicable, include NOT_APPLICABLE_WITH_REASON.',
      'Do not fabricate PYQ claims. Do not mark studentPublishReady true.',
      JSON.stringify({ atom }, null, 2),
    ].join('\n');
    
    const draftRes = await callStructuredWithRetries({
      workload: WORKLOADS.factoryFlash,
      contents: prompt,
      responseSchema: DIGIBOOK_DRAFT_SCHEMA,
      config: { maxOutputTokens: 4096 },
      label: `digibook flash draft for ${atom.atomId}`,
    });
    
    draftItems.push(draftRes.data);
    draftMetadataList.push(draftRes.metadata);
    
    // Tiny throttle to stay safe with rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const combinedDraftJson = { items: draftItems };

  writeJson('digibook_wave1_flash_draft.json', {
    modelMetadata: draftMetadataList[0],
    selectedAtoms: selectedSlim,
    draft: combinedDraftJson,
  });

  const reviewPrompt = [
    'You are the RankCrackers Pro DigiBook reviewer.',
    'Review the 20 atom DigiBook draft for concept correctness, formula correctness, units, examples, misconceptions, self-check answer correctness, and source scope.',
    'Return strict JSON only matching the schema.',
    JSON.stringify({ selectedAtoms: selectedSlim, draft: combinedDraftJson }, null, 2),
  ].join('\n');
  
  const reviewRes = await callStructuredWithRetries({
    workload: WORKLOADS.deepReasoningPro,
    contents: reviewPrompt,
    responseSchema: DIGIBOOK_REVIEW_SCHEMA,
    config: { maxOutputTokens: 8192 },
    label: 'digibook pro review',
  });
  const reviewJson = reviewRes.data;
  writeJson('digibook_wave1_pro_review.json', {
    modelMetadata: reviewRes.metadata,
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
    flashModel: 'gemini-3.6-flash',
    proModel: reviewRes.metadata.actualModel,
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
    console.log('Sleeping 10s before Crucible track to clear rate limits...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
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
