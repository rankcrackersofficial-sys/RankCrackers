const fs = require('fs');
const path = require('path');
const { generateFactoryContent } = require('./tools/student_pillars_r2_fasttrack/vertex_factory_client');

function safeJsonParse(text) {
  const trimmed = text.trim();
  const sanitize = (value) => value.replace(/\\(?!([\"\\/bfnrt]|u[0-9a-fA-F]{4}))/g, "\\\\");
  
  let cleanText = trimmed;
  const start = trimmed.indexOf('{');
  if (start >= 0) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            cleanText = trimmed.slice(start, i + 1);
            break;
          }
        }
      }
    }
  }

  try {
    return JSON.parse(sanitize(cleanText));
  } catch (error) {
    console.error("JSON PARSE EXCEPTION:", error);
    // Print snippet around the error
    let pos = -1;
    const match = error.message.match(/position (\d+)/);
    if (match) {
      pos = parseInt(match[1], 10);
    }
    if (pos >= 0) {
      console.error("JSON PARSE ERROR Snippet around position " + pos + ":");
      console.error("--------------------------------------------------");
      console.error(cleanText.slice(Math.max(0, pos - 100), Math.min(cleanText.length, pos + 100)));
      console.error("--------------------------------------------------");
    } else {
      console.error("Full clean text of failed parsing:");
      console.error(cleanText);
    }
    throw error;
  }
}

async function test() {
  process.env.GOOGLE_CLOUD_PROJECT = 'rankcrackers-55';
  
  const slotId = 'macro_test_5';
  const phaseId = 'phase_2';
  const plan = JSON.parse(fs.readFileSync('assets/data/preview/jee_main_2027/crucible_preview_plan.json', 'utf8'));
  const phaseSchedules = plan.schedules.filter((schedule) => schedule.phaseId === phaseId);
  const phaseAtomIds = [...new Set(phaseSchedules.flatMap((schedule) => schedule.assignedAtomIds || []))];
  const selectedAtoms = phaseAtomIds.slice(0, 18).map(id => {
    return { atomId: id, topic: "Mock Topic" };
  });

  const prompt = [
    `You are creating a RankCrackers internal JEE Main Macro assessment draft.`,
    'Return strict JSON only.',
    `Create exactly 12 questions for ${slotId} from the provided source atoms.`,
    'Mix Physics/Chemistry/Mathematics according to the provided atoms.',
    JSON.stringify({ slotId, phaseId, selectedAtoms }, null, 2),
  ].join('\n');

  for (let i = 0; i < 15; i++) {
    console.log(`Running generation iteration ${i+1}...`);
    try {
      const draft = await generateFactoryContent({
        workload: "factoryFlash",
        contents: prompt,
        config: { maxOutputTokens: 8192, responseMimeType: "application/json" }
      });
      safeJsonParse(draft.text);
      console.log(`Iteration ${i+1} parsed successfully!`);
    } catch (err) {
      if (err.message.includes('Resource exhausted') || err.message.includes('429')) {
        console.log("Transient rate limit on iteration " + (i+1) + ", waiting 30s...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        i--; // retry this iteration
        continue;
      }
      console.error(`Iteration ${i+1} failed!`, err);
      break;
    }
    console.log("Sleeping 10s between iterations...");
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

test();
