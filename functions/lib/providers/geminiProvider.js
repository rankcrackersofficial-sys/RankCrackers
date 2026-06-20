"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGemini = void 0;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function generateGemini(prompt) {
    const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
    });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return {
        text: response,
    };
}
exports.generateGemini = generateGemini;
//# sourceMappingURL=geminiProvider.js.map