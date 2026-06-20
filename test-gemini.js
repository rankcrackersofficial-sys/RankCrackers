const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not set. Please set the GEMINI_API_KEY env var or use functions/.env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test(modelName) {
  console.log(`Testing model: ${modelName}`);
  try {
    const model = genAI.getGenerativeModel({
      model: modelName
    });

    const result = await model.generateContent(
      "Say hello"
    );

    console.log(`SUCCESS for ${modelName}:`);
    console.log(result.response.text());
    return true;
  } catch (err) {
    console.error(`ERROR for ${modelName}:`);
    console.error(err.message);
    return false;
  }
}

async function runTests() {
  const success25 = await test("gemini-2.5-flash");
  if (!success25) {
    await test("gemini-2.0-flash");
  }
}

runTests();
