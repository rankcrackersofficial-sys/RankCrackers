import {
  GoogleGenerativeAI,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!,
);

export async function generateGemini(
  prompt: string,
) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
  });

  const result = await model.generateContent(
    prompt,
  );

  const response = result.response.text();

  return {
    text: response,
  };
}
