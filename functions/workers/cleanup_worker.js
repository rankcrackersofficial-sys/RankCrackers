const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * 🔱 SYSTEM CLEANUP WORKER (Hardened v8.2.3)
 * Resets AI Queue tasks that have been stuck in 'processing'.
 * Implements Retry Limit and Dead Letter redirection.
 */
exports.queueCleanupWorker = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async (context) => {
    console.log("🔱 CLEANUP: Checking for stuck tasks...");

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const stuckTasks = await admin.firestore().collection('ai_queue')
      .where('status', '==', 'processing')
      .where('processedAt', '<', thirtyMinutesAgo)
      .get();

    if (stuckTasks.empty) {
      console.log("🔱 CLEANUP: No stuck tasks found.");
      return null;
    }

    console.log(`🔱 CLEANUP: Found ${stuckTasks.size} stuck tasks. Analyzing retry counts...`);

    const batch = admin.firestore().batch();

    stuckTasks.forEach(doc => {
      const data = doc.data();
      const retryCount = (data.retryCount || 0) + 1;

      if (retryCount >= 3) {
        // 🔱 Audit Fix: Move to Dead Letter Queue (ai_failed_tasks) after 3 retries
        console.log(`🔱 CLEANUP: Task ${doc.id} exceeded retries. Moving to Failures.`);

        const failRef = admin.firestore().collection('ai_failed_tasks').doc(doc.id);
        batch.set(failRef, {
            ...data,
            status: 'failed_max_retries',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            error: 'Maximum retries (3) exceeded in processing state.'
        });

        batch.delete(doc.ref);
      } else {
        // 🔱 Audit Fix: Reset to 'received' and increment retryCount
        batch.update(doc.ref, {
          status: 'received',
          retryCount: retryCount,
          notes: `Reset by cleanup worker (Attempt ${retryCount}) at ${new Date().toISOString()}`
        });
      }
    });

    await batch.commit();
    return null;
  });
