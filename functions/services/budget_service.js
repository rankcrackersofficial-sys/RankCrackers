const admin = require("firebase-admin");
const functions = require("firebase-functions");

/**
 * 🔱 BUDGET SERVICE
 * Tracks and enforces AI token consumption for Users and System.
 */

const MONTHLY_LIMIT = 500000; // 🔱 Hard Cap: 0.5M Tokens per User
const SYSTEM_DAILY_QUOTA = 2000000; // 🔱 Global Safety Limit: 2M Tokens/Day

/**
 * 🔱 QUOTA MONITORING
 * Blocks requests if daily system quota is exhausted.
 */
async function checkSystemQuota() {
  const dayId = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
  const dayRef = admin.firestore().collection('system_daily_usage').doc(dayId);
  const daySnap = await dayRef.get();

  if (daySnap.exists && daySnap.data().tokens >= SYSTEM_DAILY_QUOTA) {
    throw new functions.https.HttpsError('resource-exhausted', '🔱 SYSTEM DAILY QUOTA EXHAUSTED.');
  }
}

async function checkAiBudget(uid) {
  await checkSystemQuota();
  const userRef = admin.firestore().collection('admin_budgets').doc(uid);
  const budgetExceeded = await admin.firestore().runTransaction(async (transaction) => {
    const budgetDoc = await transaction.get(userRef);
    if (!budgetDoc.exists) return false;

    const bData = budgetDoc.data();
    // 🔱 Audit Fix: Change > to >= for strict enforcement
    if (bData.tokensUsed >= MONTHLY_LIMIT) return true;
    return false;
  });

  if (budgetExceeded) {
    throw new functions.https.HttpsError('resource-exhausted', '🔱 MONTHLY AI BUDGET DEPLETED.');
  }
}

async function incrementBudget(uid, tokens) {
  const userRef = admin.firestore().collection('admin_budgets').doc(uid);
  const dayId = new Date().toISOString().substring(0, 10);
  const dayRef = admin.firestore().collection('system_daily_usage').doc(dayId);

  const batch = admin.firestore().batch();
  batch.set(userRef, {
    tokensUsed: admin.firestore.FieldValue.increment(tokens),
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  batch.set(dayRef, {
    tokens: admin.firestore.FieldValue.increment(tokens),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await batch.commit();
}

/**
 * 🔱 SYSTEM BUDGET TRACKING (P12E)
 * Tracks global consumption by Scouts and Workers.
 */
async function trackSystemBudget(tokens, costEstimate = 0) {
  const monthId = new Date().toISOString().substring(0, 7); // YYYY-MM
  const dayId = new Date().toISOString().substring(0, 10);
  const sysRef = admin.firestore().collection('system_budget').doc(monthId);
  const dayRef = admin.firestore().collection('system_daily_usage').doc(dayId);

  const batch = admin.firestore().batch();
  batch.set(sysRef, {
    monthlyTokens: admin.firestore.FieldValue.increment(tokens),
    monthlyCostEstimate: admin.firestore.FieldValue.increment(costEstimate),
    lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  batch.set(dayRef, {
    tokens: admin.firestore.FieldValue.increment(tokens),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await batch.commit();
}

async function isAiEnabled() {
  const configDoc = await admin.firestore().collection('system_config').doc('global').get();
  if (configDoc.exists && configDoc.data().aiEnabled === false) return false;
  return true;
}

module.exports = {
  checkAiBudget,
  incrementBudget,
  trackSystemBudget,
  isAiEnabled
};
