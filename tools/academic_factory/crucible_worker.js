"use strict";

const fs = require('fs');
const path = require('path');
const { callStructuredWithRetries, WORKLOADS } = require('./factory_client');
const { buildArtifactId, buildContentHash, buildReviewHash } = require('./artifact_identity');
const { JOB_STATE } = require('./factory_job_states');

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

async function runCrucibleWorker({ manifest, factoryState, policy, workspaceDirectory, atoms }) {
  if (!policy.workers.crucible.enabled) {
    console.log('[Crucible Worker] Disabled by policy.');
    return;
  }

  console.log('[Crucible Worker] Starting Crucible slots processing...');
  const missionId = manifest.missionId;
  const plan = manifest.cruciblePlan || { schedules: [] };

  if (!factoryState.crucible.jobs) {
    factoryState.crucible.jobs = {};
  }

  // Derive target slots from canonical plan
  const schedules = plan.schedules || [];
  const uniqueSlotIds = [...new Set(schedules.map(s => s.slotId))];

  // We should also check for major test final slot
  const majorSlots = schedules.filter(s => s.slotId === 'major_test_final');
  const slotsToRun = [];

  // Group schedules by slotId
  for (const slotId of uniqueSlotIds) {
    const slotSchedules = schedules.filter(s => s.slotId === slotId);
    const phaseId = slotSchedules[0].phaseId;
    slotsToRun.push({ slotId, phaseId, schedules: slotSchedules });
  }

  let packsReady = 0;
  let reviewedMacro = 0;
  let reviewedMajor = 0;
  let keysVerified = 0;

  for (const slot of slotsToRun) {
    const slotId = slot.slotId;
    const phaseId = slot.phaseId;

    // Check if already complete
    const existingJob = factoryState.crucible.jobs[slotId];
    if (existingJob && existingJob.status === JOB_STATE.APPROVED) {
      console.log(`[Crucible Worker] Slot ${slotId} is already approved. Skipping regeneration.`);
      if (existingJob.questionPackReady) packsReady++;
      if (existingJob.reviewed) {
        if (slotId === 'major_test_final') reviewedMajor++;
        else reviewedMacro++;
      }
      if (existingJob.answerKeyVerified) keysVerified++;
      continue;
    }

    // Process slot
    console.log(`[Crucible Worker] Processing Crucible slot: ${slotId}`);

    let selectedAtoms;
    let questionCount;
    if (slotId === 'major_test_final') {
      const allIds = [...new Set(schedules.flatMap(s => s.assignedAtomIds || []))];
      selectedAtoms = atomSummary(atoms, allIds.slice(0, 45));
      questionCount = 30;
    } else {
      const phaseAtomIds = [...new Set(slot.schedules.flatMap(s => s.assignedAtomIds || []))];
      selectedAtoms = atomSummary(atoms, phaseAtomIds.slice(0, 18));
      questionCount = 100;
    }

    try {
      const artifactId = buildArtifactId({ missionId, pillar: 'crucible', canonicalId: slotId });

      // Flash structured generation
      const prompt = [
        `You are creating a RankCrackers internal JEE Main ${slotId === 'major_test_final' ? 'Major' : 'Macro'} assessment draft.`,
        'Return strict JSON only matching the schema.',
        `Create exactly ${questionCount} questions for ${slotId} from the provided source atoms.`,
        'Mix Physics/Chemistry/Mathematics according to the provided atoms.',
        'Each item must include: itemId, atomId, type (SINGLE_SELECT or NUMERIC_RESPONSE), stem, options for SINGLE_SELECT, answer, shortSolution, difficulty.',
        'Do not claim official answer key. Use source-grounded internal draft only.',
        JSON.stringify({ slotId, phaseId, selectedAtoms }, null, 2),
      ].join('\n');

      const draftRes = await callStructuredWithRetries({
        workload: WORKLOADS.factoryFlash,
        contents: prompt,
        responseSchema: CRUCIBLE_DRAFT_SCHEMA,
        config: { maxOutputTokens: 8192 },
        label: `crucible flash draft for ${slotId}`
      });

      const draftJson = draftRes.data;
      const draftMetadata = draftRes.metadata;
      const contentHash = buildContentHash(draftJson);

      // Pro Review
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
        label: `crucible pro review for ${slotId}`
      });

      const reviewJson = reviewRes.data;
      const reviewMetadata = reviewRes.metadata;

      const reviewHash = buildReviewHash({
        artifactId,
        contentHash,
        reviewerModel: 'gemini-3.1-pro-preview',
        reviewPayload: reviewJson
      });

      // Write outputs
      const missionDir = path.join(workspaceDirectory, missionId);
      fs.mkdirSync(missionDir, { recursive: true });

      fs.writeFileSync(
        path.join(missionDir, `crucible_${slotId}_draft.json`),
        JSON.stringify({ modelMetadata: draftMetadata, draft: draftJson, selectedAtoms }, null, 2),
        'utf8'
      );

      fs.writeFileSync(
        path.join(missionDir, `crucible_${slotId}_review.json`),
        JSON.stringify({ modelMetadata: reviewMetadata, review: reviewJson }, null, 2),
        'utf8'
      );

      const pass = reviewJson.verdict === 'PASS';

      factoryState.crucible.jobs[slotId] = {
        slotId,
        status: pass ? JOB_STATE.APPROVED : JOB_STATE.HELD_REVIEW,
        artifactId,
        contentHash,
        reviewHash,
        questionPackReady: pass,
        reviewed: pass,
        answerKeyVerified: pass,
        verifiedAcademicAnswerKey: pass,
        draftFile: `crucible_${slotId}_draft.json`,
        reviewFile: `crucible_${slotId}_review.json`,
        blocker: pass ? null : 'PRO_REVIEW_DID_NOT_PASS'
      };

      if (pass) {
        packsReady++;
        if (slotId === 'major_test_final') reviewedMajor++;
        else reviewedMacro++;
        keysVerified++;
      } else {
        factoryState.exceptionQueue.push({
          missionId,
          pillar: 'crucible',
          canonicalId: slotId,
          exceptionClass: 'PRO_REVIEW_DISPUTE',
          reason: `Pro reviewer flagged issues: ${reviewJson.blockingIssues.join('; ')}`,
          artifactId,
          contentHash,
          retryCount: 0
        });
      }

    } catch (err) {
      console.error(`[Crucible Worker] Error processing slot ${slotId}:`, err.message);
      factoryState.crucible.jobs[slotId] = {
        slotId,
        status: JOB_STATE.FAILED,
        error: err.message
      };
    }
  }

  // Update summary counters
  factoryState.crucible.packsReady = packsReady;
  factoryState.crucible.packsTotal = slotsToRun.length;
  factoryState.crucible.reviewedMacro = reviewedMacro;
  factoryState.crucible.macroTotal = slotsToRun.filter(s => s.slotId !== 'major_test_final').length;
  factoryState.crucible.reviewedMajor = reviewedMajor;
  factoryState.crucible.majorTotal = slotsToRun.filter(s => s.slotId === 'major_test_final').length;
  factoryState.crucible.keysVerified = keysVerified;

  console.log(`[Crucible Worker] Finished: PacksReady=${packsReady}/${slotsToRun.length}, MacroReviewed=${reviewedMacro}, MajorReviewed=${reviewedMajor}`);
}

module.exports = {
  runCrucibleWorker
};
