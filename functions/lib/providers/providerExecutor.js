"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeProvider = executeProvider;
/**
 * 🔱 PROVIDER EXECUTOR (Hardened v5.5 - Gemini Supremacy)
 */
async function executeProvider(provider, prompt) {
    // 🔱 Force all requests to Gemini regardless of requested provider
    const activeProvider = 'geminiFlash';
    console.log(`Executing ${activeProvider} with prompt length: ${prompt.length} (Requested: ${provider})`);
    try {
        return await executeGemini(prompt);
    }
    catch (error) {
        console.error(`AI EXECUTION FAILURE [${activeProvider}]:`, error);
        return {
            error: true,
            message: error instanceof Error ? error.message : 'Unknown error',
            tokensUsed: 0
        };
    }
}
async function executeGemini(prompt) {
    // 🔱 MOCK GEMINI CALL (Replace with real SDK call)
    return {
        text: "Generated content from Gemini Flash",
        tokensUsed: 800,
    };
}
//# sourceMappingURL=providerExecutor.js.map