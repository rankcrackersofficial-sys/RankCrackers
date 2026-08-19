"use strict";

const fs = require('fs');
const path = require('path');
const { callStructuredWithRetries, WORKLOADS } = require('./factory_client');
const { buildArtifactId, buildContentHash, buildReviewHash } = require('./artifact_identity');
const { JOB_STATE } = require('./factory_job_states');

const SYLLABUS_REVIEW_SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["PASS", "FAIL"] },
    reason: { type: "STRING" }
  },
  required: ["verdict", "reason"]
};

async function runSyllabusWorker({ manifest, factoryState, policy, workspaceDirectory, atoms, checkpoint }) {
  if (!policy.workers.sourceRecovery.enabled) {
    console.log('[Syllabus Worker] Disabled by policy.');
    return;
  }

  console.log('[Syllabus Worker] Starting syllabus source validation...');
  const sourceIndexRaw = manifest.officialSourceIndex || {};
  let sourceIndex = sourceIndexRaw;

  // If the source index is in the { items: [...] } format, convert to map
  if (sourceIndexRaw.items && Array.isArray(sourceIndexRaw.items)) {
    sourceIndex = sourceIndexRaw.items.reduce((acc, item) => {
      acc[item.atomId] = item;
      return acc;
    }, {});
  }

  const missionId = manifest.missionId;

  if (!factoryState.syllabus.jobs) {
    factoryState.syllabus.jobs = {};
  }

  let verifiedCount = 0;
  let heldCount = 0;
  let pendingCount = 0;

  let atomsProcessedInThisRun = 0;
  for (const atom of atoms) {
    const atomId = atom.atomId;
    
    const existingJob = factoryState.syllabus.jobs[atomId];
    if (existingJob && (existingJob.status === JOB_STATE.APPROVED || existingJob.status === JOB_STATE.HELD_SOURCE)) {
      if (existingJob.status === JOB_STATE.APPROVED) verifiedCount++;
      else heldCount++;
      continue;
    }

    const sourceEntry = sourceIndex[atomId];
    if (!sourceEntry) {
      factoryState.syllabus.jobs[atomId] = {
        atomId,
        status: JOB_STATE.HELD_SOURCE,
        error: 'SOURCE_MISSING'
      };
      factoryState.exceptionQueue.push({
        missionId,
        pillar: 'syllabus',
        canonicalId: atomId,
        exceptionClass: 'SOURCE_MISSING',
        reason: `No source mapping found in manifest officialSourceIndex for atom: ${atomId}`,
        retryCount: 0
      });
      heldCount++;
      continue;
    }

    const sourceInfo = sourceEntry.unitSource || sourceEntry;
    if (!sourceInfo.locator || !sourceInfo.sourceHash) {
      factoryState.syllabus.jobs[atomId] = {
        atomId,
        status: JOB_STATE.HELD_SOURCE,
        error: 'SOURCE_AMBIGUOUS'
      };
      factoryState.exceptionQueue.push({
        missionId,
        pillar: 'syllabus',
        canonicalId: atomId,
        exceptionClass: 'SOURCE_AMBIGUOUS',
        reason: `Locator or sourceHash missing in officialSourceIndex for atom: ${atomId}`,
        retryCount: 0
      });
      heldCount++;
      continue;
    }

    try {
      const artifactId = buildArtifactId({ missionId, pillar: 'syllabus', canonicalId: atomId });
      const contentPayload = {
        atomId,
        subject: atom.subject,
        unit: sourceInfo.unit,
        chapter: sourceInfo.chapter,
        locator: sourceInfo.locator,
        sourceHash: sourceInfo.sourceHash
      };
      const contentHash = buildContentHash(contentPayload);

      const reviewPrompt = [
        'You are the RankCrackers Pro syllabus structure reviewer.',
        'Adjudicate whether the following syllabus atom topic mapping matches the official source references.',
        JSON.stringify({ atom, contentPayload }, null, 2)
      ].join('\n');

      const res = await callStructuredWithRetries({
        workload: WORKLOADS.deepReasoningPro,
        contents: reviewPrompt,
        responseSchema: SYLLABUS_REVIEW_SCHEMA,
        config: { maxOutputTokens: 2048 },
        label: `syllabus pro review for ${atomId}`
      });

      const reviewJson = res.data;
      const reviewHash = buildReviewHash({
        artifactId,
        contentHash,
        reviewerModel: 'gemini-3.1-pro-preview',
        reviewPayload: reviewJson
      });

      if (reviewJson.verdict === 'PASS') {
        factoryState.syllabus.jobs[atomId] = {
          atomId,
          status: JOB_STATE.APPROVED,
          artifactId,
          contentHash,
          reviewHash,
          locator: sourceInfo.locator,
          sourceHash: sourceInfo.sourceHash
        };
        verifiedCount++;
      } else {
        factoryState.syllabus.jobs[atomId] = {
          atomId,
          status: JOB_STATE.HELD_SOURCE,
          reviewVerdict: 'FAIL',
          reason: reviewJson.reason
        };
        factoryState.exceptionQueue.push({
          missionId,
          pillar: 'syllabus',
          canonicalId: atomId,
          exceptionClass: 'SOURCE_AMBIGUOUS',
          reason: `Pro reviewer rejected the mapping: ${reviewJson.reason}`,
          artifactId,
          contentHash,
          retryCount: 0
        });
        heldCount++;
      }

      atomsProcessedInThisRun++;
      if (atomsProcessedInThisRun >= 10 && checkpoint) {
        factoryState.syllabus.verified = verifiedCount;
        factoryState.syllabus.held = heldCount;
        factoryState.syllabus.pending = pendingCount;
        checkpoint();
        atomsProcessedInThisRun = 0;
      }

    } catch (err) {
      console.error(`[Syllabus Worker] Error processing atom ${atomId}:`, err.message);
      factoryState.syllabus.jobs[atomId] = {
        atomId,
        status: JOB_STATE.FAILED,
        error: err.message
      };
      pendingCount++;
    }
  }

  factoryState.syllabus.verified = verifiedCount;
  factoryState.syllabus.held = heldCount;
  factoryState.syllabus.pending = pendingCount;
  console.log(`[Syllabus Worker] Finished: Verified=${verifiedCount}, Held=${heldCount}, Pending=${pendingCount}`);
}

module.exports = {
  runSyllabusWorker
};
