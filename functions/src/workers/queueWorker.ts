import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { executeProvider } from '../providers/providerExecutor';
import { buildPrompt } from '../providers/promptFactory';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * 🔱 LEGACY QUEUE QUARANTINE (AAF-004A)
 * Tasks handled by specialized workers or the new AAF system must be ignored by this worker.
 */
export const SPECIALIZED_TASK_TYPES = [
  'MANIFEST_KNOWLEDGE',
  'STRUCTURAL',
  'SVO_EXTRACTION',
  'ENCODING_NORMALIZATION',
  'pdfParse',
  'docxParse',
  'xlsxParse'
];

/**
 * 🛡️ OWNERSHIP CLASSIFIER
 * Decides if a task document should be handled by the legacy generic worker.
 */
export function isLegacyGenericTask(data: any): boolean {
  if (!data || !data.type) return false;

  // 1. AAF Guard: Locked queue discriminator
  if (data.queueContract === 'academic_factory_v1') return false;

  // 2. Specialized Type Guard
  if (SPECIALIZED_TASK_TYPES.includes(data.type)) return false;

  return true;
}

export const queueWorker = functions.firestore
  .document('ai_queue/{taskId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const taskId = context.params.taskId;

    // 🛡️ OWNERSHIP CHECK
    if (!isLegacyGenericTask(data)) {
      console.log(`🔱 QUEUE QUARANTINE: Task ${taskId} is AAF or Specialized. Ignoring.`);
      return;
    }

    const { type, provider, payload } = data;
    const taskRef = snap.ref;

    try {
      // 🛡️ ATOMIC CLAIM: Ensure this generic worker claims the task before processing.
      const claimed = await admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists) return false;
        const currentStatus = doc.data()?.status;

        // Only process if status is 'received' (initial) and not already processing.
        if (currentStatus !== 'received') return false;

        transaction.update(taskRef, {
          status: 'processing',
          claimedBy: 'legacy_generic_worker',
          processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return true;
      });

      if (!claimed) {
        console.log(`🔱 QUEUE: Task ${taskId} already claimed or status changed. Skipping.`);
        return;
      }

      const prompt = buildPrompt(type, payload);

      // 🛡️ SAFETY: Unknown prompts (default 'Unknown Task') must not be executed.
      if (prompt === 'Unknown Task') {
        console.error(`🔱 QUEUE: Task ${taskId} has unknown type contract '${type}'. Failing closed.`);
        await taskRef.update({
          status: 'failed',
          error: `Unknown task type contract: ${type}`,
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      const response = await executeProvider(provider, prompt);

      // 🔱 AUDIT-01-F001 REMEDIATION: Redirect all output to Sentinel Isolation Zone
      if (response && 'text' in response) {
        await admin.firestore().collection('sentinel_drafts').doc(taskId).set({
          id: taskId,
          sourceId: payload.id || 'system_generated',
          type: type,
          status: 'under_review',
          rawData: response.text,
          metadata: {
            topic: payload.topic,
            originalPayload: payload,
          },
          audit: {
            workerVersion: "9.2.0-QUARANTINE",
            provider: provider,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedBy: null,
            verifiedAt: null,
          }
        });

        console.log(`🔱 SENTINEL: Task ${taskId} staged for verification.`);

        // 🔱 P0 FIX: Update status instead of deleting.
        await taskRef.update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        const errorMsg = response?.message || 'AI Provider returned an invalid response';
        console.error(`AI Provider returned an invalid response for task ${taskId}: ${errorMsg}`);

        await taskRef.update({
          status: 'failed',
          error: errorMsg,
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

    } catch (error) {
      console.error(`Worker failed for task ${taskId}:`, error);
      try {
        await taskRef.update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown internal error',
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (updateErr) {
        console.error(`Failed to update error status for task ${taskId}:`, updateErr);
      }
    }
  });
