import { generateGemini } from './geminiProvider';

/**
 * PROVIDER EXECUTOR (Hardened v5.5 - Gemini Supremacy)
 */
export async function executeProvider(
  provider: string,
  prompt: string,
) {
  const activeProvider = 'geminiFlash';
  console.log(`Executing ${activeProvider} with prompt length: ${prompt.length} (Requested: ${provider})`);

  try {
    return await generateGemini(prompt);
  } catch (error) {
    console.error(`AI EXECUTION FAILURE [${activeProvider}]:`, error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error',
      tokensUsed: 0
    };
  }
}
