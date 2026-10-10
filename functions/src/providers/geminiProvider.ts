import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        vertexai: true,
        project: "rankcrackers-55",
        location: "us-central1"
      });
      console.log("VERTEX_AI_CLIENT (geminiProvider): Lazily initialized.");
    } catch (e: any) {
      console.error("VERTEX_AI_INIT_ERROR in geminiProvider:", e.message);
    }
  }
  return aiClient;
}

function cleanEnv(name: string): string | null {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function resolveGeminiProviderModel(): string {
  const model = cleanEnv('RC_VERTEX_MODEL') ||
    cleanEnv('RC_GEMINI_MODEL') ||
    cleanEnv('RC_VERTEX_MODEL_FLASH');

  if (model) {
    return model;
  }
  return 'gemini-2.5-flash'; // Vertex fallback default
}

export async function generateGemini(prompt: string) {
  const modelName = resolveGeminiProviderModel();

  // Map model name if using the old AI Studio model name
  let mappedModelName = modelName;
  if (mappedModelName === 'gemini-3.6-flash') {
    mappedModelName = 'gemini-2.5-flash';
  }

  const client = getAiClient();

  if (client) {
    try {
      console.log(`VERTEX_AI (geminiProvider): Requesting model=${mappedModelName}`);
      const response = await client.models.generateContent({
        model: mappedModelName,
        contents: prompt
      });

      const text = response.text || '';
      return {
        text,
        model: mappedModelName
      };
    } catch (err: any) {
      console.error(`VERTEX_AI_FAILED in geminiProvider (model=${mappedModelName}):`, err.message);
      if (process.env.RC_DISABLE_PROVIDER_FALLBACK === 'true') {
        throw err;
      }
      // Fallback to Developer API if key is present
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(`VERTEX_AI_FAILURE_AND_NO_FALLBACK: ${err.message}`);
      }
    }
  }

  // Fallback to AI Studio
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING_AND_VERTEX_UNAVAILABLE');
  }

  const aiStudio = new GoogleGenAI({ apiKey });
  console.log(`AI_STUDIO_FALLBACK (geminiProvider): Requesting model=${modelName}`);
  const response = await aiStudio.models.generateContent({
    model: modelName,
    contents: prompt
  });

  return {
    text: response.text || '',
    model: modelName
  };
}