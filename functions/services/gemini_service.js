const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Gemini AI Service v3.0
 * Task-aware model routing for backend/offline academic factory work.
 */

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000;

const GEMINI_MODELS = Object.freeze({
  PRO: "gemini-3.1-pro-preview",
  FLASH: "gemini-3.6-flash",
  LITE: "gemini-3.5-flash-lite",
  FLASH_FALLBACK: "gemini-3.5-flash",
});

function cleanEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeGeminiWorkload(workload = "factoryFlash") {
  if (workload === "pro") return "deepReasoningPro";
  if (workload === "flash") return "factoryFlash";
  if (workload === "lite") return "bulkLite";
  return workload || "factoryFlash";
}

function resolveGeminiModel(workload = "factoryFlash") {
  const compatibilityOverride = cleanEnv("RC_VERTEX_MODEL") || cleanEnv("RC_GEMINI_MODEL");
  if (compatibilityOverride) {
    return {
      model: compatibilityOverride,
      source: "compatibility_override",
      workload: normalizeGeminiWorkload(workload),
      fallbackUsed: false,
    };
  }

  const normalized = normalizeGeminiWorkload(workload);

  if (normalized === "deepReasoningPro") {
    const override = cleanEnv("RC_VERTEX_MODEL_PRO");
    return {
      model: override || GEMINI_MODELS.PRO,
      source: override ? "task_override" : "policy_default",
      workload: normalized,
      fallbackUsed: false,
    };
  }

  if (normalized === "bulkLite") {
    const override = cleanEnv("RC_VERTEX_MODEL_LITE");
    return {
      model: override || GEMINI_MODELS.LITE,
      source: override ? "task_override" : "policy_default",
      workload: normalized,
      fallbackUsed: false,
    };
  }

  const override = cleanEnv("RC_VERTEX_MODEL_FLASH");
  return {
    model: override || GEMINI_MODELS.FLASH,
    source: override ? "task_override" : "policy_default",
    workload: "factoryFlash",
    fallbackUsed: false,
  };
}

async function callGemini(prompt, workload = "factoryFlash") {
  const now = Date.now();
  if (now - lastRequestTime < MIN_INTERVAL_MS) {
    const wait = MIN_INTERVAL_MS - (now - lastRequestTime);
    await new Promise(r => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelResolution = resolveGeminiModel(workload);

  try {
    const model = genAI.getGenerativeModel({
      model: modelResolution.model,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");

    return text;
  } catch (error) {
    console.error(`GEMINI API ERROR (${modelResolution.workload}/${modelResolution.model}):`, error.message);
    throw new Error(`GEMINI_FAILURE: ${error.message}`);
  }
}

async function callFlash(prompt) {
  return await callGemini(prompt, "factoryFlash");
}

async function callLite(prompt) {
  return await callGemini(prompt, "bulkLite");
}

async function callPro(prompt) {
  return await callGemini(prompt, "deepReasoningPro");
}

module.exports = {
  callGemini,
  callFlash,
  callLite,
  callPro,
  resolveGeminiModel,
  GEMINI_MODELS,
};