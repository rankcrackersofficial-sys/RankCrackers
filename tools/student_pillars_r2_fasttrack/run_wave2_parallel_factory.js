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

// IMPORTANT:
// syllabus_preview_tree.json is DERIVED_PREVIEW evidence only.
// It may be used to reconcile atom IDs and current UI hierarchy,
// but it MUST NOT independently promote an atom to SOURCE_PROVEN.

const SOURCE_CLASS = Object.freeze({
  OFFICIAL_SOURCE: "OFFICIAL_SOURCE",
  OFFICIAL_EXTRACTION: "OFFICIAL_EXTRACTION",
  DERIVED_PREVIEW: "DERIVED_PREVIEW",
  MODEL_OUTPUT: "MODEL_OUTPUT",
});

const ROOT = process.cwd();
const BASELINE = '3bee1c0f519e35440754254114d50fe703e2f7e9';
const OUT_DIR = path.join(
  ROOT,
  'docs',
  'patch_safety',
  'student_pillars_r2_fasttrack_wave2_20260812_190000'
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
    return true;
  });
}

function safeJsonParse(text) {
  const trimmed = text.trim();
  
  const sanitize = (str) => {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\\') {
        const next = str[i + 1];
        if (next === '"' || next === '\\' || next === '/' || next === 'b' || next === 'f' || next === 'n' || next === 'r' || next === 't') {
          result += '\\' + next;
          i++;
        } else if (next === 'u') {
          const hex = str.slice(i + 2, i + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            result += '\\u' + hex;
            i += 5;
          } else {
            result += '\\\\';
          }
        } else {
          result += '\\\\';
        }
      } else {
        result += str[i];
      }
    }
    return result;
  };
  
  let cleanText = trimmed;
  const start = trimmed.indexOf('{');
  if (start >= 0) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            cleanText = trimmed.slice(start, i + 1);
            break;
          }
        }
      }
    }
  }

  try {
    return JSON.parse(sanitize(cleanText));
  } catch (error) {
    throw error;
  }
}

async function callWithRetries({ workload, contents, config, label }) {
  let lastError;
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await generateFactoryContent({ workload, contents, config });
    } catch (error) {
      lastError = error;
      const message = String(error && error.message ? error.message : error);
      const transient =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.toLowerCase().includes('timeout');
      if (!transient || attempt === maxAttempts - 1) break;
      const waitTime = (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) ? 30000 : 15000;
      console.warn(`[Retry Warning] ${label} attempt ${attempt + 1} failed: ${message}. Retrying in ${waitTime/1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * (attempt + 1)));
    }
  }
  throw new Error(`${label} failed after bounded retries: ${lastError.message || lastError}`);
}

async function callStructuredWithRetries({ workload, contents, responseSchema, config, label }) {
  let lastError;
  const maxAttempts = 5;
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

// Track A: Syllabus Resolution from prevalidated recovery mapping
function resolveSyllabusTrack(recovery) {
  const items = recovery.items.map((item) => {
    if (item.sourceStatus !== 'SOURCE_PROVEN') {
      throw new Error(`Syllabus source status not proven: ${item.atomId}`);
    }
    return {
      atomId: item.atomId,
      subject: "Chemistry",
      previousUnit: "General Unit",
      previousChapter: "General Chapter",
      candidateUnit: item.verifiedUnit,
      candidateChapter: item.verifiedChapter,
      finalUnit: item.verifiedUnit,
      finalChapter: item.verifiedChapter,
      sourceReferences: [
        {
          sourceClass: SOURCE_CLASS.OFFICIAL_SOURCE,
          document: item.unitSource.document,
          locator: item.unitSource.locator,
          sourceHash: item.unitSource.sourceHash,
        },
        {
          sourceClass: SOURCE_CLASS.OFFICIAL_SOURCE,
          document: item.chapterSource.document,
          locator: item.chapterSource.locator,
          sourceHash: item.chapterSource.sourceHash,
        }
      ],
      flashModel: 'NOT_USED_SOURCE_TRUTHFULNESS_GATE',
      proModel: 'NOT_USED_SOURCE_TRUTHFULNESS_GATE',
      proVerdict: 'SOURCE_BACKED_STRUCTURE_PRESENT',
      finalStatus: 'VERIFIED',
      blocker: null,
      modelOnlyPromotion: false,
    };
  });

  return {
    selectionRule: 'Wave-2 Syllabus recovery verification via official_source truth',
    attempted: items.length,
    items,
  };
}

// Track B: DigiBook structured rerun
const EXPECTED_DIGIBOOK_IDS = [
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U11_T_0DB42BEA_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_C9AC8CA6_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_1206BA8A_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_1206BA8A_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_BCA9920C_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_B270826F_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_B270826F_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_D8B93C4B_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U18_T_19C1F7E4_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U18_T_19C1F7E4_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_97ACB2E0_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U13_T_0B6FC591_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U19_T_69EF29B0_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U19_T_69EF29B0_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_3944DA40_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_FE6942BA_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_FE6942BA_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_7CAF568B_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_7CAF568B_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_671F479D_CH001"
];

async function runDigiBookTrack(atoms) {
  // Enforce substitution verification
  const atomsMap = new Map(atoms.map(a => [a.atomId, a]));
  const selectedAtomsSlim = [];
  const DIFFERENT_ATOM_SUBSTITUTION_COUNT = EXPECTED_DIGIBOOK_IDS.filter(id => !atomsMap.has(id)).length;
  if (DIFFERENT_ATOM_SUBSTITUTION_COUNT > 0) {
    throw new Error(`DigiBook ID substitution detected: ${DIFFERENT_ATOM_SUBSTITUTION_COUNT} missing`);
  }

  for (const id of EXPECTED_DIGIBOOK_IDS) {
    const atom = atomsMap.get(id);
    selectedAtomsSlim.push({
      atomId: atom.atomId,
      subject: atom.subject,
      unit: atom.unit,
      chapter: atom.chapter,
      topic: atom.topic || atom.atomicTopicLabel,
      sourceTraceStatus: atom.sourceTraceStatus,
    });
  }

  console.log('Rerunning DigiBook sequentially via generateStructuredFactoryContent...');
  const items = [];
  let modelMetadata;
  for (let i = 0; i < selectedAtomsSlim.length; i++) {
    const slim = selectedAtomsSlim[i];
    console.log(`[${i+1}/20] Generating structured draft for: ${slim.atomId}`);
    const prompt = [
      'Create a RankCrackers DigiBook internal draft object for the following JEE Main atom.',
      'Provide concepts explanation, formulaRegister, commonMisconceptions, workedExamples, and selfChecks.',
      'Do not fabricate PYQ claims.',
      JSON.stringify(slim, null, 2),
    ].join('\n');
    const res = await callStructuredWithRetries({
      workload: WORKLOADS.factoryFlash,
      contents: prompt,
      responseSchema: DIGIBOOK_DRAFT_SCHEMA,
      config: { maxOutputTokens: 8192 },
      label: `digibook draft structured for ${slim.atomId}`,
    });
    items.push(res.data);
    modelMetadata = res.metadata;
    if (i < selectedAtomsSlim.length - 1) {
      console.log('Sleeping 8s to prevent rate limits...');
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  }

  const draftJson = { items };
  writeJson('digibook_wave2_flash_draft.json', {
    modelMetadata,
    selectedAtoms: selectedAtomsSlim,
    draft: draftJson,
  });

  console.log('Running DigiBook Pro review on consolidated draft...');
  const reviewPrompt = [
    'You are the RankCrackers Pro DigiBook reviewer.',
    'Review the 20 atom DigiBook draft for concept correctness, formula correctness, units, examples, misconceptions, self-check answer correctness, and source scope.',
    'Return strict JSON only.',
    'Required fields: verdict, itemCountReviewed, approvedAtomIds, pendingReviewAtomIds, rejectedOrHeldAtomIds, conceptCorrectnessPass, formulaPass, workedExampleMathPass, selfCheckPass, blockingIssues, reviewNotes.',
    JSON.stringify({ selectedAtoms: selectedAtomsSlim, draft: draftJson }, null, 2),
  ].join('\n');

  let reviewJson;
  let review;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      review = await callWithRetries({
        workload: WORKLOADS.deepReasoningPro,
        contents: reviewPrompt,
        config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
        label: `digibook pro review (attempt ${attempt + 1})`,
      });
      reviewJson = safeJsonParse(review.text);
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      console.warn(`[Retry Warning] DigiBook Pro review parsing failed attempt ${attempt + 1}: ${err.message}. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, 8000));
    }
  }

  writeJson('digibook_wave2_pro_review.json', {
    modelMetadata: review.metadata,
    review: reviewJson,
  });

  const approved = Array.isArray(reviewJson.approvedAtomIds) ? reviewJson.approvedAtomIds : [];
  const pending = Array.isArray(reviewJson.pendingReviewAtomIds) ? reviewJson.pendingReviewAtomIds : [];
  const held = Array.isArray(reviewJson.rejectedOrHeldAtomIds) ? reviewJson.rejectedOrHeldAtomIds : [];

  return {
    selectedAtoms: selectedAtomsSlim,
    approvedAtomIds: approved,
    pendingReviewAtomIds: pending,
    rejectedOrHeldAtomIds: held,
    approvedCount: approved.length,
    pendingReviewCount: pending.length,
    rejectedOrHeldCount: held.length,
    flashModel: 'gemini-3.6-flash',
    proModel: 'gemini-3.1-pro-preview',
  };
}

// Track C: Crucible remaining scaleout
async function buildCrucibleSlot(slotId, phaseId, atoms, plan) {
  let selectedAtoms;
  let questionCount;
  if (slotId === 'major_test_final') {
    // For major test, collect all unique assigned atoms from all plan schedules
    const allIds = [...new Set(plan.schedules.flatMap((schedule) => schedule.assignedAtomIds || []))];
    selectedAtoms = atomSummary(atoms, allIds.slice(0, 45)); // Select 45 unique atoms
    questionCount = 30; // 30 questions
  } else {
    // Select atoms assigned to schedules in this phase
    const phaseSchedules = plan.schedules.filter((schedule) => schedule.phaseId === phaseId);
    const phaseAtomIds = [...new Set(phaseSchedules.flatMap((schedule) => schedule.assignedAtomIds || []))];
    selectedAtoms = atomSummary(atoms, phaseAtomIds.slice(0, 18)); // Select 18 unique atoms
    questionCount = 12; // 12 questions
  }

  console.log(`[Crucible] Building draft for ${slotId} with ${selectedAtoms.length} atoms...`);
  const prompt = [
    `You are creating a RankCrackers internal JEE Main ${slotId === 'major_test_final' ? 'Major' : 'Macro'} assessment draft.`,
    'Return strict JSON only.',
    `Create exactly ${questionCount} questions for ${slotId} from the provided source atoms.`,
    'Mix Physics/Chemistry/Mathematics according to the provided atoms.',
    'Each item must include: itemId, atomId, type (SINGLE_SELECT or NUMERIC_RESPONSE), stem, options for SINGLE_SELECT, answer, shortSolution, difficulty.',
    'Do not claim official answer key. Use source-grounded internal draft only.',
    JSON.stringify({ slotId, phaseId, selectedAtoms }, null, 2),
  ].join('\n');

  let draftJson;
  let draftMetadata;
  const draftRes = await callStructuredWithRetries({
    workload: WORKLOADS.factoryFlash,
    contents: prompt,
    responseSchema: CRUCIBLE_DRAFT_SCHEMA,
    config: { maxOutputTokens: 8192 },
    label: `crucible flash draft for ${slotId}`,
  });
  draftJson = draftRes.data;
  draftMetadata = draftRes.metadata;

  writeJson(`crucible_${slotId}_flash_draft.json`, {
    modelMetadata: draftMetadata,
    draft: draftJson,
    selectedAtoms,
  });

  console.log(`[Crucible] Running Pro review for ${slotId}...`);
  const reviewPrompt = [
    'You are the RankCrackers Pro academic reviewer.',
    `Review this ${slotId} draft against the source atoms.`,
    'Check answer correctness, solution correctness, ambiguity, multiple-correct risk, no-correct risk, unit/sign/formula issues, atom scope, and duplicate risk.',
    JSON.stringify({ selectedAtoms, draft: draftJson }, null, 2),
  ].join('\n');

  let reviewJson;
  let reviewMetadata;
  const reviewRes = await callStructuredWithRetries({
    workload: WORKLOADS.deepReasoningPro,
    contents: reviewPrompt,
    responseSchema: CRUCIBLE_REVIEW_SCHEMA,
    config: { maxOutputTokens: 8192 },
    label: `crucible pro review for ${slotId}`,
  });
  reviewJson = reviewRes.data;
  reviewMetadata = reviewRes.metadata;

  writeJson(`crucible_${slotId}_pro_review.json`, {
    modelMetadata: reviewMetadata,
    review: reviewJson,
  });

  const pass =
    reviewJson.verdict === 'PASS' &&
    reviewJson.itemCountReviewed === questionCount &&
    reviewJson.allAnswersTechnicallyCorrect === true &&
    reviewJson.allSolutionsTechnicallyCorrect === true &&
    reviewJson.noMultipleCorrectRisk === true &&
    reviewJson.noScopeLeakage === true &&
    reviewJson.answerKeysVerified === true;

  return {
    slotId,
    phaseId,
    selectedAtomCount: selectedAtoms.length,
    questionPackReady: pass,
    reviewed: pass,
    answerKeyVerified: pass,
    verifiedAcademicAnswerKey: pass,
    officialAnswerKey: false,
    studentReady: false,
    draftFile: `crucible_${slotId}_flash_draft.json`,
    reviewFile: `crucible_${slotId}_pro_review.json`,
    blocker: pass ? null : 'PRO_REVIEW_DID_NOT_PASS',
  };
}

async function main() {
  console.log(`Starting Wave-2 execution factory on baseline: ${BASELINE}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const tree = readJson('assets/data/preview/jee_main_2027/syllabus_preview_tree.json');
  const plan = readJson('assets/data/preview/jee_main_2027/crucible_preview_plan.json');
  const recovery = readJson('docs/patch_safety/syllabus_source_recovery.json');
  const atoms = flattenAtoms(tree);

  // 1. Syllabus Resolution (Track A)
  console.log('--- Track A: Syllabus Resolution ---');
  const syllabusTrack = resolveSyllabusTrack(recovery);
  writeJson('syllabus_wave2_manifest.json', {
    baselineHead: BASELINE,
    items: syllabusTrack.items.map((item) => ({
      atomId: item.atomId,
      subject: item.subject,
      previousUnit: item.previousUnit,
      previousChapter: item.previousChapter,
    })),
  });
  writeJson('syllabus_wave2_resolution.json', {
    baselinePreviewEligible: 417,
    baselinePending: 206,
    attempted: syllabusTrack.attempted,
    items: syllabusTrack.items,
  });

  // 2. Structured DigiBook Rerun (Track B)
  console.log('--- Track B: Structured DigiBook Rerun ---');
  const digibookTrack = await runDigiBookTrack(atoms);

  // 3. Crucible Remaining Scaleout (Track C)
  console.log('--- Track C: Crucible Remaining Scaleout ---');
  // 5 Macro Slots: macro_test_3 to macro_test_7
  const slotsToRun = [
    { slotId: 'macro_test_3', phaseId: 'phase_3' },
    { slotId: 'macro_test_4', phaseId: 'phase_4' },
    { slotId: 'macro_test_5', phaseId: 'phase_5' },
    { slotId: 'macro_test_6', phaseId: 'phase_6' },
    { slotId: 'macro_test_7', phaseId: 'phase_7' },
    { slotId: 'major_test_final', phaseId: 'phase_7' }
  ];

  const crucibleResults = {};
  for (const slot of slotsToRun) {
    crucibleResults[slot.slotId] = await buildCrucibleSlot(slot.slotId, slot.phaseId, atoms, plan);
  }

  // Aggregate results for reporting
  const allSyllabusVerified = syllabusTrack.items.filter(item => item.finalStatus === 'VERIFIED').length;
  const remainingPendingSyllabus = 206 - allSyllabusVerified;

  // Baseline has:
  // - Packs ready: 2/8 (baseline 1/8 + Wave-1 macro_test_2 1/8)
  // - Macro reviewed: 2/7 (baseline 1/7 + Wave-1 macro_test_2 1/7)
  // - Major reviewed: 0/1
  // - Answer keys verified: 2/8
  const successPacks = Object.values(crucibleResults).filter(r => r.questionPackReady).length;
  const successMacro = Object.values(crucibleResults).filter(r => r.reviewed && r.slotId !== 'major_test_final').length;
  const successMajor = crucibleResults['major_test_final'].reviewed ? 1 : 0;
  const successKeys = Object.values(crucibleResults).filter(r => r.answerKeyVerified).length;

  const totalPacksReady = 2 + successPacks;
  const totalMacroReviewed = 2 + successMacro;
  const totalMajorReviewed = 0 + successMajor;
  const totalKeysVerified = 2 + successKeys;

  const report = {
    syllabus: {
      baselineVerified: 211,
      newlyVerified: allSyllabusVerified,
      remainingPending: remainingPendingSyllabus,
      totalVerified: 211 + allSyllabusVerified,
      denominator: 417,
      studentBinding: "PARTIAL",
      studentReady: false
    },
    crucible: {
      macroReviewed: totalMacroReviewed,
      macroTotal: 7,
      majorReviewed: totalMajorReviewed,
      majorTotal: 1,
      questionPacksReady: totalPacksReady,
      questionPacksTotal: 8,
      answerKeysVerified: totalKeysVerified,
      answerKeysTotal: 8,
      studentBinding: "PARTIAL",
      studentReady: false
    },
    digibook: {
      baselineApprovedAtoms: 2,
      newlyApprovedAtoms: digibookTrack.approvedCount,
      approvedAtoms: 2 + digibookTrack.approvedCount,
      denominator: 417,
      studentBinding: "PARTIAL",
      studentReady: false
    },
    adaptiveUi: {
      testedWidths: [],
      physicalSamsungTested: false,
      overflowCount: 0,
      redScreenCount: 0
    },
    productionReady: false
  };

  writeJson('crucible_wave2_register.json', {
    baselineHead: BASELINE,
    results: crucibleResults,
    summary: report.crucible,
    officialAnswerKey: false,
    answerKeyTerminology: 'VERIFIED_ACADEMIC_ANSWER_KEY_NOT_OFFICIAL_ANSWER_KEY',
  });

  writeJson('digibook_wave2_manifest.json', {
    baselineHead: BASELINE,
    selectedAtoms: digibookTrack.selectedAtoms,
  });

  writeJson('digibook_wave2_review.json', {
    baselineHead: BASELINE,
    approvedAtomIds: digibookTrack.approvedAtomIds,
    pendingReviewAtomIds: digibookTrack.pendingReviewAtomIds,
    rejectedOrHeldAtomIds: digibookTrack.rejectedOrHeldAtomIds,
    blocker: null,
  });

  writeJson('wave2_report.json', report);

  writeText(
    'summary.md',
    [
      '# RANKCRACKERS STUDENT PILLARS R2 FASTTRACK WAVE-2',
      '',
      `Baseline: ${BASELINE}`,
      '',
      `Syllabus: 211/417 -> ${report.syllabus.totalVerified}/417`,
      `Crucible packs: 2/8 -> ${report.crucible.questionPacksReady}/8`,
      `Crucible Macro reviewed: 2/7 -> ${report.crucible.macroReviewed}/7`,
      `Crucible Major reviewed: 0/1 -> ${report.crucible.majorReviewed}/1`,
      `Crucible keys: 2/8 -> ${report.crucible.answerKeysVerified}/8`,
      `DigiBook: 2/417 -> ${report.digibook.approvedAtoms}/417`,
      '',
      'Safety: no production read/write, no Firestore write, no deploy, no student runtime AI.',
      '',
    ].join('\n')
  );

  console.log('RANKCRACKERS_WAVE2_FACTORY_RUN=COMPLETE');
  console.log(`OUT_DIR=${OUT_DIR}`);
  console.log(`SYLLABUS=${report.syllabus.totalVerified}/417`);
  console.log(`CRUCIBLE_PACKS=${report.crucible.questionPacksReady}/8`);
  console.log(`DIGIBOOK=${report.digibook.approvedAtoms}/417`);
}

main().catch((error) => {
  console.error('RANKCRACKERS_WAVE2_FACTORY_RUN=FAIL');
  console.error(error.stack || error.message || error);
  process.exit(1);
});
