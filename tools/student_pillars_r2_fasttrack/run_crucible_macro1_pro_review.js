"use strict";

const fs = require("fs");
const path = require("path");
const { generateFactoryContent } = require("./vertex_factory_client");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs", "patch_safety", "student_pillars_r2_fasttrack_vertex_batch_20260812_173300");
const ITEM_PACK = path.join(ROOT, "docs", "assessment", "internal", "JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ORIGINAL_ITEM_DRAFT_PACK_V1.json");
const ANSWERS = path.join(ROOT, "docs", "assessment", "internal", "JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ANSWER_SOLUTION_CONTRACT_V1.json");
const DIGIBOOK = path.join(ROOT, "docs", "digibook", "internal", "JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_V1.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function extractJson(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("PRO_REVIEW_JSON_NOT_FOUND");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function compactReviewPayload() {
  const itemPack = readJson(ITEM_PACK);
  const answers = readJson(ANSWERS);
  const digibook = readJson(DIGIBOOK);
  const answerByItem = new Map((answers.records || []).map(record => [record.itemId, record]));
  return {
    sourceLineage: digibook.sourceLineage,
    itemCount: itemPack.items.length,
    items: itemPack.items.map(item => {
      const answer = answerByItem.get(item.itemId) || {};
      return {
        itemId: item.itemId,
        atomId: item.primaryAuthorizedAtomId,
        secondaryAtomIds: item.secondaryAuthorizedAtomIds,
        format: item.itemFormat,
        pointValue: item.pointValue,
        stem: item.stem,
        options: item.options,
        responseConstraints: item.responseConstraints,
        expectedReasoningOutline: item.expectedReasoningOutline,
        provisionalKeyCandidate: item.provisionalKeyCandidate,
        reviewedAnswer: answer.normalizedAcceptedResponse,
        acceptedResponseVariants: answer.acceptedResponseVariants,
        answerDerivation: answer.answerDerivation,
        fullInternalSolution: answer.fullInternalSolution,
        unitCheck: answer.unitCheck,
        signConventionCheck: answer.signConventionCheck,
        optionValidation: answer.optionValidation,
        scopeSafetyCheck: answer.scopeSafetyCheck,
      };
    }),
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const payload = compactReviewPayload();
  const prompt = `You are the independent academic reviewer for RankCrackers internal JEE mechanics assessment content.\n\nReview the supplied source lineage, question pack, answer keys, and solutions. The source lineage is the official-source evidence available for this internal pack.\n\nReturn JSON only with exactly this shape:\n{\n  "verdict": "PASS" | "FAIL",\n  "itemCountReviewed": 12,\n  "allItemsSourceAligned": boolean,\n  "allAnswersTechnicallyCorrect": boolean,\n  "allSolutionsTechnicallyCorrect": boolean,\n  "noMultipleCorrectRisk": boolean,\n  "noScopeLeakage": boolean,\n  "answerKeysVerified": boolean,\n  "reviewedMacroSlot": boolean,\n  "studentReady": false,\n  "officialAnswerKey": false,\n  "modelOnlyCanonicalPromotion": false,\n  "blockingIssues": [],\n  "reviewNotes": []\n}\n\nStrict rules:\n- Do not approve student readiness.\n- Do not call answers official.\n- If any item is wrong or ambiguous, verdict must be FAIL and include blockingIssues.\n- Agreement with draft alone is not evidence; inspect source alignment and reasoning.\n\nPayload:\n${JSON.stringify(payload)}`;

  let result;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      result = await generateFactoryContent({
        workload: "deepReasoningPro",
        contents: prompt,
        config: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 8000 * attempt));
    }
  }

  const review = extractJson(result.text);
  const pass = review.verdict === "PASS" &&
    review.itemCountReviewed === 12 &&
    review.allItemsSourceAligned === true &&
    review.allAnswersTechnicallyCorrect === true &&
    review.allSolutionsTechnicallyCorrect === true &&
    review.noMultipleCorrectRisk === true &&
    review.noScopeLeakage === true &&
    review.answerKeysVerified === true &&
    review.reviewedMacroSlot === true &&
    review.studentReady === false &&
    review.officialAnswerKey === false &&
    review.modelOnlyCanonicalPromotion === false &&
    Array.isArray(review.blockingIssues) && review.blockingIssues.length === 0;

  const evidence = {
    verdict: pass
      ? "RANKCRACKERS_R2B_MACRO_TEST_1_PRO_REVIEW_PASS"
      : "RANKCRACKERS_R2B_MACRO_TEST_1_PRO_REVIEW_FAILED",
    slotId: "macro_test_1",
    modelMetadata: result.metadata,
    review,
    sourceArtifacts: [
      "docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ORIGINAL_ITEM_DRAFT_PACK_V1.json",
      "docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ANSWER_SOLUTION_CONTRACT_V1.json",
      "docs/digibook/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_V1.json"
    ],
    safety: {
      studentReady: false,
      officialAnswerKey: false,
      firestoreWrite: false,
      productionRead: false,
      deploy: false,
      modelOnlyCanonicalPromotion: false,
    },
  };

  fs.writeFileSync(path.join(OUT_DIR, "macro_test_1_pro_review.json"), JSON.stringify(evidence, null, 2));
  console.log(evidence.verdict);
  console.log(`MODEL=${result.metadata.actualModel}`);
  console.log(`FALLBACK_USED=${result.metadata.fallbackUsed}`);
  console.log(`ITEMS_REVIEWED=${review.itemCountReviewed}`);
}

main().catch(error => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "macro_test_1_pro_review_blocked.json"), JSON.stringify({
    verdict: "RANKCRACKERS_R2B_MACRO_TEST_1_PRO_REVIEW_BLOCKED",
    error: error && error.message ? error.message : String(error),
  }, null, 2));
  console.error("RANKCRACKERS_R2B_MACRO_TEST_1_PRO_REVIEW_BLOCKED");
  console.error(`ERROR=${error && error.message ? error.message : error}`);
  process.exitCode = 1;
});