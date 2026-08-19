const { generateStructuredFactoryContent } = require('./tools/student_pillars_r2_fasttrack/vertex_factory_client');
const { DIGIBOOK_DRAFT_SCHEMA } = require('./tools/student_pillars_r2_fasttrack/digibook_draft_schema');

async function test() {
  process.env.GOOGLE_CLOUD_PROJECT = 'rankcrackers-55';
  
  const slim = {
    atomId: "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_3944DA40_CH001",
    subject: "Chemistry",
    unit: "General Unit",
    chapter: "General Chapter",
    topic: "Carboxylic Acids: Acidic Strength And Factors Affecting It.",
    sourceTraceStatus: "SOURCE_TRACE_PRESENT"
  };

  const prompt = [
    'Create a RankCrackers DigiBook internal draft object for the following JEE Main atom.',
    'Provide concepts explanation, formulaRegister, commonMisconceptions, workedExamples, and selfChecks.',
    'Do not fabricate PYQ claims.',
    JSON.stringify(slim, null, 2),
  ].join('\n');

  try {
    const res = await generateStructuredFactoryContent({
      workload: "factoryFlash",
      contents: prompt,
      responseSchema: DIGIBOOK_DRAFT_SCHEMA,
      config: { maxOutputTokens: 4000 }
    });
    console.log("Success! Parsed data:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Failed!");
    console.error(err);
    if (err.cause) {
      console.error("Cause:", err.cause);
    }
    // Call raw generateContent to see what it returned
    try {
      const { createVertexFactoryClient, resolveModel } = require('./tools/student_pillars_r2_fasttrack/vertex_factory_client');
      const vertex = createVertexFactoryClient();
      const routing = resolveModel("factoryFlash");
      const rawRes = await vertex.client.models.generateContent({
        model: routing.model,
        contents: prompt,
        config: {
          maxOutputTokens: 4000,
          responseMimeType: "application/json",
          responseSchema: DIGIBOOK_DRAFT_SCHEMA,
        }
      });
      console.log("Raw Response text property:", rawRes.text);
      console.log("Raw Response candidates:", JSON.stringify(rawRes.candidates || null, null, 2));
    } catch (e2) {
      console.error("Raw test also failed:", e2);
    }
  }
}

test();
