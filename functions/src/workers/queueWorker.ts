import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { executeProvider } from '../providers/providerExecutor';
import { buildPrompt } from '../providers/promptFactory';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * 🔱 LEGACY QUEUE QUARANTINE (AAF-004A)
 */
export const LEGACY_GENERIC_TYPES = ['mcq', 'digibook', 'revision'];

export const SPECIALIZED_TASK_TYPES = [
  'MANIFEST_KNOWLEDGE',
  'STRUCTURAL',
  'SVO_EXTRACTION',
  'ENCODING_NORMALIZATION',
  'pdfParse',
  'docxParse',
  'xlsxParse',
  'recruitment',
  'syllabus',
  'canonicalRepair'
];

/**
 * 🛡️ OWNERSHIP CLASSIFIERS
 */
export function isAafTask(data: any): boolean {
  return data?.queueContract === 'academic_factory_v1';
}

export function isSpecializedTask(data: any): boolean {
  return !!(data?.type && SPECIALIZED_TASK_TYPES.includes(data.type));
}

export function isLegacyGenericTask(data: any): boolean {
  if (!data || !data.type) return false;
  if (isAafTask(data)) return false;
  return LEGACY_GENERIC_TYPES.includes(data.type);
}

export const queueWorker = functions.firestore
  .document('ai_queue/{taskId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const taskId = context.params.taskId;
    const taskRef = snap.ref;

    // 1. 🛡️ AAF GUARD: AAF jobs have their own orchestration spine.
    if (isAafTask(data)) {
      console.log(`🔱 QUEUE QUARANTINE: Task ${taskId} is an AAF job. Ignoring.`);
      return;
    }

    // 2. 🛡️ SPECIALIZATION GUARD: Ignore types handled by dedicated workers.
    if (isSpecializedTask(data)) {
      console.log(`🔱 QUEUE QUARANTINE: Task ${taskId} type '${data.type}' is specialized. Ignoring.`);
      return;
    }

    // 3. 🛡️ GENERIC VALIDATION
    const isGeneric = isLegacyGenericTask(data);

    try {
      // 🛡️ ATOMIC CLAIM: Claim the task before deciding to process or fail-closed.
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

      // 4. 🛡️ UNKNOWN TASK FAIL-CLOSED (P0 REQUIREMENT)
      // Must happen AFTER claim to ensure status is persisted, but BEFORE BuildPrompt/Provider.
      if (!isGeneric) {
        const unknownType = data.type || 'MISSING_TYPE';
        console.error(`🔱 QUEUE: Task ${taskId} has unknown type '${unknownType}'. Failing closed.`);
        await taskRef.update({
          status: 'failed',
          error: `Unknown or unauthorized task type: ${unknownType}`,
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      const { type, provider, payload } = data;
      const prompt = buildPrompt(type, payload);

      // Final prompt safety check
      if (prompt === 'Unknown Task') {
        throw new Error(`Prompt factory rejected type: ${type}`);
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
            workerVersion: "9.2.1-FIX2",
            provider: provider,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedBy: null,
            verifiedAt: null,
          }
        });

        console.log(`🔱 SENTINEL: Task ${taskId} staged for verification.`);

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
