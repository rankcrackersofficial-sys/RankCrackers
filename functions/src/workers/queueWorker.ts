import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { executeProvider } from '../providers/providerExecutor';
import { buildPrompt } from '../providers/promptFactory';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const queueWorker = functions.firestore
  .document('ai_queue/{taskId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const taskId = context.params.taskId;
    const { type, provider, payload } = data;

    try {
      const prompt = buildPrompt(type, payload);
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
            workerVersion: "9.1.0-RECOVERY",
            provider: provider,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedBy: null, // 🔱 Required by Doc 78
            verifiedAt: null,
          }
        });

        console.log(`🔱 SENTINEL: Task ${taskId} staged for verification. Direct production write ERADICATED.`);
      } else {
        console.error(`AI Provider returned an invalid response for task ${taskId}`);
      }

      // Cleanup queue
      await snap.ref.delete();

    } catch (error) {
      console.error(`Worker failed for task ${taskId}:`, error);
    }
  });
