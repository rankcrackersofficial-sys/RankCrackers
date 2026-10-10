const { GoogleGenAI } = require("@google/genai");

/**
 * Gemini AI Service v4.0
 * Task-aware model routing for backend/offline academic factory work.
 * Migrated to Vertex AI as PRIMARY provider with Developer API fallback.
 */

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000;

const GEMINI_MODELS = Object.freeze({
  PRO: "gemini-3.1-pro-preview",
  FLASH: "gemini-3.6-flash",
  LITE: "gemini-3.5-flash-lite",
  FLASH_FALLBACK: "gemini-3.5-flash",
});

// Lazy-initialized Vertex AI Client (PRIMARY)
let aiClient = null;
function getAiClient() {
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        vertexai: true,
        project: "rankcrackers-55",
        location: "us-central1"
      });
      console.log("VERTEX_AI_CLIENT (gemini_service): Lazily initialized.");
    } catch (e) {
      console.error("VERTEX_AI_CLIENT_INIT_ERROR: Failed to initialize Vertex AI client:", e.message);
    }
  }
  return aiClient;
}

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

  const modelResolution = resolveGeminiModel(workload);

  // Map to Vertex AI model names if calling Vertex
  let vertexModelName = modelResolution.model;
  if (vertexModelName === "gemini-3.6-flash") {
    vertexModelName = "gemini-2.5-flash";
  } else if (vertexModelName === "gemini-3.5-flash-lite") {
    vertexModelName = "gemini-2.5-flash-lite";
  } else if (vertexModelName === "gemini-3.1-pro-preview") {
    vertexModelName = "gemini-2.5-pro";
  } else if (vertexModelName === "gemini-3.5-flash") {
    vertexModelName = "gemini-2.5-flash";
  }

  const client = getAiClient();

  // 1. Try Vertex AI first (PRIMARY)
  if (client) {
    try {
      console.log(`VERTEX_AI: Requesting model=${vertexModelName} location=us-central1 project=rankcrackers-55`);
      const response = await client.models.generateContent({
        model: vertexModelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = response.text;
      if (!text) throw new Error("VERTEX_AI_EMPTY_RESPONSE");
      return text;
    } catch (vertexError) {
      console.error(`VERTEX_AI_FAILED (model=${vertexModelName}):`, vertexError.message);
      if (process.env.RC_DISABLE_PROVIDER_FALLBACK === "true") {
        throw vertexError;
      }
      // Fallback to Developer API (if API key is present)
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(`VERTEX_AI_FAILURE_AND_NO_FALLBACK: ${vertexError.message}`);
      }
      console.warn("VERTEX_AI_FAILED: Falling back to AI Studio Developer API...");
    }
  }

  // 2. Fallback legacy AI Studio path using Developer API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING_AND_VERTEX_UNAVAILABLE");
  }

  try {
    const aiStudio = new GoogleGenAI({ apiKey });
    console.log(`AI_STUDIO_FALLBACK: Requesting model=${modelResolution.model}`);
    const response = await aiStudio.models.generateContent({
      model: modelResolution.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text;
    if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
    return text;
  } catch (error) {
    console.error(`AI_STUDIO_API_ERROR (${modelResolution.workload}/${modelResolution.model}):`, error.message);
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