const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not set. Please set the GEMINI_API_KEY env var or use functions/.env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function list() {
  try {
    // The SDK might not have a direct listModels, we usually use the REST API for that
    // but let's see if we can get some info.
    console.log("Checking model availability...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("test");
    console.log("Gemini Pro Success:", result.response.text());
  } catch (err) {
    console.error("Gemini Pro Error:", err.message);
  }
}

list();
