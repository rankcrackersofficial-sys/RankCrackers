import {
  GoogleGenerativeAI,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!,
);

function resolveGeminiProviderModel(): string {
  return (
    process.env.RC_VERTEX_MODEL ||
    process.env.RC_GEMINI_MODEL ||
    'gemini-2.5-pro'
  ).trim();
}

export async function generateGemini(
  prompt: string,
) {
  const model = genAI.getGenerativeModel({
    model: resolveGeminiProviderModel(),
  });

  const result = await model.generateContent(
    prompt,
  );

  const response = result.response.text();

  return {
    text: response,
  };
}
