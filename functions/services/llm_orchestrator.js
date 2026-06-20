const { callFlash, callPro } = require("./gemini_service");

/**
 * 🔱 UNIVERSAL LLM ORCHESTRATOR v11.0 (Tiered Sovereign Architecture)
 * Routes tasks to Gemini Flash or Gemini Pro based on constitutional importance.
 */

const FLASH_TASKS = [
  'SVO_EXTRACTION',
  'STRUCTURAL_SEGMENTATION',
  'DIGIBOOK',
  'MCQ',
  'REVISION',
  'INSIGHTS',
  'HEALTH_PING'
];

const PRO_TASKS = [
  'RECRUITMENT_NOTIFICATION',
  'SYLLABUS_CONSTITUTION',
  'REALM_SETUP',
  'IDENTITY_MAPPING',
  'SENTINEL_VERIFICATION',
  'QUALITY_AUDIT'
];

async function callLlm(prompt, taskType = 'GENERAL') {
  const type = taskType.toUpperCase();

  try {
    if (PRO_TASKS.includes(type)) {
        console.log(`🔱 ORCHESTRATOR: Routing Strategic Task (${type}) to Gemini PRO`);
        return await callPro(prompt);
    } else {
        console.log(`🔱 ORCHESTRATOR: Routing Workhorse Task (${type}) to Gemini FLASH`);
        return await callFlash(prompt);
    }
  } catch (error) {
    console.error(`🔱 ORCHESTRATOR FAILURE (${type}): ${error.message}`);
    throw error;
  }
}

module.exports = {
  callLlm,
  callFlash,
  callPro
};
