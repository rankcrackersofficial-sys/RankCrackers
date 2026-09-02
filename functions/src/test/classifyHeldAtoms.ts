import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const factoryStatePath = path.resolve(__dirname, '../../../docs/patch_safety/jee_main_2026/factory_state.json');
  const factoryState = JSON.parse(fs.readFileSync(factoryStatePath, 'utf8'));

  const syllabusJobs = factoryState.syllabus.jobs;
  const classification: Record<string, number> = {};

  for (const [key, job] of Object.entries(syllabusJobs)) {
    const status = (job as any).status;
    if (status.startsWith('HELD')) {
      const error = (job as any).error || 'UNKNOWN';
      const key = `${status}:${error}`;
      classification[key] = (classification[key] || 0) + 1;
    }
  }

  console.log('🔱 JEE HELD ATOMS CLASSIFICATION:');
  console.log(JSON.stringify(classification, null, 2));
}

run();
