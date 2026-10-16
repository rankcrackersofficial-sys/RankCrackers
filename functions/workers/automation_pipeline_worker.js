'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { callGemini } = require('../services/gemini_service');
const { isWorkerEnabled, updateHeartbeat } = require('../services/worker_service');
const { logAiAudit } = require('../services/audit_service');
const sanitizeJsonResponse = require('../helpers/sanitizer');
const {
  AUTO_STATUSES,
  buildAutomationPrompts,
  reconcileAutomationRun,
} = require('../services/automation_contract');

const WORKER_ID = 'automation_pipeline_worker';
const WORKER_VERSION = 'automation-first-v1';

function parseJson(text) {
  return JSON.parse(sanitizeJsonResponse(text));
}

async function setRun(ref, patch) {
  await ref.set({
    ...patch,
    workerId: WORKER_ID,
    workerVersion: WORKER_VERSION,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function createException(runRef, runId, result, run = {}) {
  const exceptionRef = admin.firestore().collection('automation_exceptions').doc(`${runId}_${Date.now()}`);
  await exceptionRef.set({
    runId,
    status: 'open',
    severity: result.exceptionSeverity || 'HIGH',
    reason: result.reason,
    confidence: result.confidence,
    reasonCode: result.reason,
    founderAction: 'POLICY_DECISION_ONLY',
    routineContentVerificationRequired: false,
    aiPolicyRecommendation: 'Keep this run in automated hold until the recorded evidence contract is satisfied.',
    ruleId: `AUTO_${result.reason}`,
    affectedItemsScope: {
      runId,
      domain: String(run.domain || 'general'),
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await setRun(runRef, { exceptionId: exceptionRef.id, exceptionStatus: 'open' });
}

async function autoPromoteTarget(run, result, runId) {
  if (!run.autoPromote || !run.target || result.status !== AUTO_STATUSES.AUTO_PASSED) return;
  const collection = String(run.target.collection || '');
  const docId = String(run.target.docId || '');
  if (collection !== 'sentinel_drafts' || !docId || collection.includes('/') || docId.includes('/')) {
    throw new Error('AUTOMATION_TARGET_NOT_ALLOWED');
  }

  await admin.firestore().collection(collection).doc(docId).set({
    status: 'verified',
    rawData: result.canonicalOutput,
    automationVerified: true,
    founderVerificationRequired: false,
    automationRunId: runId,
    automationConfidence: result.confidence,
    automationVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

exports.automationPipelineWorker = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB', secrets: ['GEMINI_API_KEY'] })
  .firestore
  .document('automation_runs/{runId}')
  .onCreate(async (snap, context) => {
    const runId = context.params.runId;
    const runRef = snap.ref;
    const run = snap.data() || {};

    if (!(await isWorkerEnabled(WORKER_ID))) {
      await setRun(runRef, { status: AUTO_STATUSES.AUTO_HOLD, reason: 'WORKER_DISABLED' });
      return null;
    }

    const input = run.input || {};
    const evidence = Array.isArray(run.evidence) ? run.evidence : [];
    if (!run.domain || (!Object.keys(input).length && evidence.length === 0)) {
      await setRun(runRef, {
        status: AUTO_STATUSES.AUTO_HOLD,
        reason: 'SOURCE_INPUT_OR_EVIDENCE_MISSING',
        publicationEligible: false,
      });
      await createException(runRef, runId, { reason: 'SOURCE_INPUT_OR_EVIDENCE_MISSING', exceptionSeverity: 'HIGH', confidence: 0 }, run);
      return null;
    }

    await updateHeartbeat(WORKER_ID, { activeRun: runId, status: 'ONLINE' });
    const prompts = buildAutomationPrompts({ domain: run.domain, input, evidence });

    try {
      await setRun(runRef, { status: AUTO_STATUSES.GENERATING, stage: 'generator' });
      const generator = parseJson(await callGemini(prompts.generator, 'factoryFlash'));
      await setRun(runRef, { generatorResult: generator, status: AUTO_STATUSES.VERIFYING, stage: 'independent_verifier' });

      const verifier = parseJson(await callGemini(prompts.verifier, 'deepReasoningPro'));
      await setRun(runRef, { verifierResult: verifier, status: AUTO_STATUSES.RECONCILING, stage: 'reconciler' });

      const result = reconcileAutomationRun({
        generator,
        verifier,
        minimumConfidence: Number(run.minimumConfidence || 0.9),
      });

      await setRun(runRef, {
        status: result.status,
        stage: 'complete',
        publicationEligible: result.publicationEligible,
        confidence: result.confidence,
        decisionReason: result.reason,
        canonicalOutput: result.canonicalOutput,
        founderVerificationRequired: false,
        founderPolicyOverrideAvailable: result.status === AUTO_STATUSES.AUTO_HOLD,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (result.status === AUTO_STATUSES.AUTO_HOLD) {
        await createException(runRef, runId, result, run);
      } else {
        await autoPromoteTarget(run, result, runId);
      }

      await logAiAudit({
        type: 'AUTOMATION_PIPELINE_DECISION',
        runId,
        status: result.status,
        confidence: result.confidence,
        publicationEligible: result.publicationEligible,
        workerVersion: WORKER_VERSION,
      });
      await updateHeartbeat(WORKER_ID, { success: true, activeRun: null });
      return result;
    } catch (error) {
      await setRun(runRef, {
        status: AUTO_STATUSES.FAILED,
        stage: 'failed',
        publicationEligible: false,
        founderVerificationRequired: false,
        error: error.message || String(error),
      });
      await updateHeartbeat(WORKER_ID, { error: error.message || String(error), activeRun: null });
      await logAiAudit({ type: 'AUTOMATION_PIPELINE_FAILED', runId, error: error.message || String(error), workerVersion: WORKER_VERSION });
      return null;
    }
  });

