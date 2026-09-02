import { MaterializationService } from '../academicFactory/services/materializationService';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'rankcrackers-55' });
  }

  const factoryStatePath = path.resolve(__dirname, '../../../docs/patch_safety/jee_main_2026/factory_state.json');
  const factoryState = JSON.parse(fs.readFileSync(factoryStatePath, 'utf8'));

  const syllabusJobs = factoryState.syllabus.jobs;
  const verifiedAtomIds: string[] = [];

  for (const [key, job] of Object.entries(syllabusJobs)) {
    if ((job as any).status === 'APPROVED') {
      verifiedAtomIds.push((job as any).atomId);
    }
  }

  console.log(`🔱 SCALE MATERIALIZATION: Total verified atoms in factory: ${verifiedAtomIds.length}`);

  const service = new MaterializationService();
  // Promoting in batches of 50 to avoid Firestore limits per batch
  const batchSize = 50;
  let totalPromoted = 0;

  for (let i = 0; i < verifiedAtomIds.length; i += batchSize) {
    const tranche = verifiedAtomIds.slice(i, i + batchSize);
    const count = await service.materializeTranche('jee_main_2027', tranche);
    totalPromoted += count;
  }

  console.log(`🔱 SCALE MATERIALIZATION COMPLETE: ${totalPromoted} atoms published to mission jee_main_2027.`);
  process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
