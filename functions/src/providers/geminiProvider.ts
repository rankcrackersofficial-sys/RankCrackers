import {
  GoogleGenerativeAI,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!,
);

function cleanEnv(name: string): string | null {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function resolveGeminiProviderModel(): string {
  return (
    cleanEnv('RC_VERTEX_MODEL') ||
    cleanEnv('RC_GEMINI_MODEL') ||
    cleanEnv('RC_VERTEX_MODEL_FLASH') ||
    'gemini-3.6-flash'
  );
}

export async function generateGemini(
  prompt: string,
) {
  const modelName = resolveGeminiProviderModel();
  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  const result = await model.generateContent(
    prompt,
  );

  const response = result.response.text();

  return {
    text: response,
    model: modelName,
  };
}