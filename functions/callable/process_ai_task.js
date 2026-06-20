const functions = require("firebase-functions");
const { callGemini } = require("../services/gemini_service");
const { logAiAudit } = require("../services/audit_service");
const { checkAiBudget, incrementBudget, isAiEnabled } = require("../services/budget_service");
const calculateTokenEstimate = require("../helpers/token_estimator");
const sanitizeJsonResponse = require("../helpers/sanitizer");
const getRefineryPrompt = require("../helpers/prompts");

/**
 * 🔱 SOVEREIGN AI GATEWAY (V2 Call - Gemini Supremacy)
 */
exports.processAITask = functions
  .runWith({
    secrets: ["GEMINI_API_KEY"]
  })
  .https.onCall(async (data, context) => {
    const { auth } = context;
    if (!auth || !auth.token.admin) throw new functions.https.HttpsError('permission-denied', '🔱 COMMAND DENIED.');

    const { taskType, provider: requestedProvider, payload } = data;
    const uid = auth.uid;
    const startTime = Date.now();
    const activeProvider = 'geminiFlash'; // 🔱 All traffic routed to Gemini

    // 🔱 KILL SWITCH & BUDGET PROTECTION
    if (!(await isAiEnabled())) {
      throw new functions.https.HttpsError('unavailable', '🔱 AI SYSTEMS ARE CURRENTLY OFFLINE (KILL SWITCH ACTIVE).');
    }

    await checkAiBudget(uid);

    try {
      const prompt = getRefineryPrompt(taskType, payload);

      console.log(`🔱 AI GATEWAY: Processing ${taskType} via ${activeProvider} (Requested: ${requestedProvider})`);

      const responseText = await callGemini(prompt);
      const result = JSON.parse(sanitizeJsonResponse(responseText));

      const estTokens = calculateTokenEstimate(prompt, result);

      // Update Budget
      await incrementBudget(uid, estTokens);

      await logAiAudit({
        uid,
        taskType,
        provider: activeProvider,
        payloadId: payload.id,
        latency: Date.now() - startTime,
        status: 'success',
        tokens: estTokens
      });

      return result;

    } catch (error) {
      await logAiAudit({ uid, taskType, provider: activeProvider, status: 'failed', error: error.message });
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'AI Refinery Failed: ' + error.message);
    }
  }
);
