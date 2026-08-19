"use strict";

const fs = require('fs');
const path = require('path');
const { callStructuredWithRetries, WORKLOADS } = require('./factory_client');
const { DIGIBOOK_DRAFT_SCHEMA } = require('../student_pillars_r2_fasttrack/digibook_draft_schema');
const { buildArtifactId, buildContentHash, buildReviewHash } = require('./artifact_identity');
const { JOB_STATE } = require('./factory_job_states');

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

async function runDigiBookWorker({ manifest, factoryState, policy, workspaceDirectory, atoms, checkpoint }) {
  if (!policy.workers.digibook.enabled) {
    console.log('[DigiBook Worker] Disabled by policy.');
    return;
  }

  console.log('[DigiBook Worker] Starting DigiBook pipeline processing...');
  const missionId = manifest.missionId;
  const batchSize = policy.workers.digibook.batchSize || 20;

  if (!factoryState.digibook.jobs) {
    factoryState.digibook.jobs = {};
  }

  const sortedAtoms = [...atoms].sort((a, b) => a.atomId.localeCompare(b.atomId));
  const batches = [];
  for (let i = 0; i < sortedAtoms.length; i += batchSize) {
    batches.push(sortedAtoms.slice(i, i + batchSize));
  }

  console.log(`[DigiBook Worker] Total atoms: ${sortedAtoms.length}, partitioned into ${batches.length} batches of size ${batchSize}.`);

  let approvedCount = 0;
  let heldCount = 0;
  let pendingCount = 0;
  let runProgressLimit = 10; // Only process 10 atoms per run to avoid shell timeouts

  for (const atom of sortedAtoms) {
    const existingJob = factoryState.digibook.jobs[atom.atomId];
    if (existingJob) {
      if (existingJob.status === JOB_STATE.APPROVED) approvedCount++;
      else if (existingJob.status === JOB_STATE.HELD_REVIEW) heldCount++;
      else if (existingJob.status === JOB_STATE.FAILED) pendingCount++;
    }
  }

  let atomsProcessedInThisRun = 0;
  for (let bIndex = 0; bIndex < batches.length; bIndex++) {
    if (atomsProcessedInThisRun >= runProgressLimit) {
      console.log(`[DigiBook Worker] Run progress limit reached (${runProgressLimit}). Stopping run.`);
      break;
    }
    const batch = batches[bIndex];
    const pendingInBatch = batch.filter(atom => {
      const job = factoryState.digibook.jobs[atom.atomId];
      return !job || (job.status !== JOB_STATE.APPROVED && job.status !== JOB_STATE.HELD_REVIEW);
    });

    if (pendingInBatch.length === 0) {
      console.log(`[DigiBook Worker] Batch ${bIndex + 1}/${batches.length} already processed. Skipping.`);
      continue;
    }

    console.log(`[DigiBook Worker] Batch ${bIndex + 1}/${batches.length} has ${pendingInBatch.length} pending atoms. Processing...`);

    for (const atom of pendingInBatch) {
      if (atomsProcessedInThisRun >= runProgressLimit) break;
      const atomId = atom.atomId;
      console.log(`[DigiBook Worker] Processing atom: ${atomId}`);

      try {
        const artifactId = buildArtifactId({ missionId, pillar: 'digibook', canonicalId: atomId });

        const draftPrompt = [
          'You are the RankCrackers DigiBook content generator.',
          `Generate a comprehensive theory content node for the syllabus atom: ${atomId}.`,
          'Cover concepts, key formulas, worked examples, common student misconceptions, and a 3-question self-check review with options and solutions.',
          'Return strict structured JSON matching the provided schema.',
          JSON.stringify({ atom }, null, 2),
        ].join('\n');

        const draftRes = await callStructuredWithRetries({
          workload: WORKLOADS.factoryFlash,
          contents: draftPrompt,
          responseSchema: DIGIBOOK_DRAFT_SCHEMA,
          config: { maxOutputTokens: 8192 },
          label: `digibook draft structured for ${atomId}`
        });

        const draftJson = draftRes.data;
        const draftMetadata = draftRes.metadata;
        const contentHash = buildContentHash(draftJson);

        const reviewPrompt = [
          'You are the RankCrackers Pro DigiBook reviewer.',
          `Review the drafted content for atom: ${atomId} against its academic scope.`,
          'Check for mathematical correctness, conceptual clarity, notation precision, and verify that the worked examples and self-check questions have correct keys.',
          JSON.stringify({ atom, draft: draftJson }, null, 2),
        ].join('\n');

        const reviewRes = await callStructuredWithRetries({
          workload: WORKLOADS.deepReasoningPro,
          contents: reviewPrompt,
          responseSchema: DIGIBOOK_REVIEW_SCHEMA,
          config: { maxOutputTokens: 8192 },
          label: `digibook review for ${atomId}`
        });

        const reviewJson = reviewRes.data;
        const reviewMetadata = reviewRes.metadata;

        const reviewHash = buildReviewHash({
          artifactId,
          contentHash,
          reviewerModel: 'gemini-3.1-pro-preview',
          reviewPayload: reviewJson
        });

        const missionDir = path.join(workspaceDirectory, missionId);
        fs.mkdirSync(missionDir, { recursive: true });
        
        fs.writeFileSync(
          path.join(missionDir, `digibook_${atomId}_draft.json`),
          JSON.stringify({ modelMetadata: draftMetadata, draft: draftJson }, null, 2),
          'utf8'
        );

        fs.writeFileSync(
          path.join(missionDir, `digibook_${atomId}_review.json`),
          JSON.stringify({ modelMetadata: reviewMetadata, review: reviewJson }, null, 2),
          'utf8'
        );

        if (reviewJson.verdict === 'PASS' && reviewJson.approvedAtomIds.includes(atomId)) {
          factoryState.digibook.jobs[atomId] = {
            atomId,
            status: JOB_STATE.APPROVED,
            artifactId,
            contentHash,
            reviewHash,
            draftFile: `digibook_${atomId}_draft.json`,
            reviewFile: `digibook_${atomId}_review.json`
          };
          approvedCount++;
          console.log(`[DigiBook Worker] Approved: ${atomId}`);
        } else {
          factoryState.digibook.jobs[atomId] = {
            atomId,
            status: JOB_STATE.HELD_REVIEW,
            draftFile: `digibook_${atomId}_draft.json`,
            reviewFile: `digibook_${atomId}_review.json`,
            blockingIssues: reviewJson.blockingIssues
          };
          factoryState.exceptionQueue.push({
            missionId,
            pillar: 'digibook',
            canonicalId: atomId,
            exceptionClass: 'PRO_REVIEW_DISPUTE',
            reason: `Pro reviewer flagged issues: ${reviewJson.blockingIssues.join('; ')}`,
            artifactId,
            contentHash,
            retryCount: 0
          });
          heldCount++;
          console.log(`[DigiBook Worker] Held: ${atomId}`);
        }

        atomsProcessedInThisRun++;
        factoryState.digibook.approved = approvedCount;
        factoryState.digibook.held = heldCount;
        factoryState.digibook.pending = pendingCount;
        if (checkpoint) checkpoint();

        // Throttle
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (err) {
        console.error(`[DigiBook Worker] Error processing atom ${atomId}:`, err.message);
        factoryState.digibook.jobs[atomId] = {
          atomId,
          status: JOB_STATE.FAILED,
          error: err.message
        };
        pendingCount++;
        atomsProcessedInThisRun++;
      }
    }
  }

  factoryState.digibook.approved = approvedCount;
  factoryState.digibook.held = heldCount;
  factoryState.digibook.pending = pendingCount;
  console.log(`[DigiBook Worker] Finished: Approved=${approvedCount}, Held=${heldCount}, Pending=${pendingCount}`);
}

module.exports = {
  runDigiBookWorker
};
