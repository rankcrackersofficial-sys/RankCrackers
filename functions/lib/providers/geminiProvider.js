"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGemini = generateGemini;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
function cleanEnv(name) {
    const value = process.env[name];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}
function resolveGeminiProviderModel() {
    return (cleanEnv('RC_VERTEX_MODEL') ||
        cleanEnv('RC_GEMINI_MODEL') ||
        cleanEnv('RC_VERTEX_MODEL_FLASH') ||
        'gemini-3.6-flash');
}
async function generateGemini(prompt) {
    const modelName = resolveGeminiProviderModel();
    const model = genAI.getGenerativeModel({
        model: modelName,
    });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return {
        text: response,
        model: modelName,
    };
}
//# sourceMappingURL=geminiProvider.js.map