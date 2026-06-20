const admin = require("firebase-admin");

/**
 * 🔱 WORKER GOVERNANCE SERVICE
 * Constitutional authority for autonomous system entities.
 */

/**
 * Checks if a worker is permitted to execute based on Founder rules and budget.
 */
async function isWorkerEnabled(workerId) {
  const doc = await admin.firestore().collection('worker_registry').doc(workerId).get();
  if (!doc.exists) return true; // Bootstrap default

  const data = doc.data();

  // Rule 1: CRITICAL workers cannot be disabled
  if (data.priority === 'critical') return true;

  // Rule 2: Founder Master Switch
  if (data.enabled === false) return false;

  // Rule 3: Budget Protection
  if (data.monthlyTokenUsage >= data.monthlyTokenLimit) {
      console.warn(`🔱 GOVERNANCE: Worker ${workerId} paused. Token limit exceeded.`);
      return false;
  }
  if (data.monthlyCost >= data.monthlyCostLimit) {
      console.warn(`🔱 GOVERNANCE: Worker ${workerId} paused. Cost limit exceeded.`);
      return false;
  }

  return true;
}

/**
 * Retrieves the execution mode for the worker.
 * @returns 'fullAuto' | 'founderReview' | 'manualOnly'
 */
async function getWorkerMode(workerId) {
  const doc = await admin.firestore().collection('worker_registry').doc(workerId).get();
  // 🔱 Mission Zero Policy: Default to fullAuto if registry is not set up
  return doc.exists ? (doc.data().mode || 'fullAuto') : 'fullAuto';
}

/**
 * Updates worker telemetry and state.
 */
async function updateHeartbeat(workerId, telemetry = {}) {
  const now = admin.firestore.Timestamp.now();
  const update = {
    ...telemetry,
    lastHeartbeat: now,
    updatedAt: now
  };

  // Auto-set status to ONLINE on heartbeat
  update.status = 'ONLINE';

  if (telemetry.success) {
    update.lastSuccessAt = now;
  }

  if (telemetry.error) {
    update.errorCount = admin.firestore.FieldValue.increment(1);
    update.lastError = telemetry.error;
    update.lastErrorAt = now;
  }

  if (telemetry.tokens) {
    update.monthlyTokenUsage = admin.firestore.FieldValue.increment(telemetry.tokens);
    // Rough estimate: $1 per 1M tokens (depends on model)
    const costEstimate = (telemetry.tokens / 1000000) * 83.0; // In INR
    update.monthlyCost = admin.firestore.FieldValue.increment(costEstimate);
  }

  await admin.firestore().collection('worker_registry').doc(workerId).set(update, { merge: true });
}

module.exports = {
  isWorkerEnabled,
  getWorkerMode,
  updateHeartbeat
};
