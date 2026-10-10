import { MaterializationService } from '../academicFactory/services/materializationService';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'rankcrackers-55' });
  }
  const db = admin.firestore();

  const MISSION_ID = 'jee_main_2027';

  // 1. Get already published atom IDs
  const publishedSnap = await db.collection('micro_nodes')
    .where('examId', '==', MISSION_ID)
    .where('status', '==', 'published')
    .get();
  
  const publishedAtomIds = new Set<string>();
  publishedSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.id) {
      publishedAtomIds.add(data.id);
    }
  });

  console.log(`INITIAL_PUBLISHED_COUNT = ${publishedAtomIds.size}`);

  // 2. Load all APPROVED atoms from factory_state.json
  const factoryStatePath = path.resolve(__dirname, '../../../docs/patch_safety/jee_main_2026/factory_state.json');
  const factoryState = JSON.parse(fs.readFileSync(factoryStatePath, 'utf8'));

  const syllabusJobs = factoryState.syllabus.jobs;
  const eligibleAtomIds: string[] = [];

  for (const [key, job] of Object.entries(syllabusJobs)) {
    const jobData = job as any;
    if (jobData.status === 'APPROVED' && !publishedAtomIds.has(jobData.atomId)) {
      eligibleAtomIds.push(jobData.atomId);
    }
  }

  console.log(`TOTAL_ELIGIBLE_UNHYDRATED_APPROVED_ATOMS = ${eligibleAtomIds.length}`);

  if (eligibleAtomIds.length < 30) {
    console.error('Error: Not enough eligible unhydrated APPROVED atoms to run 3 autonomous batches of 10!');
    process.exit(1);
  }

  const service = new MaterializationService();

  // --- BATCH 1 ---
  const batch1 = eligibleAtomIds.slice(0, 10);
  console.log('STARTING BATCH 1 AUTONOMOUS PIPELINE...');
  const count1 = await service.materializeTranche(MISSION_ID, batch1);
  console.log(`BATCH_1_PUBLISHED_COUNT = ${count1}`);

  // --- BATCH 2 ---
  const batch2 = eligibleAtomIds.slice(10, 20);
  console.log('STARTING BATCH 2 AUTONOMOUS PIPELINE...');
  const count2 = await service.materializeTranche(MISSION_ID, batch2);
  console.log(`BATCH_2_PUBLISHED_COUNT = ${count2}`);

  // --- BATCH 3 ---
  const batch3 = eligibleAtomIds.slice(20, 30);
  console.log('STARTING BATCH 3 AUTONOMOUS PIPELINE...');
  const count3 = await service.materializeTranche(MISSION_ID, batch3);
  console.log(`BATCH_3_PUBLISHED_COUNT = ${count3}`);

  // Verify final total
  const finalSnap = await db.collection('micro_nodes')
    .where('examId', '==', MISSION_ID)
    .where('status', '==', 'published')
    .get();

  console.log(`FINAL_JEE_PUBLISHED_COUNT = ${finalSnap.size}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error running autonomous factory:', err);
  process.exit(1);
});
