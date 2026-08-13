const fs = require('fs');
const path = require('path');
const {
  generateStructuredFactoryContent,
  WORKLOADS,
} = require('./vertex_factory_client');

const OUT_DIR = path.join(__dirname, '../../docs/patch_safety/student_pillars_r2_fasttrack_wave2_20260812_190000');
const BASELINE = '3bee1c0f519e35440754254114d50fe703e2f7e9';

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

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(OUT_DIR, filename), 'utf8'));
}

function writeJson(filename, obj) {
  fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(obj, null, 2), 'utf8');
}

async function runReview(slotId, draftJson, selectedAtoms) {
  console.log(`[Repair] Running Pro review for ${slotId}...`);
  const reviewPrompt = [
    'You are the RankCrackers Pro academic reviewer.',
    `Review this ${slotId} draft against the source atoms.`,
    'Check answer correctness, solution correctness, ambiguity, multiple-correct risk, no-correct risk, unit/sign/formula issues, atom scope, and duplicate risk.',
    JSON.stringify({ selectedAtoms, draft: draftJson }, null, 2),
  ].join('\n');

  const reviewRes = await callStructuredWithRetries({
    workload: WORKLOADS.deepReasoningPro,
    contents: reviewPrompt,
    responseSchema: CRUCIBLE_REVIEW_SCHEMA,
    config: { maxOutputTokens: 8192 },
    label: `crucible pro review for ${slotId}`,
  });
  return {
    reviewJson: reviewRes.data,
    reviewMetadata: reviewRes.metadata,
  };
}

async function repairMacro5() {
  console.log('--- Repairing macro_test_5 ---');
  const draftFile = 'crucible_macro_test_5_flash_draft.json';
  const data = readJson(draftFile);
  
  // Repair Item 9
  const item9 = data.draft.items.find(i => i.itemId === 'item_9');
  if (item9) {
    item9.answer = "(CH3)3C+";
    item9.options = [
      "(CH3)3C+",
      "(CH3)2CH+",
      "CH3CH2+",
      "CH3+"
    ];
    console.log('Repaired macro_test_5 Item 9 carbocation spelling.');
  }

  // Repair Item 12
  const item12 = data.draft.items.find(i => i.itemId === 'item_12');
  if (item12) {
    item12.stem = "Which of the following hydrocarbons possesses terminal acidic hydrogen and reacts with sodamide (NaNH2) to liberate ammonia (NH3) gas?";
    console.log('Repaired macro_test_5 Item 12 NH3 liberation statement.');
  }

  writeJson(draftFile, data);

  const { reviewJson, reviewMetadata } = await runReview('macro_test_5', data.draft, data.selectedAtoms);
  writeJson('crucible_macro_test_5_pro_review.json', {
    modelMetadata: reviewMetadata,
    review: reviewJson,
  });

  return reviewJson.verdict === 'PASS';
}

async function repairMacro6() {
  console.log('--- Repairing macro_test_6 ---');
  const draftFile = 'crucible_macro_test_6_flash_draft.json';
  const data = readJson(draftFile);

  // Repair Item 9
  const item9 = data.draft.items.find(i => i.itemId === 'item_9');
  if (item9) {
    item9.answer = "NO2+ ion";
    item9.options = [
      "NO2+ ion",
      "NO+ ion",
      "NO3- ion",
      "HNO2 molecule"
    ];
    console.log('Repaired macro_test_6 Item 9 NO2+ setup ion spelling.');
  }

  writeJson(draftFile, data);

  const { reviewJson, reviewMetadata } = await runReview('macro_test_6', data.draft, data.selectedAtoms);
  writeJson('crucible_macro_test_6_pro_review.json', {
    modelMetadata: reviewMetadata,
    review: reviewJson,
  });

  return reviewJson.verdict === 'PASS';
}

async function repairMacro7() {
  console.log('--- Repairing macro_test_7 ---');
  const draftFile = 'crucible_macro_test_7_flash_draft.json';
  const data = readJson(draftFile);

  // Repair Item 9
  const item9 = data.draft.items.find(i => i.itemId === 'item_9');
  if (item9) {
    item9.stem = "For a reaction A(g) + B(g) <=> 2C(g), the equilibrium constant Kc is 16 at 300 K. If 1 mole of A and 1 mole of B are placed in a 1 L container, find the equilibrium concentration of C in mol/L (rounded to two decimal places).";
    console.log('Repaired macro_test_7 Item 9 rounding instructions.');
  }

  writeJson(draftFile, data);

  const { reviewJson, reviewMetadata } = await runReview('macro_test_7', data.draft, data.selectedAtoms);
  writeJson('crucible_macro_test_7_pro_review.json', {
    modelMetadata: reviewMetadata,
    review: reviewJson,
  });

  return reviewJson.verdict === 'PASS';
}

async function main() {
  const pass5 = await repairMacro5();
  const pass6 = await repairMacro6();
  const pass7 = await repairMacro7();

  console.log(`Results: macro_test_5: ${pass5}, macro_test_6: ${pass6}, macro_test_7: ${pass7}`);

  // Re-read and update crucible_wave2_register.json
  const reg = readJson('crucible_wave2_register.json');
  
  const updateSlot = (slotId, passed) => {
    reg.results[slotId].questionPackReady = passed;
    reg.results[slotId].reviewed = passed;
    reg.results[slotId].answerKeyVerified = passed;
    reg.results[slotId].verifiedAcademicAnswerKey = passed;
    reg.results[slotId].blocker = passed ? null : 'PRO_REVIEW_DID_NOT_PASS';
  };

  updateSlot('macro_test_5', pass5);
  updateSlot('macro_test_6', pass6);
  updateSlot('macro_test_7', pass7);

  // Recompute summary
  const successPacks = Object.values(reg.results).filter(r => r.questionPackReady).length;
  const successMacro = Object.values(reg.results).filter(r => r.reviewed && r.slotId !== 'major_test_final').length;
  const successMajor = reg.results['major_test_final'].reviewed ? 1 : 0;
  const successKeys = Object.values(reg.results).filter(r => r.answerKeyVerified).length;

  const totalPacksReady = 2 + successPacks;
  const totalMacroReviewed = 2 + successMacro;
  const totalMajorReviewed = 0 + successMajor;
  const totalKeysVerified = 2 + successKeys;

  reg.summary = {
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
  };

  writeJson('crucible_wave2_register.json', reg);

  // Re-read and update wave2_report.json
  const report = readJson('wave2_report.json');
  report.crucible = reg.summary;
  writeJson('wave2_report.json', report);

  // Update summary.md
  const summaryPath = path.join(OUT_DIR, 'summary.md');
  const summaryLines = [
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
  ].join('\n');
  fs.writeFileSync(summaryPath, summaryLines, 'utf8');

  console.log('Crucible repair successfully complete!');
  console.log(`Crucible question packs ready: ${report.crucible.questionPacksReady}/8`);
}

main().catch(err => {
  console.error('Repair execution failed:', err);
  process.exit(1);
});
