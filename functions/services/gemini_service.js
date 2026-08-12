const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * 🔱 GEMINI AI SERVICE v2.0
 * Supports tiered model routing (Flash vs Pro).
 */

// 🔱 RATE LIMITER (In-memory for basic protection)
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000; // Reduced to 1s for higher throughput

const DEFAULT_PRO_MODEL = "gemini-2.5-pro";
const DEFAULT_FLASH_MODEL = "gemini-2.5-flash";

function resolveGeminiModel(modelType = "pro") {
  const explicitModel = (process.env.RC_VERTEX_MODEL || process.env.RC_GEMINI_MODEL || "").trim();
  if (explicitModel) return explicitModel;
  return modelType === "flash" ? DEFAULT_FLASH_MODEL : DEFAULT_PRO_MODEL;
}

async function callGemini(prompt, modelType = "pro") {
  const now = Date.now();
  if (now - lastRequestTime < MIN_INTERVAL_MS) {
    const wait = MIN_INTERVAL_MS - (now - lastRequestTime);
    await new Promise(r => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = resolveGeminiModel(modelType);

  try {
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
        }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");

    return text;

  } catch (error) {
    console.error(`🔱 GEMINI API ERROR (${modelType}):`, error.message);
    throw new Error(`GEMINI_FAILURE: ${error.message}`);
  }
}

/**
 * 🔱 WORKHORSE LAYER (High Volume / Low Cost)
 */
async function callFlash(prompt) {
    return await callGemini(prompt, "flash");
}

/**
 * 🔱 STRATEGIC LAYER (High Quality / Complex Tasks)
 */
async function callPro(prompt) {
    return await callGemini(prompt, "pro");
}

module.exports = {
  callGemini,
  callFlash,
  callPro,
  resolveGeminiModel
};
